#!/usr/bin/env bash
# Helper: build and run python-ai in Docker
set -e
IMAGE_NAME="aurev-ai-stub"
cd "$(dirname "$0")"
docker build -t ${IMAGE_NAME} .
docker run --rm -p 5000:5000 ${IMAGE_NAME}
