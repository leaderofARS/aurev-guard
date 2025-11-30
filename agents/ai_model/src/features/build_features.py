"""
features/build_features.py
Per-address contextual feature engineering for Cardano transactions.
Works in tandem with build_global_features.py.
"""

import pandas as pd
import numpy as np


# --- Helper: entropy of destinations ---
def entropy(series: pd.Series) -> float:
    """
    Compute Shannon entropy of a categorical series (e.g., counterparties).
    """
    counts = series.value_counts()
    p = counts / (counts.sum() + 1e-12)
    return float(-(p * np.log(p + 1e-12)).sum())


# --- Main function ---
def make_address_features(tx_df: pd.DataFrame, global_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute per-address daily features with global context.

    Parameters
    ----------
    tx_df : pd.DataFrame
        Transaction dataframe with columns:
        ['timestamp','address','value','counterparty']
    global_df : pd.DataFrame
        Output of make_global_features, must include:
        ['date','daily_volume','global_max_tx_value_day']

    Returns
    -------
    pd.DataFrame
        Per-address daily features with contextual ratios.
    """
    df = tx_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["date"] = df["timestamp"].dt.date

    # --- Per-address daily aggregation ---
    addr_day = df.groupby(["address", "date"]).agg(
        tx_count_day=("value", "count"),
        total_value_day=("value", "sum"),
        max_value_day=("value", "max"),
        std_value_day=("value", "std"),
        unique_counterparts_day=("counterparty", "nunique"),
        entropy_of_destinations=("counterparty", entropy),
    ).reset_index()

    # --- Merge global context ---
    g = global_df[["date", "daily_volume", "global_max_tx_value_day"]]
    addr_day = addr_day.merge(g, on="date", how="left")

    # --- Contextual ratios ---
    addr_day["share_of_daily_volume"] = addr_day["total_value_day"] / (addr_day["daily_volume"] + 1e-9)
    addr_day["relative_max_vs_global"] = addr_day["max_value_day"] / (addr_day["global_max_tx_value_day"] + 1e-9)

    # --- Rolling weekly features per address ---
    addr_day = addr_day.sort_values(["address", "date"])
    for col in ["tx_count_day", "total_value_day", "max_value_day"]:
        mean7 = (
            addr_day.groupby("address")[col]
            .rolling(7, min_periods=1)
            .mean()
            .reset_index(level=0, drop=True)
        )
        addr_day[f"{col}_7d_mean"] = mean7
        addr_day[f"{col}_burstiness"] = (addr_day[col] - mean7) / (mean7 + 1e-9)

    # --- Rename columns to match model expectations ---
    addr_day = addr_day.rename(
        columns={
            "tx_count_day": "tx_count_24h",
            "total_value_day": "total_value_24h",
            "max_value_day": "largest_value_24h",
            "std_value_day": "std_value_24h",
            "unique_counterparts_day": "unique_counterparts_24h",
        }
    )

    return addr_day


# --- Example usage ---
if __name__ == "__main__":
    # Demo with synthetic data
    data = {
        "timestamp": pd.date_range("2025-11-01", periods=10, freq="D").tolist() * 2,
        "address": ["addr1"] * 10 + ["addr2"] * 10,
        "value": np.random.randint(1000, 100000, 20),
        "counterparty": ["cp1", "cp2", "cp3", "cp4", "cp5"] * 4,
    }
    tx_df = pd.DataFrame(data)

    # Fake global_df for demo
    global_df = pd.DataFrame({
        "date": pd.date_range("2025-11-01", periods=10, freq="D").date,
        "daily_volume": np.random.randint(1e5, 1e6, 10),
        "global_max_tx_value_day": np.random.randint(1e4, 1e5, 10),
    })

    features = make_address_features(tx_df, global_df)
    print(features.head())