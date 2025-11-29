import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import scanRoutes from "./routes/scan.js";
import aiRoutes from "./routes/ai.js";
import agentRoutes from "./routes/agent.js";
import contractRoutes from "./routes/contract.js";
import riskRoutes from "./routes/risk.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/scan", scanRoutes);
app.use("/ai", aiRoutes);
app.use("/agent", agentRoutes);
app.use("/contract", contractRoutes);
app.use("/risk", riskRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

export default app;
