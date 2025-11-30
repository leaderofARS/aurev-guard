"""
live_pipeline.py
Efficient batch pull of Cardano blockchain data via Blockfrost.
- Pulls latest N blocks (default 500).
- Extracts all transactions with full details (including UTXOs).
- Ensures at least 15 transactions per address (pads if needed).
- Saves raw data as JSON in agents/ai_model/data/.
"""
from agents.ai_model.src import feature_engineering
import os
import json
import requests
from datetime import datetime, timezone
from pathlib import Path

from agents.ai_model.src.utils import logger, ensure_dir

# --- Blockfrost setup ---
BLOCKFROST_API_KEY = os.getenv("BLOCKFROST_API_KEY", "")
BLOCKFROST_PROJECT = os.getenv("BLOCKFROST_PROJECT", "mainnet")
BASE_URL = f"https://cardano-{BLOCKFROST_PROJECT}.blockfrost.io/api/v0"
HEADERS = {"project_id": BLOCKFROST_API_KEY}

# --- Output paths ---
DATA_DIR = Path("agents/ai_model/data")
RAW_JSON_PATH = DATA_DIR / "transactions.json"


def fetch_latest_block():
    resp = requests.get(f"{BASE_URL}/blocks/latest", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def fetch_block(block_hash: str):
    resp = requests.get(f"{BASE_URL}/blocks/{block_hash}", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def fetch_block_transactions(block_hash: str):
    resp = requests.get(f"{BASE_URL}/blocks/{block_hash}/txs", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def fetch_transaction_details(tx_hash: str):
    resp = requests.get(f"{BASE_URL}/txs/{tx_hash}", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def fetch_transaction_utxos(tx_hash: str):
    resp = requests.get(f"{BASE_URL}/txs/{tx_hash}/utxos", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def batch_pull_transactions(max_blocks: int = 500) -> list[dict]:
    """
    Pull transactions from the latest N blocks.
    Returns a list of transaction dicts.
    """
    all_txs = []
    block = fetch_latest_block()
    current_hash = block["hash"]

    for i in range(max_blocks):
        logger.info(f"Fetching block {i+1}/{max_blocks}: {current_hash}")
        tx_hashes = fetch_block_transactions(current_hash)

        for txh in tx_hashes:
            details = fetch_transaction_details(txh)
            utxos = fetch_transaction_utxos(txh)
            tx_record = {
                "tx_hash": txh,
                "block_time": datetime.fromtimestamp(details["block_time"], timezone.utc).isoformat(),
                "block_height": details.get("block_height"),
                "inputs": utxos.get("inputs", []),
                "outputs": utxos.get("outputs", []),
                "fees": details.get("fees"),
                "size": details.get("size"),
            }
            all_txs.append(tx_record)

        # move to previous block correctly
        block = fetch_block(current_hash)
        current_hash = block.get("previous_block")
        if not current_hash:
            break

    logger.info(f"Total collected transactions: {len(all_txs)}")
    return all_txs


def ensure_minimum_per_address(transactions: list[dict], min_count: int = 15) -> list[dict]:
    """
    Ensure at least min_count transactions per address.
    If fewer, duplicate or pad with empty entries.
    """
    addr_map = {}
    for tx in transactions:
        for inp in tx.get("inputs", []):
            addr = inp.get("address")
            if addr:
                addr_map.setdefault(addr, []).append(tx)
        for out in tx.get("outputs", []):
            addr = out.get("address")
            if addr:
                addr_map.setdefault(addr, []).append(tx)

    # If no addresses found at all, add a dummy one for demo purposes
    if not addr_map:
        logger.warning("No addresses found in fetched blocks, adding dummy address for demo")
        addr_map["demo_address"] = []

    padded = []
    for addr, txs in addr_map.items():
        if len(txs) < min_count:
            logger.info(f"Address {addr} has only {len(txs)} txs, padding to {min_count}")
            while len(txs) < min_count:
                txs.append({"tx_hash": None, "address": addr, "padded": True})
        padded.extend(txs)

    return padded


def save_transactions_json(transactions: list[dict]):
    ensure_dir(DATA_DIR)
    if RAW_JSON_PATH.exists():
        with open(RAW_JSON_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
    else:
        existing = []

    seen = {tx.get("tx_hash") for tx in existing if tx.get("tx_hash")}
    new = []
    for tx in transactions:
        h = tx.get("tx_hash")
        if h and h in seen:
            continue
        if h:
            seen.add(h)
        new.append(tx)

    combined = existing + new
    with open(RAW_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2)

    logger.info(f"Collected {len(new)} new transactions (including padded)")
    logger.info(f"✅ Saved {len(combined)} total transactions to {RAW_JSON_PATH}")


def build_live_data(max_blocks: int = 500):
    txs = batch_pull_transactions(max_blocks=max_blocks)
    if not txs:
        raise RuntimeError("No transactions fetched. Check Blockfrost API key.")

    save_transactions_json(txs)


if __name__ == "__main__":
    # Default run: 10 blocks for testing
    build_live_data(max_blocks=50)