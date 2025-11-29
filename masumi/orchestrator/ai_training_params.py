"""
ai_training_params.py
Complete AI model training parameters extracted from agents/ai_model/src pipeline.
Maps all training configurations, data sources, and model hyperparameters.
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# =====================================
# DATA LOADING PARAMETERS
# =====================================

class TransactionDataParams(BaseModel):
    """Parameters for loading transaction data"""
    source: str = "agents/ai_model/data/transactions.json"
    blockfrost_api_key: Optional[str] = None
    blockfrost_project: str = "mainnet"  # mainnet, testnet, preview
    max_blocks: int = 500
    tx_count_per_address: int = 50
    fetch_utxos: bool = True
    include_metadata: bool = True


class DataIOParams(BaseModel):
    """Parameters for I/O caching and loading"""
    io_cache_path: str = "agents/ai_model/data/io_cache.csv"
    raw_json_path: str = "agents/ai_model/data/transactions.json"
    ensure_cache: bool = True
    min_tx_per_address: int = 15
    pad_with_synthetic: bool = True


# =====================================
# FEATURE ENGINEERING PARAMETERS
# =====================================

class VolumeFeatureParams(BaseModel):
    """Parameters for volume-based features"""
    time_windows: List[str] = ["24h", "7d", "30d"]
    aggregate_methods: List[str] = ["sum", "mean", "std", "max"]
    include_normalized: bool = True


class EntropyFeatureParams(BaseModel):
    """Parameters for entropy-based features"""
    use_shannon_entropy: bool = True
    use_renyi_entropy: bool = True
    renyi_alpha: float = 2.0
    min_support: int = 2


class DailyAggregationParams(BaseModel):
    """Parameters for daily feature aggregation"""
    daily_features_path: str = "agents/ai_model/data/daily_features.csv"
    include_rolling_stats: bool = True
    rolling_window_days: int = 7
    compute_volatility: bool = True


# =====================================
# GRAPH FEATURE PARAMETERS
# =====================================

class GraphBuildParams(BaseModel):
    """Parameters for building transaction graph"""
    graph_features_path: str = "agents/ai_model/data/graph_features.csv"
    edge_weight_method: str = "frequency"  # frequency, amount, time_decay
    time_decay_factor: float = 0.95
    min_edge_weight: int = 1


class GraphMetricsParams(BaseModel):
    """Parameters for graph metric computation"""
    compute_degree: bool = True
    compute_weighted_degree: bool = True
    compute_clustering: bool = True
    compute_centrality: List[str] = ["betweenness", "closeness", "eigenvector"]
    centrality_approximation: bool = True
    k_neighbors_for_approximation: int = 100


class CommunityDetectionParams(BaseModel):
    """Parameters for community detection"""
    use_community_detection: bool = True
    algorithm: str = "louvain"  # louvain, greedy_modularity, label_propagation
    resolution: float = 1.0
    max_iterations: int = 100


# =====================================
# ANOMALY DETECTION PARAMETERS
# =====================================

class IsolationForestParams(BaseModel):
    """Parameters for Isolation Forest model"""
    n_estimators: int = 300
    max_samples: str = "auto"
    contamination: float = 0.1
    max_features: float = 1.0
    bootstrap: bool = False
    n_jobs: int = -1
    random_state: int = 42
    warm_start: bool = False


class OneClassSVMParams(BaseModel):
    """Parameters for One-Class SVM anomaly detection"""
    kernel: str = "rbf"
    nu: float = 0.1  # upper bound on fraction of training errors
    gamma: str = "scale"
    degree: int = 3
    coef0: float = 0.0
    shrinking: bool = True
    tol: float = 0.001
    cache_size: float = 200.0


class LocalOutlierFactorParams(BaseModel):
    """Parameters for Local Outlier Factor anomaly detection"""
    n_neighbors: int = 20
    algorithm: str = "auto"
    metric: str = "minkowski"
    p: int = 2
    contamination: float = 0.1
    novelty: bool = False
    leaf_size: int = 30


class AnomalyEnsembleParams(BaseModel):
    """Parameters for ensemble anomaly detection"""
    use_isolation_forest: bool = True
    use_one_class_svm: bool = True
    use_lof: bool = True
    ensemble_method: str = "voting"  # voting, averaging, weighted
    voting_threshold: float = 0.5
    weights: Optional[Dict[str, float]] = None


# =====================================
# ANOMALY DETECTION ML PIPELINE
# =====================================

class ScalingParams(BaseModel):
    """Parameters for feature scaling"""
    method: str = "standard"  # standard, minmax, robust, yeo_johnson
    scale_before_iso: bool = False
    scale_before_svm: bool = True
    scale_before_lof: bool = True


class FeatureSelectionParams(BaseModel):
    """Parameters for feature selection"""
    use_feature_selection: bool = True
    method: str = "variance"  # variance, correlation, mutual_info
    variance_threshold: float = 0.0
    n_features_to_select: Optional[int] = None
    handle_inf_and_nan: bool = True


# =====================================
# SUPERVISED ML PIPELINE (RANDOM FOREST)
# =====================================

class RandomForestParams(BaseModel):
    """Parameters for Random Forest classifier"""
    n_estimators: int = 200
    max_depth: Optional[int] = 20
    min_samples_split: int = 5
    min_samples_leaf: int = 2
    max_features: str = "sqrt"
    bootstrap: bool = True
    oob_score: bool = True
    n_jobs: int = -1
    random_state: int = 42
    class_weight: str = "balanced"


class TrainTestSplitParams(BaseModel):
    """Parameters for train/test split"""
    test_size: float = 0.2
    stratify: bool = True
    random_state: int = 42


class ModelEvaluationParams(BaseModel):
    """Parameters for model evaluation"""
    compute_roc_auc: bool = True
    compute_precision_recall: bool = True
    compute_confusion_matrix: bool = True
    compute_feature_importance: bool = True
    n_cv_folds: int = 5


# =====================================
# SHAP EXPLAINABILITY PARAMETERS
# =====================================

class SHAPExplainerParams(BaseModel):
    """Parameters for SHAP explanation"""
    explainer_type: str = "tree"  # tree, kernel, sampling
    background_data_size: Optional[int] = 100
    compute_interaction_values: bool = False
    save_artifacts: bool = True


class SHAPArtifactParams(BaseModel):
    """Parameters for SHAP artifact saving"""
    shap_dir: str = "agents/ai_model/data/shap"
    save_shap_values: bool = True
    save_summary_csv: bool = True
    save_per_address_json: bool = True
    save_plot_images: bool = True
    plot_format: str = "png"


class NarrativeExplainerParams(BaseModel):
    """Parameters for narrative explanation generation"""
    generate_narratives: bool = True
    max_features_in_narrative: int = 5
    use_feature_names: bool = True
    threshold_for_mention: float = 0.01


# =====================================
# DATA EXPORT PARAMETERS
# =====================================

class DataExportParams(BaseModel):
    """Parameters for exporting processed data"""
    export_dir: str = "agents/ai_model/data/export"
    export_features_csv: bool = True
    export_predictions_json: bool = True
    export_addresses_json: bool = True
    export_timeseries_json: bool = True
    include_metadata: bool = True


# =====================================
# LIVE PIPELINE PARAMETERS
# =====================================

class LivePipelineParams(BaseModel):
    """Parameters for live inference pipeline"""
    update_frequency_seconds: int = 3600  # 1 hour
    batch_inference: bool = True
    batch_size: int = 100
    cache_predictions: bool = True
    cache_ttl_seconds: int = 86400  # 24 hours
    alert_on_anomaly: bool = True
    alert_threshold: float = 0.85


# =====================================
# INFERENCE PARAMETERS
# =====================================

class InferenceParams(BaseModel):
    """Parameters for inference"""
    use_isolation_forest: bool = True
    use_random_forest: bool = True
    use_ensemble: bool = True
    ensemble_voting_method: str = "weighted"
    prediction_threshold: float = 0.5
    return_confidence: bool = True
    return_explanation: bool = True
    explanation_depth: str = "detailed"  # brief, detailed, full


class InferenceEngineParams(BaseModel):
    """Parameters for inference engine"""
    model_dir: str = "agents/ai_model/models"
    cache_models: bool = True
    async_inference: bool = True
    batch_processing: bool = True
    max_queue_size: int = 1000


# =====================================
# PREPROCESSING PARAMETERS
# =====================================

class PreprocessingParams(BaseModel):
    """Parameters for data preprocessing"""
    drop_zero_variance: bool = True
    handle_missing: str = "mean"  # mean, median, ffill, drop
    handle_outliers: bool = True
    outlier_method: str = "iqr"  # iqr, zscore
    outlier_threshold: float = 3.0
    log_transform_skewed: bool = True
    skewness_threshold: float = 1.0


# =====================================
# COMPLETE AI TRAINING CONFIGURATION
# =====================================

class AITrainingConfig(BaseModel):
    """Complete configuration for AI model training pipeline"""
    # Metadata
    config_version: str = "1.0.0"
    created_at: datetime
    updated_at: datetime
    name: str = "aurev-guard-ai-training"
    description: str = "Complete AUREV Guard AI training pipeline configuration"

    # Data loading
    transaction_data: TransactionDataParams = TransactionDataParams()
    data_io: DataIOParams = DataIOParams()

    # Feature engineering
    volume_features: VolumeFeatureParams = VolumeFeatureParams()
    entropy_features: EntropyFeatureParams = EntropyFeatureParams()
    daily_aggregation: DailyAggregationParams = DailyAggregationParams()

    # Graph analysis
    graph_build: GraphBuildParams = GraphBuildParams()
    graph_metrics: GraphMetricsParams = GraphMetricsParams()
    community_detection: CommunityDetectionParams = CommunityDetectionParams()

    # Anomaly detection
    isolation_forest: IsolationForestParams = IsolationForestParams()
    one_class_svm: OneClassSVMParams = OneClassSVMParams()
    local_outlier_factor: LocalOutlierFactorParams = LocalOutlierFactorParams()
    anomaly_ensemble: AnomalyEnsembleParams = AnomalyEnsembleParams()

    # ML pipeline
    scaling: ScalingParams = ScalingParams()
    feature_selection: FeatureSelectionParams = FeatureSelectionParams()
    random_forest: RandomForestParams = RandomForestParams()
    train_test_split: TrainTestSplitParams = TrainTestSplitParams()
    model_evaluation: ModelEvaluationParams = ModelEvaluationParams()

    # Explainability
    shap_explainer: SHAPExplainerParams = SHAPExplainerParams()
    shap_artifacts: SHAPArtifactParams = SHAPArtifactParams()
    narrative_explainer: NarrativeExplainerParams = NarrativeExplainerParams()

    # Data export
    data_export: DataExportParams = DataExportParams()

    # Live pipeline
    live_pipeline: LivePipelineParams = LivePipelineParams()

    # Inference
    inference: InferenceParams = InferenceParams()
    inference_engine: InferenceEngineParams = InferenceEngineParams()

    # Preprocessing
    preprocessing: PreprocessingParams = PreprocessingParams()

    def to_dict(self) -> Dict[str, Any]:
        """Export complete config as dictionary"""
        if hasattr(self, "model_dump"):  # Pydantic v2
            return self.model_dump()
        return self.dict()  # Pydantic v1

    def to_yaml_dict(self) -> Dict[str, Any]:
        """Export config in YAML-friendly format"""
        config_dict = self.to_dict()
        # Flatten or restructure as needed
        return config_dict
