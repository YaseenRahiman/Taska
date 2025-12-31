#!/bin/bash

# ============================================
# Taska Platform - AWS Infrastructure Setup
# ============================================
# This script sets up the initial AWS infrastructure
# Run this ONCE before deploying the application

set -e  # Exit on error

echo "=========================================="
echo "Taska AWS Infrastructure Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"af-south-1"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
STATE_BUCKET="taska-terraform-state"
LOCK_TABLE="taska-terraform-locks"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    echo "Install it from: https://www.terraform.io/downloads"
    exit 1
fi

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ Connected to AWS Account: ${ACCOUNT_ID}${NC}"

# Step 1: Create S3 bucket for Terraform state
echo -e "\n${YELLOW}Step 1: Creating S3 bucket for Terraform state...${NC}"

if aws s3 ls "s3://${STATE_BUCKET}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating bucket: ${STATE_BUCKET}"

    if [ "$AWS_REGION" = "us-east-1" ]; then
        aws s3api create-bucket \
            --bucket "${STATE_BUCKET}" \
            --region "${AWS_REGION}"
    else
        aws s3api create-bucket \
            --bucket "${STATE_BUCKET}" \
            --region "${AWS_REGION}" \
            --create-bucket-configuration LocationConstraint="${AWS_REGION}"
    fi

    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "${STATE_BUCKET}" \
        --versioning-configuration Status=Enabled

    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket "${STATE_BUCKET}" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'

    # Block public access
    aws s3api put-public-access-block \
        --bucket "${STATE_BUCKET}" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

    echo -e "${GREEN}✓ S3 bucket created successfully${NC}"
else
    echo -e "${GREEN}✓ S3 bucket already exists${NC}"
fi

# Step 2: Create DynamoDB table for state locking
echo -e "\n${YELLOW}Step 2: Creating DynamoDB table for state locking...${NC}"

if ! aws dynamodb describe-table --table-name "${LOCK_TABLE}" --region "${AWS_REGION}" &> /dev/null; then
    echo "Creating DynamoDB table: ${LOCK_TABLE}"

    aws dynamodb create-table \
        --table-name "${LOCK_TABLE}" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "${AWS_REGION}" \
        --tags Key=Project,Value=Taska Key=Environment,Value=${ENVIRONMENT}

    echo "Waiting for table to be created..."
    aws dynamodb wait table-exists --table-name "${LOCK_TABLE}" --region "${AWS_REGION}"

    echo -e "${GREEN}✓ DynamoDB table created successfully${NC}"
else
    echo -e "${GREEN}✓ DynamoDB table already exists${NC}"
fi

# Step 3: Create ECR repositories
echo -e "\n${YELLOW}Step 3: Creating ECR repositories...${NC}"

for repo in "taska/backend" "taska/frontend"; do
    if ! aws ecr describe-repositories --repository-names "${repo}" --region "${AWS_REGION}" &> /dev/null 2>&1; then
        echo "Creating ECR repository: ${repo}"
        aws ecr create-repository \
            --repository-name "${repo}" \
            --region "${AWS_REGION}" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        echo -e "${GREEN}✓ Created repository: ${repo}${NC}"
    else
        echo -e "${GREEN}✓ Repository already exists: ${repo}${NC}"
    fi
done

# Step 4: Initialize Terraform
echo -e "\n${YELLOW}Step 4: Initializing Terraform...${NC}"

cd ../../infrastructure/aws

terraform init

echo -e "${GREEN}✓ Terraform initialized${NC}"

# Step 5: Validate Terraform configuration
echo -e "\n${YELLOW}Step 5: Validating Terraform configuration...${NC}"

terraform validate

echo -e "${GREEN}✓ Terraform configuration is valid${NC}"

# Step 6: Plan infrastructure
echo -e "\n${YELLOW}Step 6: Planning infrastructure deployment...${NC}"
echo -e "${YELLOW}Review the plan carefully before proceeding${NC}\n"

terraform plan -out=tfplan

# Summary
echo -e "\n=========================================="
echo -e "${GREEN}Infrastructure Setup Complete!${NC}"
echo -e "==========================================\n"

echo "Next steps:"
echo "1. Review the Terraform plan above"
echo "2. If everything looks good, run:"
echo "   cd infrastructure/aws"
echo "   terraform apply tfplan"
echo ""
echo "3. This will create:"
echo "   - VPC and networking"
echo "   - RDS PostgreSQL database"
echo "   - ElastiCache Redis"
echo "   - ECS Cluster"
echo "   - Application Load Balancer"
echo "   - S3 buckets"
echo "   - CloudFront distribution"
echo ""
echo -e "${YELLOW}Estimated time: 15-20 minutes${NC}"
echo -e "${YELLOW}Estimated cost: ~$100-150/month${NC}"
echo ""
echo "After deployment, run:"
echo "  terraform output > ../../.aws-outputs.json"
echo ""
