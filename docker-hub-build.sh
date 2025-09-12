#!/bin/bash

# Docker Hub Build and Push Script for OGC API Kennissessie
# Account: lathoub

set -e

# Configuration
DOCKERHUB_USERNAME="lathoub"
IMAGE_NAME="okapi"
VERSION="1.3.47"

echo "🐳 Building and pushing OGC API Kennissessie to Docker Hub..."
echo "📦 Account: $DOCKERHUB_USERNAME"
echo "🏷️  Image: $IMAGE_NAME"
echo "📋 Version: $VERSION"
echo ""

# Build the image
echo "🔨 Building Docker image..."
docker build -t $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION .
docker build -t $DOCKERHUB_USERNAME/$IMAGE_NAME:latest .

echo "✅ Build completed successfully!"
echo ""

# Login to Docker Hub (you'll be prompted for credentials)
echo "🔐 Logging into Docker Hub..."
docker login

# Push the images
echo "📤 Pushing images to Docker Hub..."
docker push $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION
docker push $DOCKERHUB_USERNAME/$IMAGE_NAME:latest

echo ""
echo "🎉 Successfully pushed to Docker Hub!"
echo "📋 Image URLs:"
echo "   - $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION"
echo "   - $DOCKERHUB_USERNAME/$IMAGE_NAME:latest"
echo ""
echo "🚀 You can now pull and run this image on any Docker host:"
echo "   docker pull $DOCKERHUB_USERNAME/$IMAGE_NAME:latest"
echo "   docker run -p 8081:8081 -v ./data:/home/node/okapi/data $DOCKERHUB_USERNAME/$IMAGE_NAME:latest"
