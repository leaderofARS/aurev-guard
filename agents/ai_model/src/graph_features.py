import json
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd
import networkx as nx

DATA_PATH = Path("agents/ai_model/data/transactions.json")
IO_PATH = Path("agents/ai_model/data/io_cache.csv")
GRAPH_FEATURES_PATH = Path("agents/ai_model/data/graph_features.csv")

def load_transactions(path: Path = DATA_PATH) -> pd.DataFrame:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    df = pd.json_normalize(data, sep="_")
    if "block_time" in df.columns:
        df["block_time"] = pd.to_datetime(df["block_time"], errors="coerce")
    return df

def explode_io(df: pd.DataFrame) -> pd.DataFrame:
    outputs = df.explode("outputs").reset_index(drop=True)
    outputs["outputs"] = outputs["outputs"].fillna({})
    out_df = pd.json_normalize(outputs["outputs"])
    out_df["direction"] = "out"
    out_df["tx_hash"] = outputs["tx_hash"]
    out_df["block_time"] = outputs["block_time"]

    inputs = df.explode("inputs").reset_index(drop=True)
    inputs["inputs"] = inputs["inputs"].fillna({})
    in_df = pd.json_normalize(inputs["inputs"])
    in_df["direction"] = "in"
    in_df["tx_hash"] = inputs["tx_hash"]
    in_df["block_time"] = inputs["block_time"]

    io_df = pd.concat([out_df, in_df], ignore_index=True)

    if "amount" in io_df.columns:
        io_df["lovelace"] = io_df["amount"].apply(
            lambda x: int(x[0]["quantity"]) if isinstance(x, list) and x else 0
        )
        io_df["ada"] = io_df["lovelace"] / 1_000_000
    else:
        io_df["lovelace"] = 0
        io_df["ada"] = 0.0

    if "address" not in io_df.columns:
        io_df["address"] = None
    io_df["date"] = io_df["block_time"].dt.date

    return io_df[["address", "direction", "tx_hash", "block_time", "date", "ada"]]

def build_counterparty_edges(io_df: pd.DataFrame) -> pd.DataFrame:
    """
    For each transaction, create undirected edges between all co-appearing addresses.
    Edge weight = frequency of co-appearance across transactions.
    """
    tmp = io_df.dropna(subset=["address", "tx_hash"]).copy()
    tx_groups = tmp.groupby("tx_hash")["address"].unique()

    edge_counts: Dict[Tuple[str, str], int] = {}
    for tx_hash, addresses in tx_groups.items():
        unique_addresses = sorted(set(addresses))
        n = len(unique_addresses)
        for i in range(n):
            for j in range(i + 1, n):
                a, b = unique_addresses[i], unique_addresses[j]
                key = (a, b)
                edge_counts[key] = edge_counts.get(key, 0) + 1

    rows = [{"addr_u": u, "addr_v": v, "weight": w} for (u, v), w in edge_counts.items()]
    return pd.DataFrame(rows)

def compute_graph_metrics(edges_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute per-address graph metrics:
      - degree
      - weighted_degree
      - clustering_coefficient
      - betweenness_centrality (normalized)
    """
    if edges_df.empty:
        return pd.DataFrame(columns=["address", "degree", "weighted_degree", "clustering_coefficient", "betweenness_centrality"])

    G = nx.Graph()
    for _, row in edges_df.iterrows():
        G.add_edge(row["addr_u"], row["addr_v"], weight=float(row["weight"]))

    # Degree
    degree = dict(G.degree())
    # Weighted degree
    weighted_degree = {n: float(sum(d["weight"] for _, _, d in G.edges(n, data=True))) for n in G.nodes()}
    # Clustering coefficient
    clustering = nx.clustering(G, weight="weight")
    # Betweenness centrality (normalized)
    betweenness = nx.betweenness_centrality(G, normalized=True, weight="weight")

    df = pd.DataFrame({
        "address": list(G.nodes()),
        "degree": [degree.get(n, 0) for n in G.nodes()],
        "weighted_degree": [weighted_degree.get(n, 0.0) for n in G.nodes()],
        "clustering_coefficient": [clustering.get(n, 0.0) for n in G.nodes()],
        "betweenness_centrality": [betweenness.get(n, 0.0) for n in G.nodes()],
    })
    return df

def build_and_save_graph_features():
    df = load_transactions()
    io_df = explode_io(df)
    # Optional cache of IO for debugging
    IO_PATH.parent.mkdir(parents=True, exist_ok=True)
    io_df.to_csv(IO_PATH, index=False)

    edges_df = build_counterparty_edges(io_df)
    graph_df = compute_graph_metrics(edges_df)

    GRAPH_FEATURES_PATH.parent.mkdir(parents=True, exist_ok=True)
    graph_df.to_csv(GRAPH_FEATURES_PATH, index=False)
    print(f"✅ Graph features saved to {GRAPH_FEATURES_PATH} with {len(graph_df)} addresses and {len(edges_df)} edges")

if __name__ == "__main__":
    build_and_save_graph_features()