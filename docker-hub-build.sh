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

# Check if buildx is available and create a builder if needed
echo "🔧 Setting up Docker Buildx..."
if ! docker buildx ls | grep -q "multiarch"; then
    echo "📦 Creating multiarch builder..."
    docker buildx create --name multiarch --use
else
    echo "📦 Using existing multiarch builder..."
    docker buildx use multiarch
fi

# Login to Docker Hub (you'll be prompted for credentials)
echo "🔐 Logging into Docker Hub..."
docker login

# Build the image for multiple platforms and push to Docker Hub
echo "🔨 Building Docker image for multiple platforms (linux/amd64, linux/arm64)..."
docker buildx build --platform linux/amd64,linux/arm64 -t $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION --push .
docker buildx build --platform linux/amd64,linux/arm64 -t $DOCKERHUB_USERNAME/$IMAGE_NAME:latest --push .

# Build local copy for immediate use (ARM64 for Mac M3)
echo "🏠 Building local copy for immediate use (ARM64)..."
docker buildx build --platform linux/arm64 -t $DOCKERHUB_USERNAME/$IMAGE_NAME:latest --load .

echo "✅ Build completed successfully!"

echo ""
echo "🎉 Successfully pushed to Docker Hub!"
echo "📋 Image URLs:"
echo "   - $DOCKERHUB_USERNAME/$IMAGE_NAME:$VERSION"
echo "   - $DOCKERHUB_USERNAME/$IMAGE_NAME:latest"
echo ""
echo "🚀 You can now pull and run this image on any Docker host (AMD64/ARM64):"
echo "   docker pull $DOCKERHUB_USERNAME/$IMAGE_NAME:latest"
echo "   docker run -p 8080:8080 -v ./data:/home/node/okapi/data $DOCKERHUB_USERNAME/$IMAGE_NAME:latest"
echo ""
echo "💡 This image now supports both AMD64 (Intel/AMD) and ARM64 (Apple Silicon) architectures!"
