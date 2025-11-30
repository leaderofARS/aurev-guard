import json
from pathlib import Path
from typing import Dict, Any, List

import numpy as np
import pandas as pd

EXPORT_DIR = Path("agents/ai_model/data/export")
ADDRESSES_PATH = EXPORT_DIR / "addresses.json"
TIMESERIES_PATH = EXPORT_DIR / "daily_timeseries.json"
OVERVIEW_PATH = EXPORT_DIR / "overview.json"
EXPLANATIONS_PATH = EXPORT_DIR / "explanations.json"

def load_exports():
    with open(ADDRESSES_PATH, "r", encoding="utf-8") as f:
        addresses = json.load(f)
    with open(TIMESERIES_PATH, "r", encoding="utf-8") as f:
        timeseries = json.load(f)
    with open(OVERVIEW_PATH, "r", encoding="utf-8") as f:
        overview = json.load(f)
    return addresses, timeseries, overview

def format_float(x, digits=4):
    if x is None:
        return "N/A"
    return f"{x:.{digits}f}"

def address_narrative(addr_obj: Dict[str, Any], ts: List[Dict[str, Any]]) -> Dict[str, Any]:
    a = addr_obj
    vol = a.get("volume", {})
    beh = a.get("behavior", {})
    graph = a.get("graph", {})
    models = a.get("models", {})
    addr = a.get("address")

    ensemble_flag = models.get("Ensemble")
    anomaly_text = "flagged as anomalous" if ensemble_flag == -1 else "not flagged as anomalous"

    # Key signals
    high_value_ratio = beh.get("high_value_ratio")
    asym = beh.get("inflow_outflow_asymmetry")
    diversity = beh.get("counterparty_diversity")
    burst = beh.get("burstiness")
    entropy = beh.get("timing_entropy")
    velocity = beh.get("velocity_hours")
    deg = graph.get("degree")
    betw = graph.get("betweenness_centrality")

    # Daily spikes summary
    max_daily_tx = max([d.get("daily_max_tx_ada") or 0.0 for d in ts]) if ts else 0.0
    max_daily_net = max([d.get("daily_net_ada") or 0.0 for d in ts]) if ts else 0.0

    # SHAP top contributors
    shap_contribs = models.get("shap_top_contributors", [])
    shap_text = ""
    if shap_contribs:
        items = [f"{c['feature']} ({format_float(c['shap_value'])})" for c in shap_contribs[:5]]
        shap_text = "; Top contributing features: " + ", ".join(items)

    narrative = (
        f"Address {addr} is {anomaly_text}. "
        f"It has {vol.get('tx_count', 0)} transactions, total received {format_float(vol.get('total_received_ada'))} ADA, "
        f"total sent {format_float(vol.get('total_sent_ada'))} ADA, net change {format_float(vol.get('net_balance_change_ada'))} ADA. "
        f"High-value transaction ratio is {format_float(high_value_ratio)}; "
        f"inflow/outflow asymmetry is {format_float(asym)} (−1 outflow, +1 inflow). "
        f"Counterparty diversity is {format_float(diversity)} with {beh.get('unique_counterparties', 0)} unique counterparties. "
        f"Timing entropy is {format_float(entropy)}, burstiness {format_float(burst)}, and velocity of funds {format_float(velocity)} hours. "
        f"Graph metrics: degree {deg}, betweenness {format_float(betw)}. "
        f"Max daily transaction was {format_float(max_daily_tx)} ADA; max daily net {format_float(max_daily_net)} ADA."
        f"{shap_text}"
    )

    return {
        "address": addr,
        "anomalous": ensemble_flag == -1,
        "narrative": narrative
    }

def overview_narrative(overview: Dict[str, Any]) -> str:
    counts = overview.get("counts", {})
    total_addresses = counts.get("total_addresses", 0)
    total_days = counts.get("total_days_covered", 0)
    anomalies = counts.get("anomalies_flagged", 0)
    shap_top = overview.get("shap_top_features", [])

    shap_text = ""
    if shap_top:
        items = [f"{it['feature']} ({it['mean_abs_shap']:.4f})" for it in shap_top[:5]]
        shap_text = " Top global contributors: " + ", ".join(items)

    return (
        f"Dataset covers {total_addresses} addresses over {total_days} days. "
        f"Ensemble anomaly detection flagged {anomalies} addresses. "
        f"Distributions and rolling metrics indicate outliers by volume, timing, and diversity."
        f"{shap_text}"
    )

def run_narrative_export():
    addresses, timeseries, overview = load_exports()
    narratives = []
    for a in addresses:
        addr = a.get("address")
        ts = timeseries.get(addr, [])
        narratives.append(address_narrative(a, ts))

    overview_text = overview_narrative(overview)
    out = {"overview": overview_text, "addresses": narratives}

    EXPLANATIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(EXPLANATIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"✅ Narratives exported to {EXPLANATIONS_PATH}")

if __name__ == "__main__":
    run_narrative_export()