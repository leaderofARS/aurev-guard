from fastapi import APIRouter
from agents.ai_model.src import live_pipeline

router = APIRouter()

@router.post("/fetch_data")
def fetch_data():
    """
    Trigger live pipeline to pull latest blockchain transactions
    and save them into agents/ai_model/data/transactions.json.
    """
    try:
        live_pipeline.build_live_data(max_blocks=50)  # adjust block count as needed
        return {"status": "ok", "message": "Data fetched and saved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}