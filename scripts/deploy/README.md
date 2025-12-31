# Deployment Scripts

Automated scripts to help deploy Taska Platform to AWS.

## Prerequisites

Before running these scripts, ensure you have:

1. **AWS account** with admin access
2. **AWS CLI** installed and configured (`aws configure`)
3. **Terraform** installed (v1.0+)
4. **Docker** installed and running
5. **Node.js** and npm installed

## Scripts Overview

### 1. `01-setup-aws-infrastructure.sh`

Sets up the foundational AWS infrastructure.

**What it does:**
- Creates S3 bucket for Terraform state
- Creates DynamoDB table for state locking
- Creates ECR repositories for Docker images
- Initializes Terraform
- Validates configuration
- Generates deployment plan

**Usage:**
```bash
./01-setup-aws-infrastructure.sh
```

**Environment variables:**
- `AWS_REGION` - AWS region (default: af-south-1)
- `ENVIRONMENT` - Environment name (default: production)

**Example:**
```bash
AWS_REGION=af-south-1 ENVIRONMENT=production ./01-setup-aws-infrastructure.sh
```

**Duration:** ~5 minutes (just setup, actual infrastructure deployment is separate)

**After running:**
```bash
# Review the Terraform plan
cd ../../infrastructure/aws

# Apply the infrastructure (takes 15-20 minutes)
terraform apply

# Save outputs
terraform output -json > ../../.aws-outputs.json
```

---

### 2. `02-build-and-deploy.sh`

Builds Docker images and deploys the application to ECS.

**What it does:**
- Logs in to AWS ECR
- Builds backend Docker image
- Builds frontend Docker image
- Pushes images to ECR
- Runs database migrations
- Updates ECS services (if they exist)

**Usage:**
```bash
./02-build-and-deploy.sh
```

**Environment variables:**
- `AWS_REGION` - AWS region (default: af-south-1)
- `ENVIRONMENT` - Environment name (default: production)
- `DATABASE_URL` - Database connection string (required for migrations)

**Example:**
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
AWS_REGION=af-south-1 ./02-build-and-deploy.sh
```

**Duration:** ~15 minutes

**Requirements:**
- Infrastructure must be deployed first (script 01)
- `.env.production` configured
- ECS task definitions created
- ECS services created

---

## Deployment Workflow

### First Time Deployment

1. **Setup infrastructure:**
   ```bash
   ./01-setup-aws-infrastructure.sh
   cd ../../infrastructure/aws
   terraform apply
   terraform output -json > ../../.aws-outputs.json
   ```

2. **Configure environment:**
   ```bash
   cd ../..
   cp .env.production.template .env.production
   # Edit .env.production with your values
   ```

3. **Create ECS resources:**
   - Create task definitions (see `infrastructure/aws/ecs-task-backend.json`)
   - Create ECS services
   - Attach to load balancer

4. **Deploy application:**
   ```bash
   export DATABASE_URL="your-database-url"
   ./scripts/deploy/02-build-and-deploy.sh
   ```

### Subsequent Deployments

For code updates, just run:
```bash
./scripts/deploy/02-build-and-deploy.sh
```

This will:
- Build new images
- Push to ECR
- Force new ECS deployment
- Rolling update with zero downtime

---

## Manual Deployment Steps

If you prefer to run commands manually:

### Infrastructure Setup

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket taska-terraform-state \
  --region af-south-1 \
  --create-bucket-configuration LocationConstraint=af-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket taska-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name taska-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region af-south-1

# Create ECR repositories
aws ecr create-repository --repository-name taska/backend --region af-south-1
aws ecr create-repository --repository-name taska/frontend --region af-south-1

# Deploy infrastructure with Terraform
cd infrastructure/aws
terraform init
terraform plan
terraform apply
```

### Application Deployment

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.af-south-1.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region af-south-1 | \
  docker login --username AWS --password-stdin ${ECR_URL}

# Build and push backend
cd backend
docker build --platform linux/amd64 -t ${ECR_URL}/taska/backend:latest .
docker push ${ECR_URL}/taska/backend:latest

# Build and push frontend
cd ../frontend
docker build --platform linux/amd64 -t ${ECR_URL}/taska/frontend:latest .
docker push ${ECR_URL}/taska/frontend:latest

# Run migrations
cd ../backend
export DATABASE_URL="postgresql://..."
npm run db:migrate

# Update ECS services
aws ecs update-service \
  --cluster taska-production \
  --service taska-backend-production \
  --force-new-deployment \
  --region af-south-1

aws ecs update-service \
  --cluster taska-production \
  --service taska-frontend-production \
  --force-new-deployment \
  --region af-south-1
```

---

## Troubleshooting

### Script fails with "command not found"

**Problem:** Required tools not installed

**Solution:**
```bash
# Check what's missing
aws --version
terraform --version
docker --version

# Install missing tools (see docs/AWS_QUICK_START.md)
```

### "AccessDenied" errors

**Problem:** AWS credentials not configured or insufficient permissions

**Solution:**
```bash
# Configure AWS CLI
aws configure

# Verify credentials
aws sts get-caller-identity

# Check IAM permissions (need AdministratorAccess or similar)
```

### "Bucket already exists" error

**Problem:** S3 bucket names are globally unique

**Solution:** Edit script and change bucket name:
```bash
STATE_BUCKET="taska-terraform-state-YOUR_UNIQUE_ID"
```

### Docker build fails

**Problem:** Docker not running or insufficient resources

**Solution:**
```bash
# Start Docker Desktop
# Increase Docker memory (Preferences → Resources → Memory → 4GB+)
# Clean up old images
docker system prune -a
```

### Terraform times out

**Problem:** RDS creation takes 10-15 minutes

**Solution:** Be patient! This is normal. Get a coffee ☕

### Database migrations fail

**Problem:** `DATABASE_URL` not set or database not accessible

**Solution:**
```bash
# Get database endpoint from Terraform
cd infrastructure/aws
terraform output database_endpoint

# Set DATABASE_URL
export DATABASE_URL="postgresql://user:pass@endpoint:5432/db"

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### ECS service not updating

**Problem:** Service or task definition doesn't exist

**Solution:** Create ECS task definition and service first (see AWS Console or CLI)

---

## Environment Variables Reference

### AWS Configuration
- `AWS_REGION` - AWS region (default: af-south-1)
- `ENVIRONMENT` - Environment name (production, staging, etc.)
- `AWS_PROFILE` - AWS CLI profile (optional)

### Application Configuration
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis endpoint
- `REDIS_PASSWORD` - Redis password
- `S3_BUCKET` - S3 bucket name
- `JWT_SECRET` - JWT signing secret

See `.env.production.template` for full list.

---

## Security Notes

⚠️ **Important:**
- Never commit `.env.production` to git
- Store credentials securely (use password manager)
- Rotate credentials regularly
- Use AWS Secrets Manager in production
- Enable MFA on all AWS accounts
- Use least-privilege IAM policies

---

## CI/CD Integration

These scripts can be integrated into CI/CD pipelines:

**GitHub Actions example:**
```yaml
- name: Deploy to AWS
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    ./scripts/deploy/02-build-and-deploy.sh
```

---

## Getting Help

- Full deployment guide: `docs/AWS_DEPLOYMENT_GUIDE.md`
- Quick start guide: `docs/AWS_QUICK_START.md`
- Deployment checklist: `docs/DEPLOYMENT_CHECKLIST.md`

---

**Happy Deploying! 🚀**
