import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Mocked service delays (ms)
  MASUMI_DELAY: 100,
  AIKEN_DELAY: 100,
  BLOCKFROST_DELAY: 50,
  HYDRA_DELAY: 150,
};

export default config;
