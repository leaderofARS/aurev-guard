import express from "express";
import {
  postScanAddress,
  postAgentDecision,
  postContractLog,
  getDecision,
  postAnchor,
  getProject,
} from "./controllers.js";

const router = express.Router();

// Main endpoints
router.post("/scan/address", postScanAddress);
router.post("/agent/decision", postAgentDecision);
router.post("/contract/log", postContractLog);
router.get("/v1/decisions/:proofId", getDecision);
router.post("/v1/anchor", postAnchor);

// Landing / marketing metadata for frontend
router.get("/project", getProject);

export default router;
