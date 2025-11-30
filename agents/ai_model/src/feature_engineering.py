import json
import math
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Paths
DATA_PATH = Path("agents/ai_model/data/transactions.json")
FEATURES_PATH = Path("agents/ai_model/data/features.csv")
DAILY_PATH = Path("agents/ai_model/data/daily_features.csv")

# -------------------------------
# Step 1: Load and normalize data
# -------------------------------

def load_transactions(path: Path = DATA_PATH) -> pd.DataFrame:
    """
    Load raw transactions from JSON and flatten top-level fields.
    Ensures block_time is parsed to pandas.Timestamp.
    """
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    df = pd.json_normalize(data, sep="_")
    if "block_time" in df.columns:
        df["block_time"] = pd.to_datetime(df["block_time"], errors="coerce")
    return df


def explode_io(df: pd.DataFrame) -> pd.DataFrame:
    """
    Explode inputs and outputs into row-level interactions.
    Produces a unified frame with columns:
      - address, direction ('in' for inputs, 'out' for outputs), tx_hash, block_time
      - lovelace, ada
      - optional: data_hash, reference_script_hash, collateral (if present in data)
    """
    # Explode outputs
    outputs = df.explode("outputs").reset_index(drop=True)
    outputs["outputs"] = outputs["outputs"].fillna({})
    out_df = pd.json_normalize(outputs["outputs"])
    out_df["direction"] = "out"
    out_df["tx_hash"] = outputs["tx_hash"]
    out_df["block_time"] = outputs["block_time"]

    # Carry forward optional fields from parent tx (if present)
    for col in ["data_hash", "reference_script_hash", "collateral"]:
        if col in outputs.columns:
            out_df[col] = outputs[col]

    # Explode inputs
    inputs = df.explode("inputs").reset_index(drop=True)
    inputs["inputs"] = inputs["inputs"].fillna({})
    in_df = pd.json_normalize(inputs["inputs"])
    in_df["direction"] = "in"
    in_df["tx_hash"] = inputs["tx_hash"]
    in_df["block_time"] = inputs["block_time"]

    # Carry forward optional fields from parent tx (if present)
    for col in ["data_hash", "reference_script_hash", "collateral"]:
        if col in inputs.columns:
            in_df[col] = inputs[col]

    # Combine
    io_df = pd.concat([out_df, in_df], ignore_index=True)

    # Normalize lovelace amounts to ADA
    if "amount" in io_df.columns:
        io_df["lovelace"] = io_df["amount"].apply(
            lambda x: int(x[0]["quantity"]) if isinstance(x, list) and x else 0
        )
        io_df["ada"] = io_df["lovelace"] / 1_000_000
    else:
        io_df["lovelace"] = 0
        io_df["ada"] = 0.0

    # Address may be under 'address' key in normalized inputs/outputs
    if "address" not in io_df.columns:
        io_df["address"] = None

    # Transaction day
    io_df["date"] = io_df["block_time"].dt.date

    # Keep only necessary columns
    keep_cols = [
        "address", "direction", "tx_hash", "block_time", "date",
        "lovelace", "ada", "data_hash", "reference_script_hash", "collateral"
    ]
    io_df = io_df[[c for c in keep_cols if c in io_df.columns]]

    return io_df


# -----------------------------------
# Step 2: Aggregate per address (volume)
# -----------------------------------

