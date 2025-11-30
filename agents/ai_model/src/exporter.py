import json
import math
import os
from pathlib import Path
from typing import Dict, List, Any, Tuple

import numpy as np
import pandas as pd

FEATURES_PATH = Path("agents/ai_model/data/features.csv")
DAILY_PATH = Path("agents/ai_model/data/daily_features.csv")
ANOMALY_RESULTS_PATH = Path("agents/ai_model/data/anomaly_results.csv")
GRAPH_FEATURES_PATH = Path("agents/ai_model/data/graph_features.csv")
SHAP_DIR = Path("agents/ai_model/data/shap")
SHAP_PER_ADDRESS_PATH = SHAP_DIR / "per_address.json"
SHAP_SUMMARY_PATH = SHAP_DIR / "shap_summary.csv"

EXPORT_DIR = Path("agents/ai_model/data/export")

def _ensure_export_dir():
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

def _safe_float(x) -> float:
    try:
        if pd.isna(x):
            return None
        v = float(x)
        if math.isinf(v) or math.isnan(v):
            return None
        return v
    except Exception:
        return None

def _safe_int(x) -> int:
    try:
        if pd.isna(x):
            return None
        return int(x)
    except Exception:
        return None

def load_frames() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, List[Dict[str, Any]], pd.DataFrame]:
    features = pd.read_csv(FEATURES_PATH)
    daily = pd.read_csv(DAILY_PATH)
    results = pd.read_csv(ANOMALY_RESULTS_PATH) if ANOMALY_RESULTS_PATH.exists() else features.copy()
    graph = pd.read_csv(GRAPH_FEATURES_PATH) if GRAPH_FEATURES_PATH.exists() else pd.DataFrame(columns=["address"])
    shap_per_addr = []
    shap_summary = pd.DataFrame(columns=["feature", "mean_abs_shap"])
    if SHAP_PER_ADDRESS_PATH.exists():
        with open(SHAP_PER_ADDRESS_PATH, "r", encoding="utf-8") as f:
            shap_per_addr = json.load(f)
    if SHAP_SUMMARY_PATH.exists():
        shap_summary = pd.read_csv(SHAP_SUMMARY_PATH)
    return features, daily, results, graph, shap_per_addr, shap_summary

