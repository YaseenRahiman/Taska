# Taska Platform - AWS Deployment Guide

Complete Infrastructure as Code deployment for Taska platform in AWS Africa (Cape Town) region.

## 🏗️ Architecture Overview

### Components
- **ECR**: Docker image repositories (frontend, backend)
- **CodeBuild**: Build Docker images from GitHub
- **CodePipeline**: CI/CD automation (GitHub → Build → Deploy)
- **ECS Fargate**: Serverless container orchestration
- **RDS PostgreSQL**: Managed databases (DEV, UAT, PROD)
- **ElastiCache Redis**: Managed caching
- **Application Load Balancer**: Traffic distribution
- **VPC**: Network isolation and security

### Environments
- **DEV**: Development environment
- **UAT**: User Acceptance Testing
- **PROD**: Production environment

## 📋 Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   # Set region to: af-south-1
   ```

2. **AWS Account** with appropriate permissions
   - CloudFormation
   - ECS, ECR
   - RDS, ElastiCache
   - CodePipeline, CodeBuild
   - VPC, IAM

3. **GitHub Repository**
   - Repository: YaseenRahiman/Taska
   - Branch: main
   - GitHub Personal Access Token (for CodePipeline)

4. **Domain Name** (optional)
   - For production deployment
   - Route53 hosted zone

## 🚀 Quick Start Deployment

### Step 1: Create GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with scopes:
   - `repo` (full control of private repositories)
   - `admin:repo_hook` (for webhooks)
3. Save the token securely

### Step 2: Deploy Infrastructure

```bash
# Navigate to infrastructure directory
cd infrastructure

# Deploy entire stack (recommended)
./deploy.sh --environment dev --github-token YOUR_TOKEN

# Or deploy specific components
./deploy.sh --environment dev --component network --github-token YOUR_TOKEN
./deploy.sh --environment dev --component database --github-token YOUR_TOKEN
```

### Step 3: Push Docker Images (First Time)

```bash
# Login to ECR
aws ecr get-login-password --region af-south-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.af-south-1.amazonaws.com

# Build and push frontend
cd frontend
docker build -t taska-frontend .
docker tag taska-frontend:latest ACCOUNT_ID.dkr.ecr.af-south-1.amazonaws.com/taska-frontend-dev:latest
docker push ACCOUNT_ID.dkr.ecr.af-south-1.amazonaws.com/taska-frontend-dev:latest

# Build and push backend
cd ../backend
docker build -t taska-backend .
docker tag taska-backend:latest ACCOUNT_ID.dkr.ecr.af-south-1.amazonaws.com/taska-backend-dev:latest
docker push ACCOUNT_ID.dkr.ecr.af-south-1.amazonaws.com/taska-backend-dev:latest
```

### Step 4: Run Database Migrations

```bash
# Connect to RDS instance
# Get RDS endpoint from CloudFormation outputs
aws cloudformation describe-stacks --stack-name taska-database-dev --query 'Stacks[0].Outputs'

# Run migrations (from local machine or bastion host)
DATABASE_URL=postgresql://taska_user:YOUR_PASSWORD@RDS_ENDPOINT:5432/taska_dev
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### Step 5: Access Your Application

```bash
# Get Load Balancer DNS
aws cloudformation describe-stacks --stack-name taska-load-balancer-dev --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text
```

Visit: `http://LOAD_BALANCER_DNS`

## 📦 Deployment Components

### 1. Network Infrastructure (`network.yaml`)
- VPC with public/private subnets across 2 AZs
- Internet Gateway
- NAT Gateways
- Route Tables
- Security Groups

### 2. ECR Repositories (`ecr.yaml`)
- Frontend image repository
- Backend image repository
- Lifecycle policies

### 3. Database (`database.yaml`)
- RDS PostgreSQL (Multi-AZ for prod)
- DB subnet group
- Parameter groups
- Automated backups

### 4. Cache (`cache.yaml`)
- ElastiCache Redis cluster
- Cache subnet group
- Parameter groups

### 5. ECS Cluster (`ecs-cluster.yaml`)
- Fargate cluster
- CloudWatch log groups
- Task execution role

### 6. ECS Services (`ecs-services.yaml`)
- Frontend service (Next.js)
- Backend service (NestJS)
- Task definitions
- Auto-scaling policies

### 7. Load Balancer (`load-balancer.yaml`)
- Application Load Balancer
- Target groups (frontend, backend)
- Listeners and rules

### 8. CodeBuild (`codebuild.yaml`)
- Frontend build project
- Backend build project
- Build environments
- Build specifications

### 9. CodePipeline (`codepipeline.yaml`)
- Source stage (GitHub)
- Build stage (CodeBuild)
- Deploy stage (ECS)
- Webhook for automatic deployments

### 10. IAM Roles (`iam.yaml`)
- ECS task execution role
- ECS task role
- CodeBuild service role
- CodePipeline service role

## 🔧 Configuration

### Environment Variables

