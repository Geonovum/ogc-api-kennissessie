#!/bin/bash

# Docker Hub Build and Push Script for OGC API Kennissessie
# Account: lathoub
#
# Use a Docker Hub Personal Access Token (Read & Write), not the browser
# device-code login. Create one at https://hub.docker.com/settings/security
# Optional: export DOCKERHUB_TOKEN to skip the prompt.

set -euo pipefail

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running."
  echo "Current context: $(docker context show 2>/dev/null || echo unknown)"
  echo "Start Docker Desktop (or OrbStack), wait until it is ready, then retry."
  exit 1
fi

DOCKERHUB_USERNAME="lathoub"
IMAGE_NAME="okapi"
VERSION="$(node -p "require('./package.json').version")"
IMAGE="$DOCKERHUB_USERNAME/$IMAGE_NAME"

echo "Building and pushing OGC API Kennissessie to Docker Hub..."
echo "Account: $DOCKERHUB_USERNAME"
echo "Image:   $IMAGE_NAME"
echo "Version: $VERSION"
echo ""

echo "Logging into Docker Hub as $DOCKERHUB_USERNAME (PAT via stdin, no browser)..."
if [ -z "${DOCKERHUB_TOKEN:-}" ]; then
  echo "Paste a Docker Hub Personal Access Token (Read & Write), then press Enter."
  echo "Create one at: https://hub.docker.com/settings/security"
  read -r -s -p "PAT: " DOCKERHUB_TOKEN
  echo
fi
if [ -z "$DOCKERHUB_TOKEN" ]; then
  echo "No token provided. Set DOCKERHUB_TOKEN or paste a PAT."
  exit 1
fi
printf '%s' "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
unset DOCKERHUB_TOKEN

echo "Setting up Docker Buildx (multiarch)..."
if docker buildx inspect multiarch >/dev/null 2>&1; then
  docker buildx use multiarch
  docker buildx stop multiarch || true
else
  docker buildx create --name multiarch --driver docker-container --use
fi
docker buildx inspect multiarch --bootstrap >/dev/null

echo "Building and pushing linux/amd64,linux/arm64 ($IMAGE:$VERSION and :latest)..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "$IMAGE:$VERSION" \
  -t "$IMAGE:latest" \
  --push \
  .

LOCAL_PLATFORM="linux/amd64"
if [ "$(uname -m)" = "arm64" ] || [ "$(uname -m)" = "aarch64" ]; then
  LOCAL_PLATFORM="linux/arm64"
fi
echo "Loading local $LOCAL_PLATFORM image as $IMAGE:latest..."
docker buildx build \
  --platform "$LOCAL_PLATFORM" \
  -t "$IMAGE:latest" \
  --load \
  .

echo "Build completed successfully!"
echo ""
echo "Pushed:"
echo "  - $IMAGE:$VERSION"
echo "  - $IMAGE:latest"
echo ""
echo "Pull and run:"
echo "  docker pull $IMAGE:latest"
echo "  docker run -p 8080:8080 -v ./data:/home/node/okapi/data $IMAGE:latest"
