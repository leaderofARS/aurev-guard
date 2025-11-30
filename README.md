# AurevGuard

**AurevGuard** is an advanced AI-powered security and analytics platform for the Cardano blockchain. It leverages machine learning and graph analysis to detect suspicious activities, assess wallet risks, and visualize transaction flows in real-time.

## 🚀 Key Features

- **Live Pipeline Analysis**: Real-time fetching and processing of Cardano blocks and transactions via Blockfrost.
- **AI-Driven Risk Assessment**: Machine learning models to score wallets based on transaction patterns.
- **Graph Network Analysis**: Visualization and analysis of transaction relationships using graph theory.
- **Comprehensive Data Engineering**: robust feature engineering pipeline for blockchain data.

## 🛠️ Technology Stack

- **Core**: Python 3.10+
- **Blockchain Data**: Blockfrost API
- **Machine Learning**: Scikit-learn, XGBoost (if applicable)
- **Graph Analysis**: NetworkX
- **Backend**: Node.js / Express (in `apps/backend`)
- **Frontend**: React / Vite (in `apps/frontend`)

## 📂 Project Structure

- `agents/ai_model`: Core AI and data pipeline logic.
  - `src/live_pipeline.py`: Main entry point for live data fetching.
  - `src/feature_engineering.py`: Feature extraction logic.
- `apps/backend`: Backend API services.
- `apps/frontend`: Frontend user interface.

## 🔗 Quick Links

- [Quick Start Guide](quickstart.md)
- [License](LICENSE)
