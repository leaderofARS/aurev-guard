"""
data_pipeline.py
Fetch live Cardano transactions via Blockfrost and build features for training.
"""

import os
import pandas as pd
import requests
from datetime import datetime, timedelta

from agents.ai_model.src.features.build_global_features import make_global_features
from agents.ai_model.src.features.build_features import make_address_features
from agents.ai_model.src.utils import logger, ensure_dir, MODEL_DIR, DATA_DIRS

# --- Blockfrost setup ---
BLOCKFROST_API_KEY = os.getenv("BLOCKFROST_API_KEY", "")
BLOCKFROST_PROJECT = os.getenv("BLOCKFROST_PROJECT", "preview")  # "mainnet" or "testnet"
BASE_URL = f"https://cardano-{BLOCKFROST_PROJECT}.blockfrost.io/api/v0"
HEADERS = {"project_id": BLOCKFROST_API_KEY}


def fetch_transactions_for_address(address: str, count: int = 50) -> pd.DataFrame:
    """
    Fetch recent transactions for a given address using Blockfrost.
    Returns a DataFrame with timestamp, address, value, counterparty.
    """
    url = f"{BASE_URL}/addresses/{address}/transactions?count={count}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    txs = resp.json()

    rows = []
    for tx in txs:
        tx_hash = tx["tx_hash"]
        details = requests.get(f"{BASE_URL}/txs/{tx_hash}", headers=HEADERS).json()
        timestamp = datetime.utcfromtimestamp(details["block_time"])
        value = sum(int(out["amount"][0]["quantity"]) for out in details.get("outputs", []))
        counterparty = details.get("inputs", [{}])[0].get("address", "unknown")
        rows.append({
            "timestamp": timestamp,
            "address": address,
            "value": value,
            "counterparty": counterparty,
        })

    return pd.DataFrame(rows)


def build_features_from_addresses(addresses: list[str], tx_count: int = 50) -> pd.DataFrame:
    """
    Build global + per-address features from live blockchain data.
    """
    all_txs = pd.DataFrame()
    for addr in addresses:
        try:
            df = fetch_transactions_for_address(addr, count=tx_count)
            all_txs = pd.concat([all_txs, df], ignore_index=True)
            logger.info(f"Fetched {len(df)} txs for {addr}")
        except Exception as e:
            logger.error(f"Failed to fetch for {addr}: {e}")

    if all_txs.empty