def _shap_lookup_map(shap_per_addr: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    m = {}
    for item in shap_per_addr:
        addr = item.get("address")
        m[addr] = item.get("top_contributors", [])
    return m

def build_address_entry(addr_row: pd.Series, model_row: pd.Series, graph_row: pd.Series, shap_top: List[Dict[str, Any]]) -> Dict[str, Any]:
    entry = {
        "address": addr_row.get("address"),
        "volume": {
            "tx_count": _safe_int(addr_row.get("tx_count")),
            "total_received_ada": _safe_float(addr_row.get("total_received")),
            "total_sent_ada": _safe_float(addr_row.get("total_sent")),
            "net_balance_change_ada": _safe_float(addr_row.get("net_balance_change")),
            "max_tx_size_ada": _safe_float(addr_row.get("max_tx_size")),
            "avg_tx_size_ada": _safe_float(addr_row.get("avg_tx_size")),
        },
        "behavior": {
            "unique_counterparties": _safe_int(addr_row.get("unique_counterparties")),
            "tx_per_day": _safe_float(addr_row.get("tx_per_day")),
            "active_days": _safe_int(addr_row.get("active_days")),
            "burstiness": _safe_float(addr_row.get("burstiness")),
            "collateral_ratio": _safe_float(addr_row.get("collateral_ratio")),
            "smart_contract_flag": _safe_int(addr_row.get("smart_contract_flag")),
            "high_value_ratio": _safe_float(addr_row.get("high_value_ratio")),
            "counterparty_diversity": _safe_float(addr_row.get("counterparty_diversity")),
            "inflow_outflow_asymmetry": _safe_float(addr_row.get("inflow_outflow_asymmetry")),
            "timing_entropy": _safe_float(addr_row.get("timing_entropy")),
            "velocity_hours": _safe_float(addr_row.get("velocity_hours")),
        },
        "graph": {
            "degree": _safe_int(graph_row.get("degree")),
            "weighted_degree": _safe_float(graph_row.get("weighted_degree")),
            "clustering_coefficient": _safe_float(graph_row.get("clustering_coefficient")),
            "betweenness_centrality": _safe_float(graph_row.get("betweenness_centrality")),
        },
        "models": {
            "IsolationForest": _safe_int(model_row.get("IsolationForest")),
            "OneClassSVM": _safe_int(model_row.get("OneClassSVM")),
            "LOF": _safe_int(model_row.get("LOF")),
            "Ensemble": _safe_int(model_row.get("Ensemble")),
            "IsolationForest_score": _safe_float(model_row.get("IsolationForest_score")),
            "shap_top_contributors": shap_top,
        },
        "links": {
            "timeseries_ref": addr_row.get("address"),
            "tables_ref": "table.csv"
        }
    }
    return entry

def build_daily_timeseries(daily_frame: pd.DataFrame) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    daily_frame = daily_frame.copy()
    daily_frame["date"] = pd.to_datetime(daily_frame["date"], errors="coerce").dt.strftime("%Y-%m-%d")

    for addr, sub in daily_frame.groupby("address"):
        records = []
        for _, row in sub.iterrows():
            rec = {
                "date": row.get("date"),
                "daily_received_ada": _safe_float(row.get("daily_received")),
                "daily_sent_ada": _safe_float(row.get("daily_sent")),
                "daily_net_ada": _safe_float(row.get("daily_net")),
                "daily_max_tx_ada": _safe_float(row.get("daily_max_tx")),
                "rolling": {
                    "rolling_avg_tx_size_ada": _safe_float(row.get("rolling_avg_tx_size")),
                    "rolling_tx_frequency": _safe_float(row.get("rolling_tx_frequency")),
                    "rolling_net_ada": _safe_float(row.get("rolling_net")),
                },
                "top_counterparties": {
                    "addresses": [],
                    "top_counterparty_count": _safe_int(row.get("top_counterparty_count")),
                }
            }
            cp_raw = row.get("top_counterparties")
            if isinstance(cp_raw, str) and cp_raw.strip():
                rec["top_counterparties"]["addresses"] = [a for a in cp_raw.split(",") if a]
            records.append(rec)
        out[addr] = records
    return out

def build_overview(features: pd.DataFrame, daily: pd.DataFrame, results: pd.DataFrame, shap_summary: pd.DataFrame) -> Dict[str, Any]:
    total_addresses = int(features["address"].nunique())
    total_days = int(daily["date"].nunique()) if "date" in daily.columns else 0
    anomalies_flagged = int((results["Ensemble"] == -1).sum()) if "Ensemble" in results.columns else None

    distributions = {}
    def hist(series: pd.Series, bins=20):
        series = pd.to_numeric(series, errors="coerce").dropna()
        if len(series) == 0:
            return {"bins": [], "counts": []}
        counts, bin_edges = np.histogram(series.values, bins=bins)
        return {"bins": [float(x) for x in bin_edges.tolist()], "counts": [int(c) for c in counts.tolist()]}

    for col in ["tx_count", "total_received", "total_sent", "net_balance_change", "max_tx_size", "avg_tx_size",
                "unique_counterparties", "high_value_ratio", "burstiness", "timing_entropy", "velocity_hours"]:
        if col in features.columns:
            distributions[col] = hist(features[col])

    lineage = {
        "features_csv": str(FEATURES_PATH),
        "daily_features_csv": str(DAILY_PATH),
        "graph_features_csv": str(GRAPH_FEATURES_PATH) if GRAPH_FEATURES_PATH.exists() else None,
        "anomaly_results_csv": str(ANOMALY_RESULTS_PATH) if ANOMALY_RESULTS_PATH.exists() else None,
        "shap_dir": str(SHAP_DIR),
        "generated_at": pd.Timestamp.utcnow().isoformat(),
        "version": "v1.1-full-export-explain"
    }

    shap_top_global = []
    if not shap_summary.empty:
        shap_top_global = shap_summary.sort_values("mean_abs_shap", ascending=False).head(10).to_dict(orient="records")

    overview = {
        "counts": {"total_addresses": total_addresses, "total_days_covered": total_days, "anomalies_flagged": anomalies_flagged},
        "distributions": distributions,
        "shap_top_features": shap_top_global,
        "lineage": lineage,
    }
    return overview

def build_frontend_table(features: pd.DataFrame, results: pd.DataFrame, graph: pd.DataFrame) -> pd.DataFrame:
    merged = features.merge(results[["address", "IsolationForest", "OneClassSVM", "LOF", "Ensemble", "IsolationForest_score"]],
                            on="address", how="left") \
                     .merge(graph, on="address", how="left")

    cols_order = [
        "address",
        "Ensemble", "IsolationForest", "OneClassSVM", "LOF", "IsolationForest_score",
        "tx_count", "total_received", "total_sent", "net_balance_change",
        "max_tx_size", "avg_tx_size",
        "unique_counterparties", "tx_per_day", "active_days", "burstiness",
        "high_value_ratio", "counterparty_diversity", "inflow_outflow_asymmetry",
        "timing_entropy", "velocity_hours", "collateral_ratio", "smart_contract_flag",
        "degree", "weighted_degree", "clustering_coefficient", "betweenness_centrality"
    ]
    for c in cols_order:
        if c not in merged.columns:
            merged[c] = np.nan
    merged = merged[cols_order]
    merged = merged.replace([np.inf, -np.inf], np.nan)
    return merged

def export_all():
    _ensure_export_dir()
    features, daily, results, graph, shap_per_addr, shap_summary = load_frames()
    shap_map = _shap_lookup_map(shap_per_addr)

    model_lookup: Dict[str, pd.Series] = {}
    if "address" in results.columns:
        for _, r in results.iterrows():
            model_lookup[str(r["address"])] = r

    graph_lookup: Dict[str, pd.Series] = {}
    if "address" in graph.columns:
        for _, r in graph.iterrows():
            graph_lookup[str(r["address"])] = r

    addresses: List[Dict[str, Any]] = []
    for _, row in features.iterrows():
        addr = str(row["address"])
        model_row = model_lookup.get(addr, pd.Series(dtype=object))
        graph_row = graph_lookup.get(addr, pd.Series(dtype=object))
        shap_top = shap_map.get(addr, [])
        entry = build_address_entry(row, model_row, graph_row, shap_top)
        addresses.append(entry)

    timeseries_map = build_daily_timeseries(daily)
    overview = build_overview(features, daily, results, shap_summary)
    table_df = build_frontend_table(features, results, graph)

    addresses_path = EXPORT_DIR / "addresses.json"
    timeseries_path = EXPORT_DIR / "daily_timeseries.json"
    overview_path = EXPORT_DIR / "overview.json"
    table_path = EXPORT_DIR / "table.csv"

    with open(addresses_path, "w", encoding="utf-8") as f:
        json.dump(addresses, f, ensure_ascii=False, indent=2)
    with open(timeseries_path, "w", encoding="utf-8") as f:
        json.dump(timeseries_map, f, ensure_ascii=False, indent=2)
    with open(overview_path, "w", encoding="utf-8") as f:
        json.dump(overview, f, ensure_ascii=False, indent=2)
    table_df.to_csv(table_path, index=False)

    print(f"✅ Exported addresses.json to {addresses_path}")
    print(f"✅ Exported daily_timeseries.json to {timeseries_path}")
    print(f"✅ Exported overview.json to {overview_path}")
    print(f"✅ Exported table.csv to {table_path}")

if __name__ == "__main__":
    export_all()