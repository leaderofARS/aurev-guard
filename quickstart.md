# Quick Start Guide

Follow these steps to set up and run AurevGuard locally.

## Prerequisites

- **Python 3.10+** installed.
- **Node.js & npm** (for full stack apps).
- **Blockfrost API Key**: Get one at [blockfrost.io](https://blockfrost.io/).

## 1. Environment Setup

1.  Clone the repository (if you haven't already).
2.  Create a `.env` file in `agents/ai_model/` (or root, depending on config) with your Blockfrost key:
    ```env
    BLOCKFROST_API_KEY=your_mainnet_or_testnet_key
    BLOCKFROST_PROJECT=mainnet  # or preprod/preview
    ```

## 2. Install Dependencies

Navigate to the AI model directory and install Python dependencies:

```bash
cd agents/ai_model
pip install -r requirements.txt
```

## 3. Run the Live Pipeline

To fetch the latest blockchain data and run the analysis pipeline:

```bash
# From the project root
python -m agents.ai_model.src.live_pipeline
```

To analyze a specific wallet:

```bash
python -m agents.ai_model.src.live_pipeline <wallet_address>
```

## 4. Run the Full Stack Application (Optional)

### Backend
```bash
cd apps/backend
npm install
npm run dev
```

### Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

Access the dashboard at `http://localhost:5173` (default Vite port).
