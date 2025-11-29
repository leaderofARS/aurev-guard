"""
SHAP Explanation for Random Blockchain Data
Using actual training data structure
"""

import pandas as pd
import numpy as np
import json
import requests
import random
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 90)
print("SHAP EXPLANATION FOR RANDOM BLOCKCHAIN TRANSACTION DATA")
print("=" * 90)

# Load actual training data to understand structure
df_train = pd.read_csv('agents/ai_model/data/anomaly_results.csv')

print("\nTRAINING DATA INFORMATION:")
print(f"  Total Records in Training Set: {len(df_train)}")
print(f"  Total Features: {len(df_train.columns) - 6}")  # Exclude address and predictions
print(f"  Feature Columns Available:")

feature_cols = df_train.columns[1:19]  # The 18 feature columns
for i, col in enumerate(feature_cols, 1):
    sample_val = df_train[col].iloc[0]
    print(f"    {i:2d}. {col:35s} (sample: {sample_val})")

# Generate random data using same feature names
random.seed(100)
np.random.seed(100)

print("\n" + "=" * 90)
print("GENERATING RANDOM DATA")
print("=" * 90)

random_data = {}
for col in feature_cols:
    sample_vals = df_train[col].dropna()
    if len(sample_vals) > 0:
        # Generate random value in similar range
        min_val = sample_vals.min()
        max_val = sample_vals.max()
        mean_val = sample_vals.mean()
        
        # Generate value with same distribution characteristics
        if 'flag' in col.lower():
            random_data[col] = random.randint(0, 1)
        elif 'ratio' in col.lower() or 'diversity' in col.lower():
            random_data[col] = round(random.uniform(0, 1), 3)
        elif 'entropy' in col.lower():
            random_data[col] = round(random.uniform(-10, 10), 2)
        else:
            # Use mean +/- random percentage
            pct = random.uniform(0.5, 1.5)
            random_data[col] = round(mean_val * pct, 2)
    else:
        random_data[col] = 0

print("\nRANDOM FEATURE VECTOR GENERATED:")
for i, (col, val) in enumerate(random_data.items(), 1):
    train_val = df_train[col].iloc[0]
    print(f"  {i:2d}. {col:35s}: {val:15g}  (training sample: {train_val})")

# Send to orchestrator
print("\n" + "=" * 90)
print("SENDING TO ORCHESTRATOR FOR SHAP EXPLANATION")
print("=" * 90)

wallet = f"addr_test1qpredicted{random.randint(10000000, 99999999)}"

try:
    response = requests.post(
        f"http://127.0.0.1:8080/masumi/predict?wallet_address={wallet}&include_shap=true&include_explanation=true",
        json=random_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"\nWallet Address: {wallet}")
    print(f"HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        
        print("\n" + "=" * 90)
        print("ORCHESTRATOR RESPONSE")
        print("=" * 90)
        
        if "prediction" in result and "prediction" in result["prediction"]:
            pred = result["prediction"]["prediction"]
            
            print("\nPREDICTION RESULTS:")
            print(f"  Risk Score:      {pred.get('risk_score', 'Error')}")
            print(f"  Anomaly Flag:    {pred.get('anomaly_flag', 'Error')}")
            
            # SHAP EXPLANATION
            if "shap_explanation" in pred:
                shap_val = pred["shap_explanation"]
                
                if isinstance(shap_val, str) and "error" not in shap_val.lower():
                    print("\nSHAP EXPLANATION VALUES:")
                    print("  (Feature importance scores for the prediction)")
                    print(f"  Values: {shap_val}")
                elif isinstance(shap_val, dict):
                    print("\nSHAP EXPLANATION (FEATURE IMPORTANCE):")
                    
                    # Sort by absolute importance
                    sorted_shap = sorted(
                        shap_val.items(),
                        key=lambda x: abs(float(x[1])) if isinstance(x[1], (int, float)) else 0,
                        reverse=True
                    )
                    
                    print("\n  Top Contributing Features:")
                    for i, (feat, imp) in enumerate(sorted_shap[:10], 1):
                        try:
                            imp_float = float(imp)
                            impact = "+" if imp_float > 0 else ""
                            print(f"    {i:2d}. {feat:35s}: {impact}{imp_float:10.4f}")
                        except:
                            print(f"    {i:2d}. {feat:35s}: {imp}")
                    
                    print("\n  INTERPRETATION:")
                    print("    Positive values: Feature increases risk score")
                    print("    Negative values: Feature decreases risk score")
                    print("    Magnitude: Importance of the feature")
                else:
                    print(f"\n  SHAP Explanation: {shap_val}")
            else:
                print("\n  SHAP Explanation: Not available in this response")
            
            # ANOMALY INFO
            if "anomaly_info" in pred:
                print("\nANOMALY INFORMATION:")
                anom = pred["anomaly_info"]
                if isinstance(anom, dict):
                    for k, v in list(anom.items())[:5]:
                        print(f"  {k}: {v}")
                else:
                    print(f"  {anom}")
            
            # GRAPH FEATURES
            if "graph_features" in pred:
                print("\nGRAPH FEATURES:")
                graph = pred["graph_features"]
                if isinstance(graph, dict):
                    for k, v in list(graph.items())[:5]:
                        print(f"  {k}: {v}")
        
        # Save full response
        output = {
            "timestamp": pd.Timestamp.now().isoformat(),
            "wallet_address": wallet,
            "input_features": random_data,
            "prediction_results": pred if "prediction" in result else None,
            "full_response": result
        }
        
        with open("shap_explanation_results.json", "w") as f:
            json.dump(output, f, indent=2, default=str)
        
        print("\n" + "=" * 90)
        print("SUCCESS: SHAP EXPLANATION GENERATED")
        print("=" * 90)
        print("\nFull results saved to: shap_explanation_results.json")
        
    else:
        print(f"Error: HTTP {response.status_code}")
        print(response.text[:300])
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\nDone!")
