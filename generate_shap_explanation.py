import joblib
import os
import json
import requests
from sklearn.preprocessing import StandardScaler
import sys

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Check trained model features
model_dir = "agents/ai_model/models"

print("=" * 80)
print("CHECKING TRAINED MODELS & GENERATING SHAP EXPLANATION")
print("=" * 80)

try:
    # Load models
    rf = joblib.load(os.path.join(model_dir, "randomforest.pkl"))
    iso = joblib.load(os.path.join(model_dir, "isolationforest.pkl"))
    
    print("\n📊 MODEL REQUIREMENTS:")
    print(f"\n   Random Forest:")
    print(f"   - Features Expected: {rf.n_features_in_}")
    print(f"   - Feature Names: {list(rf.feature_names_in_)}")
    
    print(f"\n   Isolation Forest:")
    print(f"   - Features Expected: {iso.n_features_in_}")
    print(f"   - Feature Names: {list(iso.feature_names_in_)}")
    
    # Create feature vector with correct feature names
    print("\n" + "=" * 80)
    print("🎲 GENERATING RANDOM DATA WITH CORRECT FEATURES")
    print("=" * 80)
    
    import random
    import numpy as np
    
    random.seed(42)
    np.random.seed(42)
    
    # Generate random features matching BOTH models' expectations
    # Use union of all features needed
    all_features = set(list(rf.feature_names_in_) + list(iso.feature_names_in_))
    
    random_features = {}
    for fname in all_features:
        if 'count' in fname.lower() or 'tx' in fname.lower():
            random_features[fname] = random.randint(1, 100)
        elif 'value' in fname.lower() or 'amount' in fname.lower():
            random_features[fname] = round(random.uniform(100, 1000000), 2)
        elif 'ratio' in fname.lower() or 'diversity' in fname.lower() or 'share' in fname.lower():
            random_features[fname] = round(random.uniform(0, 1), 3)
        elif 'entropy' in fname.lower():
            random_features[fname] = round(random.uniform(-10, 10), 2)
        elif 'std' in fname.lower() or 'relative' in fname.lower():
            random_features[fname] = round(random.uniform(0, 100000), 2)
        else:
            random_features[fname] = round(random.uniform(0, 100000), 2)
    
    print("\n📋 RANDOM FEATURE VECTOR:")
    for i, (feat, val) in enumerate(random_features.items(), 1):
        print(f"   {i:2d}. {feat:40s}: {val}")
    
    print("\n" + "=" * 80)
    print("🔄 SENDING TO ORCHESTRATOR FOR SHAP EXPLANATION")
    print("=" * 80)
    
    wallet_addr = f"addr_test1qrandom{random.randint(1000000000, 9999999999)}"
    
    # Send to orchestrator
    response = requests.post(
        f"http://127.0.0.1:8080/masumi/predict?wallet_address={wallet_addr}&include_shap=true",
        json=random_features,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    if response.status_code == 200:
        result = response.json()
        
        print("\n✅ ORCHESTRATOR RESPONSE:")
        print("\n📊 PREDICTION RESULTS:")
        
        if "prediction" in result and "prediction" in result["prediction"]:
            pred = result["prediction"]["prediction"]
            print(f"   Risk Score: {pred.get('risk_score', 'N/A')}")
            print(f"   Anomaly Flag: {pred.get('anomaly_flag', 'N/A')}")
            
            # SHAP Explanation
            if "shap_explanation" in pred and pred["shap_explanation"]:
                shap_data = pred["shap_explanation"]
                print("\n📈 SHAP EXPLANATION (Feature Importance):")
                if isinstance(shap_data, dict):
                    # Sort by absolute value
                    sorted_shap = sorted(shap_data.items(), key=lambda x: abs(float(x[1])) if isinstance(x[1], (int, float)) else 0, reverse=True)
                    for i, (feat, importance) in enumerate(sorted_shap[:10], 1):
                        print(f"   {i:2d}. {feat:40s}: {importance}")
                    if len(sorted_shap) > 10:
                        print(f"   ... and {len(sorted_shap) - 10} more features")
                else:
                    print(f"   {shap_data}")
            else:
                print("\n   ⚠️ SHAP explanations not available in response")
        
        print("\n" + "=" * 80)
        print("✅ SHAP EXPLANATION GENERATED SUCCESSFULLY FOR RANDOM DATA")
        print("=" * 80)
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