def aggregate_volume_features(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute core volume features per address.
    """
    io_df = io_df.dropna(subset=["address"])

    grouped = io_df.groupby("address").agg(
        tx_count=("tx_hash", "nunique"),
        total_received=("ada", lambda x: x[io_df.loc[x.index, "direction"] == "out"].sum()),
        total_sent=("ada", lambda x: x[io_df.loc[x.index, "direction"] == "in"].sum()),
        max_tx_size=("ada", "max"),
        avg_tx_size=("ada", "mean"),
    ).reset_index()

    grouped["net_balance_change"] = grouped["total_received"] - grouped["total_sent"]

    return grouped


# -----------------------------------
# Step 3: Behavioral features
# -----------------------------------

def compute_unique_counterparties(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Distinct other addresses each address interacted with across transactions.
    """
    io_df = io_df.dropna(subset=["address", "tx_hash"])
    counterparties_map: Dict[str, set] = {}

    for tx_hash, sub in io_df.groupby("tx_hash"):
        addresses = sub["address"].dropna().unique()
        for addr in addresses:
            others = set(addresses) - {addr}
            if addr not in counterparties_map:
                counterparties_map[addr] = set()
            counterparties_map[addr].update(others)

    return pd.DataFrame(
        [(addr, len(others)) for addr, others in counterparties_map.items()],
        columns=["address", "unique_counterparties"]
    )


def compute_tx_frequency(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Average transactions per active day.
    """
    io_df = io_df.dropna(subset=["address", "date"])
    daily_counts = io_df.groupby(["address", "date"])["tx_hash"].nunique().reset_index(name="txs_on_day")
    active_days = daily_counts.groupby("address")["date"].nunique().reset_index(name="active_days")
    tx_count = io_df.groupby("address")["tx_hash"].nunique().reset_index(name="tx_count")
    freq = tx_count.merge(active_days, on="address", how="left")
    freq["tx_per_day"] = freq["tx_count"] / freq["active_days"].replace(0, np.nan)
    return freq[["address", "tx_per_day", "active_days"]]


def compute_burstiness(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Variance of inter-transaction time gaps in seconds per address.
    """
    io_df = io_df.dropna(subset=["address", "block_time"])
    burstiness: List[Tuple[str, float]] = []

    for addr, sub in io_df.groupby("address"):
        times = sub["block_time"].dropna().sort_values().values
        if len(times) > 1:
            diffs = np.diff(times).astype("timedelta64[s]").astype(int)
            var = float(np.var(diffs)) if len(diffs) > 0 else 0.0
            burstiness.append((addr, var))
        else:
            burstiness.append((addr, 0.0))

    return pd.DataFrame(burstiness, columns=["address", "burstiness"])


def compute_collateral_ratio(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Fraction of rows flagged as collateral per address (if collateral column exists).
    """
    if "collateral" not in io_df.columns:
        return pd.DataFrame(columns=["address", "collateral_ratio"])
    tmp = io_df.dropna(subset=["address"])
    # Treat truthy collateral as 1, else 0
    coll = tmp.assign(collateral_flag=tmp["collateral"].astype(float).fillna(0.0)).groupby("address")[
        "collateral_flag"
    ].mean().reset_index(name="collateral_ratio")
    return coll


def compute_smart_contract_flag(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Flag addresses with any interaction having data_hash or reference_script_hash.
    """
    tmp = io_df.dropna(subset=["address"])
    flags = tmp.groupby("address").apply(
        lambda sub: int(sub.get("data_hash", pd.Series([None])).notna().any()
                        or sub.get("reference_script_hash", pd.Series([None])).notna().any())
    ).reset_index(name="smart_contract_flag")
    return flags


# -----------------------------------
# Step 3+: Advanced compliance-grade features
# -----------------------------------

def compute_daily_aggregates(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Daily aggregates per address:
      - daily_received, daily_sent, daily_net
      - daily_max_tx: largest transaction (ADA) on the day
    """
    tmp = io_df.dropna(subset=["address", "date"])

    daily_received = tmp[tmp["direction"] == "out"].groupby(["address", "date"])["ada"].sum().reset_index(name="daily_received")
    daily_sent = tmp[tmp["direction"] == "in"].groupby(["address", "date"])["ada"].sum().reset_index(name="daily_sent")

    daily = pd.merge(daily_received, daily_sent, on=["address", "date"], how="outer").fillna(0.0)
    daily["daily_net"] = daily["daily_received"] - daily["daily_sent"]

    # Largest transaction per day (consider both in and out amounts)
    daily_max_out = tmp[tmp["direction"] == "out"].groupby(["address", "date"])["ada"].max().reset_index(name="daily_max_out")
    daily_max_in = tmp[tmp["direction"] == "in"].groupby(["address", "date"])["ada"].max().reset_index(name="daily_max_in")

    daily_full = daily.merge(daily_max_out, on=["address", "date"], how="left").merge(
        daily_max_in, on=["address", "date"], how="left"
    )
    daily_full["daily_max_tx"] = daily_full[["daily_max_out", "daily_max_in"]].max(axis=1).fillna(0.0)

    return daily_full


def compute_rolling_features(daily_df: pd.DataFrame, window_days: int = 7) -> pd.DataFrame:
    """
    Rolling window features per address:
      - rolling_avg_tx_size
      - rolling_tx_frequency (avg tx/day)
      - rolling_net (mean net over window)
    Assumes daily_df has one row per (address, date) with daily counts or sums.
    """
    # Prepare base shape: ensure continuous dates per address (optional: leave sparse to keep performance)
    base = daily_df.copy()
    base = base.sort_values(["address", "date"])

    # Create a proxy for 'transactions per day' from available data:
    # If you have a precise txs_on_day from raw, use that; else estimate by nonzero sums:
    base["txs_on_day"] = (
        (base["daily_received"] > 0).astype(int) +
        (base["daily_sent"] > 0).astype(int)
    ).clip(lower=0)

    # Rolling computations per address
    rolled = []
    for addr, sub in base.groupby("address"):
        sub = sub.sort_values("date")
        # Use rolling with window size; center=False uses trailing window
        r_avg_size = sub["daily_max_tx"].rolling(window_days).mean()
        r_freq = sub["txs_on_day"].rolling(window_days).mean()
        r_net = sub["daily_net"].rolling(window_days).mean()

        out = pd.DataFrame({
            "address": addr,
            "date": sub["date"].values,
            "rolling_avg_tx_size": r_avg_size.values,
            "rolling_tx_frequency": r_freq.values,
            "rolling_net": r_net.values
        })
        rolled.append(out)

    rolled_df = pd.concat(rolled, ignore_index=True)
    return rolled_df


def compute_high_value_ratio(io_df: pd.DataFrame, threshold_ada: float = 100_000.0) -> pd.DataFrame:
    """
    Fraction of transactions above threshold_ada per address.
    """
    tmp = io_df.dropna(subset=["address"])
    tmp["is_high_value"] = (tmp["ada"] >= threshold_ada).astype(int)
    hv = tmp.groupby("address")["is_high_value"].mean().reset_index(name="high_value_ratio")
    return hv


def compute_counterparty_diversity(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Counterparty diversity index = unique counterparties / tx_count.
    """
    unique_cp = compute_unique_counterparties(io_df)
    tx_count = io_df.dropna(subset=["address"]).groupby("address")["tx_hash"].nunique().reset_index(name="tx_count")
    div = unique_cp.merge(tx_count, on="address", how="left")
    div["counterparty_diversity"] = (div["unique_counterparties"] / div["tx_count"].replace(0, np.nan)).fillna(0.0)
    return div[["address", "counterparty_diversity"]]


def compute_timing_irregularity(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Entropy of transactions over hours of day per address.
    Higher entropy => spread across hours; lower => concentrated bursts or scheduled behavior.
    """
    tmp = io_df.dropna(subset=["address", "block_time"]).copy()
    tmp["hour"] = tmp["block_time"].dt.hour

    irregularity = []
    for addr, sub in tmp.groupby("address"):
        counts = sub["hour"].value_counts().reindex(range(24), fill_value=0).values.astype(float)
        p = counts / counts.sum() if counts.sum() > 0 else np.zeros_like(counts)
        # Shannon entropy
        entropy = float(-(p[p > 0] * np.log2(p[p > 0])).sum()) if p.sum() > 0 else 0.0
        irregularity.append((addr, entropy))

    return pd.DataFrame(irregularity, columns=["address", "timing_entropy"])


def compute_spike_days(daily_df: pd.DataFrame) -> pd.DataFrame:
    """
    Count of 'spike days' where daily_max_tx is above mean + 2*std per address.
    """
    spikes = []
    for addr, sub in daily_df.groupby("address"):
        vals = sub["daily_max_tx"].fillna(0.0).values
        if len(vals) == 0:
            spikes.append((addr, 0))
            continue
        mu = float(np.mean(vals))
        sigma = float(np.std(vals))
        thresh = mu + 2 * sigma
        count_spikes = int((vals > thresh).sum())
        spikes.append((addr, count_spikes))
    return pd.DataFrame(spikes, columns=["address", "spike_day_count"])


def compute_inflow_outflow_asymmetry(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Asymmetry index = (total_received - total_sent) / (total_received + total_sent + eps)
    Range approx [-1, 1], where -1 heavily outflow, +1 heavily inflow.
    """
    eps = 1e-9
    vol = aggregate_volume_features(io_df)
    denom = (vol["total_received"] + vol["total_sent"]).replace(0, eps)
    vol["inflow_outflow_asymmetry"] = (vol["total_received"] - vol["total_sent"]) / denom
    return vol[["address", "inflow_outflow_asymmetry"]]


def compute_velocity_of_funds(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Velocity: average time (in hours) between receiving funds and next send per address.
    Method:
      - For each address, collect incoming (out direction to address) and outgoing (in direction from address) times.
      - For each incoming time, find the next outgoing time after it and compute delta.
      - Average across pairs.
    """
    tmp = io_df.dropna(subset=["address", "block_time"])
    velocities = []

    for addr, sub in tmp.groupby("address"):
        # Incoming funds appear as 'out' to this address (outputs received)
        incoming = sub[sub["direction"] == "out"]["block_time"].sort_values().values
        outgoing = sub[sub["direction"] == "in"]["block_time"].sort_values().values

        if len(incoming) == 0 or len(outgoing) == 0:
            velocities.append((addr, np.nan))
            continue

        # Two-pointer sweep to find next outgoing after each incoming
        j = 0
        deltas = []
        for inc in incoming:
            while j < len(outgoing) and outgoing[j] <= inc:
                j += 1
            if j < len(outgoing):
                delta = (outgoing[j] - inc).astype("timedelta64[h]").astype(float)
                if delta >= 0:
                    deltas.append(delta)

        vel = float(np.mean(deltas)) if len(deltas) > 0 else np.nan
        velocities.append((addr, vel))

    return pd.DataFrame(velocities, columns=["address", "velocity_hours"])


def compute_top_counterparties_per_day(io_df: pd.DataFrame, top_k: int = 3) -> pd.DataFrame:
    """
    For each (address, date), list top_k counterparties by frequency of co-appearance in the same transaction.
    Output columns:
      - address, date, top_counterparties (comma-separated), top_counterparty_count
    """
    tmp = io_df.dropna(subset=["address", "tx_hash", "date"])
    # Build a mapping: tx_hash -> set(addresses)
    tx_to_addresses: Dict[str, set] = {}
    for tx_hash, sub in tmp.groupby("tx_hash"):
        tx_to_addresses[tx_hash] = set(sub["address"].dropna().unique())

    # Count counterparties per (address, date)
    rows = []
    for (addr, date), sub in tmp.groupby(["address", "date"]):
        cp_counts: Dict[str, int] = {}
        for tx in sub["tx_hash"].unique():
            others = tx_to_addresses.get(tx, set()) - {addr}
            for o in others:
                cp_counts[o] = cp_counts.get(o, 0) + 1
        if len(cp_counts) == 0:
            rows.append((addr, date, "", 0))
            continue

        sorted_cp = sorted(cp_counts.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
        cp_list = ",".join([a for a, c in sorted_cp])
        cp_count = sorted_cp[0][1] if len(sorted_cp) > 0 else 0
        rows.append((addr, date, cp_list, cp_count))

    return pd.DataFrame(rows, columns=["address", "date", "top_counterparties", "top_counterparty_count"])


# -----------------------------------
# Feature assembly (merge everything)
# -----------------------------------

def assemble_address_features(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Merge volume and behavioral features into a single per-address table.
    """
    volume = aggregate_volume_features(io_df)
    unique_cp = compute_unique_counterparties(io_df)
    freq = compute_tx_frequency(io_df)
    burst = compute_burstiness(io_df)
    collat = compute_collateral_ratio(io_df)
    sc_flag = compute_smart_contract_flag(io_df)
    hv_ratio = compute_high_value_ratio(io_df, threshold_ada=100_000.0)
    diversity = compute_counterparty_diversity(io_df)
    asym = compute_inflow_outflow_asymmetry(io_df)
    timing = compute_timing_irregularity(io_df)
    velocity = compute_velocity_of_funds(io_df)

    # Merge all on address
    features = volume.merge(unique_cp, on="address", how="left") \
                     .merge(freq, on="address", how="left") \
                     .merge(burst, on="address", how="left") \
                     .merge(collat, on="address", how="left") \
                     .merge(sc_flag, on="address", how="left") \
                     .merge(hv_ratio, on="address", how="left") \
                     .merge(diversity, on="address", how="left") \
                     .merge(asym, on="address", how="left") \
                     .merge(timing, on="address", how="left") \
                     .merge(velocity, on="address", how="left")

    # Fill NaNs reasonably
    fill_zero_cols = [
        "unique_counterparties", "tx_per_day", "active_days", "burstiness",
        "collateral_ratio", "smart_contract_flag", "high_value_ratio",
        "counterparty_diversity", "inflow_outflow_asymmetry", "timing_entropy"
    ]
    for col in fill_zero_cols:
        if col in features.columns:
            features[col] = features[col].fillna(0.0)

    # velocity_hours can remain NaN if no outgoing after incoming; keep as is
    return features


def assemble_daily_features(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    Produce the daily feature table:
      - daily_received, daily_sent, daily_net, daily_max_tx
      - rolling_avg_tx_size, rolling_tx_frequency, rolling_net (7-day)
      - top_counterparties (per day)
    """
    daily = compute_daily_aggregates(io_df)
    rolled = compute_rolling_features(daily, window_days=7)
    top_cp = compute_top_counterparties_per_day(io_df, top_k=3)

    daily_full = daily.merge(rolled, on=["address", "date"], how="left") \
                      .merge(top_cp, on=["address", "date"], how="left")

    # Fill sensible defaults
    for col in ["rolling_avg_tx_size", "rolling_tx_frequency", "rolling_net"]:
        if col in daily_full.columns:
            daily_full[col] = daily_full[col].fillna(0.0)
    daily_full["top_counterparties"] = daily_full["top_counterparties"].fillna("")
    daily_full["top_counterparty_count"] = daily_full["top_counterparty_count"].fillna(0).astype(int)

    return daily_full


# -------------------------------
# Step 4: Save structured datasets
# -------------------------------

def save_features(features: pd.DataFrame, path: Path = FEATURES_PATH):
    features.to_csv(path, index=False)
    print(f"✅ Features saved to {path} with {len(features)} addresses")


def save_daily_features(daily_features: pd.DataFrame, path: Path = DAILY_PATH):
    daily_features.to_csv(path, index=False)
    print(f"✅ Daily features saved to {path} with {daily_features['address'].nunique()} addresses and {len(daily_features)} rows")


# -------------------------------
# Step 5: Build (ready for ML)
# -------------------------------

def build_all_features() -> Tuple[pd.DataFrame, pd.DataFrame]:
    df = load_transactions()
    io_df = explode_io(df)
    addr_features = assemble_address_features(io_df)
    daily_features = assemble_daily_features(io_df)
    save_features(addr_features)
    save_daily_features(daily_features)
    return addr_features, daily_features


if __name__ == "__main__":
    addr_features, daily_features = build_all_features()
    print(addr_features.head())
    print(daily_features.head())