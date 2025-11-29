"""
Generate SHAP Explanations for Random Blockchain Feature Data
"""

import joblib
import os
import json
import requests
import random
import numpy as np
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

model_dir = "agents/ai_model/models"

print("=" * 90)
print("SHAP EXPLANATION FOR RANDOM BLOCKCHAIN DATA")
print("=" * 90)

try:
    # Load models
    rf = joblib.load(os.path.join(model_dir, "randomforest.pkl"))
    iso = joblib.load(os.path.join(model_dir, "isolationforest.pkl"))
    
    print("\nMODEL SPECIFICATIONS:")
    print(f"\nRandom Forest (Risk Scoring):")
    print(f"  Features: {list(rf.feature_names_in_)}")
    print(f"\nIsolation Forest (Anomaly Detection):")
    print(f"  Features: {list(iso.feature_names_in_)}")
    
    # Generate separate random vectors for each model
    random.seed(42)
    np.random.seed(42)
    
    print("\n" + "=" * 90)
    print("GENERATING RANDOM DATA")
    print("=" * 90)
    
    # For Random Forest: tx_count_24h, avg_value_7d, std_value_7d, unique_counterparts_30d, entropy_of_destinations
    rf_features = {
        'tx_count_24h': random.randint(1, 50),
        'avg_value_7d': round(random.uniform(1000, 500000), 2),
        'std_value_7d': round(random.uniform(1000, 1000000), 2),
        'unique_counterparts_30d': random.randint(1, 50),
        'entropy_of_destinations': round(random.uniform(-10, 10), 2),
    }
    
    # For Isolation Forest
    iso_features = {
        'tx_count_24h': random.randint(1, 50),
        'total_value_24h': round(random.uniform(1000, 1000000), 2),
        'largest_value_24h': round(random.uniform(1000, 500000), 2),
        'std_value_24h': round(random.uniform(1000, 1000000), 2),
        'unique_counterparts_24h': random.randint(1, 50),
        'entropy_of_destinations': round(random.uniform(-10, 10), 2),
        'share_of_daily_volume': round(random.uniform(0, 1), 3),
        'relative_max_vs_global': round(random.uniform(0, 100000), 2),
    }
    
    # Use ISO features (superset) for prediction
    features_for_prediction = iso_features.copy()
    features_for_prediction.update(rf_features)
    
    print("\nRANDOM FEATURE VECTOR FOR PREDICTION:")
    for i, (k, v) in enumerate(sorted(features_for_prediction.items()), 1):
        print(f"  {i:2d}. {k:35s}: {v}")
    
    print("\n" + "=" * 90)
    print("SENDING TO ORCHESTRATOR")
    print("=" * 90)
    
    wallet = f"addr_test1qrandom{random.randint(1000000000, 9999999999)}"
    
    response = requests.post(
        f"http://127.0.0.1:8080/masumi/predict?wallet_address={wallet}&include_shap=true",
        json=features_for_prediction,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    if response.status_code == 200:
        result = response.json()
        
        print("\nORCHESTRATOR RESPONSE:")
        
        if "prediction" in result and "prediction" in result["prediction"]:
            pred = result["prediction"]["prediction"]
            
            print("\nPREDICTION RESULTS:")
            print(f"  Risk Score:    {pred.get('risk_score', 'N/A')}")
            print(f"  Anomaly Flag:  {pred.get('anomaly_flag', 'N/A')}")
            
            # SHAP Explanation
            if "shap_explanation" in pred and pred["shap_explanation"]:
                shap_data = pred["shap_explanation"]
                print("\nSHAP EXPLANATION (Feature Importance):")
                
                if isinstance(shap_data, dict):
                    sorted_shap = sorted(
                        shap_data.items(),
                        key=lambda x: abs(float(x[1])) if isinstance(x[1], (int, float)) else 0,
                        reverse=True
                    )
                    
                    for i, (feat, imp) in enumerate(sorted_shap[:15], 1):
                        print(f"  {i:2d}. {feat:35s}: {imp}")
                    
                    if len(sorted_shap) > 15:
                        print(f"  ... and {len(sorted_shap) - 15} more features")
                
                print("\nINTERPRETATION:")
                print("  SHAP values show how much each feature contributes to the")
                print("  prediction. Positive values increase risk, negative decrease it.")
            
            # Anomaly Info
            if "anomaly_info" in pred and pred["anomaly_info"]:
                print("\nANOMALY INFO:")
                anom = pred["anomaly_info"]
                if isinstance(anom, dict):
                    for k, v in list(anom.items())[:5]:
                        print(f"  {k}: {v}")
            
            # Graph Features
            if "graph_features" in pred and pred["graph_features"]:
                print("\nGRAPH FEATURES:")
                graph = pred["graph_features"]
                if isinstance(graph, dict):
                    for k, v in list(graph.items())[:5]:
                        print(f"  {k}: {v}")
        
        print("\n" + "=" * 90)
        print("SUCCESS: SHAP EXPLANATION GENERATED FOR RANDOM DATA")
        print("=" * 90)
        
        # Save results
        output = {
            "input_features": features_for_prediction,
            "wallet": wallet,
            "prediction_results": pred if "prediction" in result else None,
            "shap_explanation": shap_data if "shap_explanation" in pred else None
        }
        
        with open("shap_results.json", "w") as f:
            json.dump(output, f, indent=2, default=str)
        
        print("\nResults saved to: shap_results.json")
        
    else:
        print(f"Error: {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