Edit parameter files in `cloudformation/parameters/`:
- `dev-parameters.json`
- `uat-parameters.json`
- `prod-parameters.json`

### Database Configuration

```json
{
  "DBInstanceClass": "db.t3.micro",  // Dev
  "DBAllocatedStorage": "20",
  "DBName": "taska_dev",
  "DBUsername": "taska_user",
  "DBPassword": "CHANGE_THIS_PASSWORD"
}
```

### ECS Task Resources

```json
{
  "FrontendCPU": "256",      // 0.25 vCPU
  "FrontendMemory": "512",   // 512 MB
  "BackendCPU": "512",       // 0.5 vCPU
  "BackendMemory": "1024"    // 1 GB
}
```

## 🔄 CI/CD Pipeline Flow

```
GitHub Push (main branch)
    ↓
CodePipeline Triggered
    ↓
Source Stage: Clone from GitHub
    ↓
Build Stage:
  → CodeBuild: Build frontend Docker image → Push to ECR
  → CodeBuild: Build backend Docker image → Push to ECR
    ↓
Deploy Stage:
  → Update ECS Frontend Service (rolling deployment)
  → Update ECS Backend Service (rolling deployment)
    ↓
Health Checks & Verification
    ↓
✅ Deployment Complete
```

## 📊 Monitoring & Logging

### CloudWatch Logs
- Frontend logs: `/ecs/taska-frontend-dev`
- Backend logs: `/ecs/taska-backend-dev`
- CodeBuild logs: `/aws/codebuild/taska-*`

### CloudWatch Metrics
- ECS CPU/Memory utilization
- ALB request count & latency
- RDS connections & performance
- ElastiCache hit rate

### Alarms
```bash
# View all alarms
aws cloudwatch describe-alarms --alarm-name-prefix taska
```

## 🛠️ Maintenance

### Update Application Code
```bash
# Push to GitHub main branch - pipeline auto-deploys
git push origin main
```

### Manual ECS Deployment
```bash
# Force new deployment
aws ecs update-service --cluster taska-cluster-dev --service taska-frontend-dev --force-new-deployment
```

### Database Backups
```bash
# Create manual snapshot
aws rds create-db-snapshot --db-instance-identifier taska-db-dev --db-snapshot-identifier taska-dev-$(date +%Y%m%d)
```

### Scale Services
```bash
# Update desired count
aws ecs update-service --cluster taska-cluster-dev --service taska-backend-dev --desired-count 3
```

## 🧹 Cleanup

### Delete Specific Environment
```bash
./deploy.sh --environment dev --delete
```

### Delete All Resources
```bash
# Warning: This deletes everything!
aws cloudformation delete-stack --stack-name taska-pipeline-dev
aws cloudformation delete-stack --stack-name taska-ecs-services-dev
aws cloudformation delete-stack --stack-name taska-load-balancer-dev
aws cloudformation delete-stack --stack-name taska-ecs-cluster-dev
aws cloudformation delete-stack --stack-name taska-cache-dev
aws cloudformation delete-stack --stack-name taska-database-dev
aws cloudformation delete-stack --stack-name taska-ecr-dev
aws cloudformation delete-stack --stack-name taska-network-dev
```

## 🔐 Security Best Practices

1. **Secrets Management**
   - Store database passwords in AWS Secrets Manager
   - Use IAM roles instead of access keys
   - Rotate credentials regularly

2. **Network Security**
   - Private subnets for databases
   - Security groups with minimal access
   - VPC endpoints for AWS services

3. **Container Security**
   - Scan images for vulnerabilities
   - Use minimal base images
   - Run as non-root user

4. **Monitoring**
   - Enable VPC Flow Logs
   - CloudTrail for API auditing
   - GuardDuty for threat detection

## 💰 Cost Optimization

### Development Environment (~$50-100/month)
- ECS Fargate: ~$20-30
- RDS t3.micro: ~$15-20
- ElastiCache t3.micro: ~$10-15
- ALB: ~$16
- Data transfer: ~$5-10

### Production Environment (~$200-400/month)
- ECS Fargate (3 tasks): ~$60-90
- RDS db.t3.medium (Multi-AZ): ~$70-100
- ElastiCache t3.medium: ~$40-60
- ALB: ~$16
- Data transfer: ~$20-40

### Cost Savings Tips
1. Use Auto Scaling for ECS tasks
2. Schedule DEV environment shutdown (nights/weekends)
3. Use Reserved Instances for RDS in production
4. Enable S3 lifecycle policies
5. Review CloudWatch Logs retention

## 📞 Support

- AWS Support: https://console.aws.amazon.com/support
- Documentation: https://docs.aws.amazon.com
- Taska GitHub: https://github.com/YaseenRahiman/Taska

## 🔄 Version History

- **v1.0.0** (2026-02-16): Initial CloudFormation deployment setup
  - Complete infrastructure automation
  - Multi-environment support (DEV/UAT/PROD)
  - CI/CD pipeline with CodePipeline
  - ECS Fargate deployment
  - RDS PostgreSQL & ElastiCache Redis
