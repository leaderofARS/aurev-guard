# AI Model & Data Pipeline

This module is the intelligence core of AurevGuard. It handles the entire data lifecycle from raw blockchain data to actionable risk insights.

## Key Components

- **`src/`**: Source code for the pipeline, agents, and models.
- **`data/`**: Local storage for fetched transactions and processed datasets.
- **`models/`**: Serialized machine learning models (e.g., `.joblib`, `.pkl`).

## Setup

1.  Install dependencies: `pip install -r requirements.txt`
2.  Set `BLOCKFROST_API_KEY` in `.env`.

## Usage

Run the live pipeline:
```bash
python -m src.live_pipeline
```
