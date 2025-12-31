#!/bin/bash

# ============================================
# Taska Platform - Build and Deploy
# ============================================
# This script builds Docker images and deploys to AWS ECS

set -e  # Exit on error

echo "=========================================="
echo "Taska Application Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION=${AWS_REGION:-"af-south-1"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${GREEN}✓ AWS Account: ${ACCOUNT_ID}${NC}"
echo -e "${GREEN}✓ Region: ${AWS_REGION}${NC}"
echo -e "${GREEN}✓ ECR URL: ${ECR_URL}${NC}"

# Step 1: Login to ECR
echo -e "\n${YELLOW}Step 1: Logging in to ECR...${NC}"

aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_URL}

echo -e "${GREEN}✓ Logged in to ECR${NC}"

# Step 2: Build backend
echo -e "\n${YELLOW}Step 2: Building backend Docker image...${NC}"

cd ../../backend

echo "Building taska/backend..."
docker build \
    --platform linux/amd64 \
    -t taska/backend:latest \
    -t taska/backend:${ENVIRONMENT} \
    -t ${ECR_URL}/taska/backend:latest \
    -t ${ECR_URL}/taska/backend:${ENVIRONMENT} \
    .

echo -e "${GREEN}✓ Backend image built${NC}"

# Step 3: Build frontend
echo -e "\n${YELLOW}Step 3: Building frontend Docker image...${NC}"

cd ../frontend

echo "Building taska/frontend..."
docker build \
    --platform linux/amd64 \
    -t taska/frontend:latest \
    -t taska/frontend:${ENVIRONMENT} \
    -t ${ECR_URL}/taska/frontend:latest \
    -t ${ECR_URL}/taska/frontend:${ENVIRONMENT} \
    .

echo -e "${GREEN}✓ Frontend image built${NC}"

# Step 4: Push images to ECR
echo -e "\n${YELLOW}Step 4: Pushing images to ECR...${NC}"

echo "Pushing backend..."
docker push ${ECR_URL}/taska/backend:latest
docker push ${ECR_URL}/taska/backend:${ENVIRONMENT}

echo "Pushing frontend..."
docker push ${ECR_URL}/taska/frontend:latest
docker push ${ECR_URL}/taska/frontend:${ENVIRONMENT}

echo -e "${GREEN}✓ Images pushed to ECR${NC}"

# Step 5: Run database migrations
echo -e "\n${YELLOW}Step 5: Running database migrations...${NC}"
echo -e "${BLUE}Note: Make sure DATABASE_URL is set in your environment${NC}"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL not set. Skipping migrations.${NC}"
    echo "Set DATABASE_URL and run migrations manually:"
    echo "  cd backend"
    echo "  npm run db:migrate"
else
    cd ../backend
    echo "Running Prisma migrations..."
    npm run db:migrate
    echo -e "${GREEN}✓ Migrations completed${NC}"
fi

# Step 6: Deploy to ECS (placeholder - needs ECS setup)
echo -e "\n${YELLOW}Step 6: Deploying to ECS...${NC}"
echo -e "${BLUE}Note: ECS deployment requires task definitions and services to be set up${NC}"

# Get cluster name
CLUSTER_NAME="taska-${ENVIRONMENT}"

# Check if cluster exists
if aws ecs describe-clusters --clusters ${CLUSTER_NAME} --region ${AWS_REGION} | grep -q "ACTIVE"; then
    echo -e "${GREEN}✓ ECS Cluster found: ${CLUSTER_NAME}${NC}"

    # Update backend service (if exists)
    if aws ecs describe-services --cluster ${CLUSTER_NAME} --services taska-backend-${ENVIRONMENT} --region ${AWS_REGION} 2>/dev/null | grep -q "ACTIVE"; then
        echo "Updating backend service..."
        aws ecs update-service \
            --cluster ${CLUSTER_NAME} \
            --service taska-backend-${ENVIRONMENT} \
            --force-new-deployment \
            --region ${AWS_REGION} \
            > /dev/null
        echo -e "${GREEN}✓ Backend service updated${NC}"
    else
        echo -e "${YELLOW}Backend service not found. Create it first via AWS Console or CLI${NC}"
    fi

    # Update frontend service (if exists)
    if aws ecs describe-services --cluster ${CLUSTER_NAME} --services taska-frontend-${ENVIRONMENT} --region ${AWS_REGION} 2>/dev/null | grep -q "ACTIVE"; then
        echo "Updating frontend service..."
        aws ecs update-service \
            --cluster ${CLUSTER_NAME} \
            --service taska-frontend-${ENVIRONMENT} \
            --force-new-deployment \
            --region ${AWS_REGION} \
            > /dev/null
        echo -e "${GREEN}✓ Frontend service updated${NC}"
    else
        echo -e "${YELLOW}Frontend service not found. Create it first via AWS Console or CLI${NC}"
    fi
else
    echo -e "${YELLOW}ECS Cluster not found. Run infrastructure setup first.${NC}"
fi

# Summary
echo -e "\n=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "==========================================\n"

echo "Images deployed:"
echo "  - ${ECR_URL}/taska/backend:latest"
echo "  - ${ECR_URL}/taska/frontend:latest"
echo ""

echo "Next steps:"
echo "1. Verify ECS services are running:"
echo "   aws ecs list-services --cluster ${CLUSTER_NAME} --region ${AWS_REGION}"
echo ""
echo "2. Check service health:"
echo "   aws ecs describe-services --cluster ${CLUSTER_NAME} --services taska-backend-${ENVIRONMENT} --region ${AWS_REGION}"
echo ""
echo "3. View logs:"
echo "   aws logs tail /ecs/taska-${ENVIRONMENT} --follow --region ${AWS_REGION}"
echo ""
echo "4. Get load balancer URL:"
echo "   cd ../infrastructure/aws && terraform output load_balancer_dns"
echo ""
