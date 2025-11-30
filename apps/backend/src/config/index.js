import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Service URLs
  PY_AI_URL: process.env.PY_AI_URL || 'http://localhost:5000',
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  // Mocked service delays (ms)
  MASUMI_DELAY: 100,
  AIKEN_DELAY: 100,
  BLOCKFROST_DELAY: 50,
  HYDRA_DELAY: 150,
};

export default config;
