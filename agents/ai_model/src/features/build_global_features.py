"""
features/build_global_features.py
Global daily feature engineering for Cardano transactions using Blockfrost API.
"""

import os
import pandas as pd
import requests
from datetime import datetime, timedelta

# Load Blockfrost API key from environment
BLOCKFROST_API_KEY = os.getenv("BLOCKFROST_API_KEY", "previewXjcueZf3rkZKHUeC0e7rnDNG6pzsX02X")
BLOCKFROST_PROJECT = os.getenv("BLOCKFROST_PROJECT", "testnet")  # "mainnet" or "testnet"

BASE_URL = f"https://cardano-{BLOCKFROST_PROJECT}.blockfrost.io/api/v0"

HEADERS = {"project_id": BLOCKFROST_API_KEY}


# --- Helper: fetch transactions for an address ---
def fetch_transactions(address: str, count: int = 100) -> list[dict]:
    """
    Fetch transactions for a given address using Blockfrost.
    Returns a list of transaction dicts.
    """
    url = f"{BASE_URL}/addresses/{address}/transactions?count={count}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


# --- Helper: fetch transaction details ---
def fetch_transaction_details(tx_hash: str) -> dict:
    """
    Fetch details of a transaction by hash.
    """
    url = f"{BASE_URL}/txs/{tx_hash}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


# --- Build global features ---
def make_global_features(tx_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute global daily features from a transaction dataframe.
    tx_df must include: ['timestamp','address','value','counterparty']
    """
    df = tx_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["date"] = df["timestamp"].dt.date

    # Daily volume
    daily_volume = df.groupby("date")["value"].sum().rename("daily_volume")

    # Active addresses
    active_addresses = df.groupby("date")["address"].nunique().rename("active_addresses")

    # Largest transaction per day
    idxmax = df.groupby("date")["value"].idxmax()
    largest_tx = df.loc[idxmax, ["date", "address", "value"]]
    largest_tx = largest_tx.rename(
        columns={"address": "largest_tx_address_day", "value": "global_max_tx_value_day"}
    ).set_index("date")

    # Top-5 dominance
    df["rank"] = df.groupby("date")["value"].rank(method="first", ascending=False)
    top5 = df[df["rank"] <= 5].groupby("date")["value"].sum().rename("top5_volume")

    # Combine
    out = pd.concat([daily_volume, active_addresses, largest_tx, top5], axis=1)
    out["concentration_ratio"] = out["global_max_tx_value_day"] / (out["daily_volume"] + 1e-9)
    out["top5_share"] = out["top5_volume"] / (out["daily_volume"] + 1e-9)

    # Volatility
    daily_std = df.groupby("date")["value"].std().rename("daily_value_std")
    out = out.join(daily_std).sort_index()

    # Rolling burstiness
    out["volume_7d_mean"] = out["daily_volume"].rolling(7, min_periods=1).mean()
    out["volume_burstiness"] = (out["daily_volume"] - out["volume_7d_mean"]) / (out["volume_7d_mean"] + 1e-9)

    # New addresses per day
    df = df.sort_values("timestamp")
    df["is_new_address"] = ~df["address"].duplicated()
    new_daily = df.groupby("date")["is_new_address"].sum().rename("new_addresses")
    out = out.join(new_daily)

    return out.reset_index()


# --- Example usage ---
if __name__ == "__main__":
    # Demo: fetch transactions for one address and build features
    demo_address = os.getenv("CARDANO_DEMO_ADDRESS", "")
    if not BLOCKFROST_API_KEY:
        raise RuntimeError("BLOCKFROST_API_KEY not set in environment")

    if demo_address:
        txs = fetch_transactions(demo_address, count=50)
        # Convert to DataFrame
        rows = []
        for tx in txs:
            details = fetch_transaction_details(tx["tx_hash"])
            rows.append({
                "timestamp": datetime.fromisoformat(details["block_time"].replace("Z", "")),
                "address": demo_address,
                "value": sum(int(out["amount"][0]["quantity"]) for out in details.get("outputs", [])),
                "counterparty": details.get("inputs", [{}])[0].get("address", "unknown"),
            })
        tx_df = pd.DataFrame(rows)
        global_features = make_global_features(tx_df)
        print(global_features.head())
    else:
        print("⚠️ Set CARDANO_DEMO_ADDRESS in environment to run demo.")