import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Service URLs
  PY_AI_URL: process.env.PY_AI_URL || 'http://localhost:5000',
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  FRONTEND_ORIGIN:'http://localhost:5173',
  // Mocked service delays (ms)
  MASUMI_DELAY: 100,
  AIKEN_DELAY: 100,
  BLOCKFROST_DELAY: 50,
  HYDRA_DELAY: 150,
  // Live Pipeline Configuration
  BLOCKFROST_API_KEY: process.env.BLOCKFROST_API_KEY || '',
  ORCHESTRATOR_URL: process.env.ORCHESTRATOR_URL || 'http://localhost:8080',
  CARDANO_NETWORK: process.env.CARDANO_NETWORK || 'testnet',
  LIVE_PIPELINE_TIMEOUT: parseInt(process.env.LIVE_PIPELINE_TIMEOUT || '300', 10),
  LIVE_PIPELINE_POLL_INTERVAL: parseInt(process.env.LIVE_PIPELINE_POLL_INTERVAL || '2000', 10),
  PAYMENT_REQUIRED: process.env.PAYMENT_REQUIRED === 'true',
  PAYMENT_AMOUNT_ADA: parseFloat(process.env.PAYMENT_AMOUNT_ADA || '2'),
  PAYMENT_ADDRESS: process.env.PAYMENT_ADDRESS || '',
};

export default config;
