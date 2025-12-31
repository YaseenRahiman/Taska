# AWS Deployment Guide for Taska Platform

Complete guide to deploy the Taska platform to Amazon Web Services (AWS).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [Local Environment Setup](#local-environment-setup)
4. [Infrastructure Deployment](#infrastructure-deployment)
5. [Application Deployment](#application-deployment)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Cost Optimization](#cost-optimization)

## Prerequisites

### What You'll Need

- Credit/debit card for AWS account setup
- Domain name (optional, but recommended for production)
- Email address for AWS account
- Basic command line knowledge

### Estimated Costs

For a small production deployment:
- **Month 1**: ~$150-200 (includes some free tier benefits)
- **Ongoing**: ~$100-150/month depending on usage

Major cost components:
- RDS PostgreSQL: ~$50/month
- ECS Fargate: ~$30-50/month
- ElastiCache Redis: ~$15/month
- NAT Gateway: ~$32/month
- Data transfer: Variable
- S3 & CloudFront: Usage-based

## AWS Account Setup

### Step 1: Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS Account"**
3. Fill in:
   - Email address
   - Password
   - AWS account name (e.g., "Taska Production")
4. Choose **"Personal"** account type
5. Provide contact information
6. Enter payment information (credit/debit card)
7. Verify identity via phone
8. Select **"Basic Support - Free"** plan (you can upgrade later)

**Important**: AWS provides a [Free Tier](https://aws.amazon.com/free/) for 12 months which includes:
- 750 hours/month of EC2 t2.micro instance
- 20 GB of database storage
- 5 GB of S3 storage
- And more!

### Step 2: Secure Your Root Account

**CRITICAL SECURITY STEPS:**

1. **Enable MFA (Multi-Factor Authentication)**:
   - Sign in to AWS Console
   - Click your account name (top right) → Security Credentials
   - Expand "Multi-factor authentication (MFA)"
   - Click "Activate MFA"
   - Choose "Virtual MFA device"
   - Use Google Authenticator or Authy app to scan QR code

2. **Create IAM Admin User** (Never use root account for daily tasks):
   ```bash
   # In AWS Console:
   # 1. Go to IAM → Users → Add User
   # 2. Username: "taska-admin"
   # 3. Access type: Both "Programmatic" and "AWS Management Console"
   # 4. Attach policy: "AdministratorAccess"
   # 5. Download credentials CSV file - SAVE THIS SECURELY!
   ```

### Step 3: Set Up Billing Alerts

1. Go to **Billing Dashboard**
2. Click **"Budgets"** in left menu
3. Click **"Create budget"**
4. Choose **"Cost budget"**
5. Set amount: $100 (or your preferred limit)
6. Set alert at 80% and 100%
7. Enter email for notifications

## Local Environment Setup

### Step 1: Install Required Tools

#### Install AWS CLI

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download installer from: https://awscli.amazonaws.com/AWSCLIV2.msi

**Verify installation:**
```bash
aws --version
# Should show: aws-cli/2.x.x ...
```

#### Install Terraform

**macOS:**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Linux:**
```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

**Windows:**
Download from: https://www.terraform.io/downloads

**Verify installation:**
```bash
terraform --version
# Should show: Terraform v1.x.x
```

#### Install Docker

Follow instructions at: https://docs.docker.com/get-docker/

**Verify installation:**
```bash
docker --version
docker-compose --version
```

### Step 2: Configure AWS Credentials

```bash
# Run AWS configure
aws configure

# Enter your IAM user credentials (from CSV file):
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: af-south-1
# Default output format: json
```

**Verify credentials:**
```bash
aws sts get-caller-identity
# Should show your account ID and user ARN
```

### Step 3: Set Up AWS Region

The Taska infrastructure is configured for **Cape Town region (af-south-1)** by default, which is ideal for South African users.

If you want to use a different region:
1. Edit `infrastructure/aws/main.tf`
2. Change `default = "af-south-1"` to your preferred region
3. **Note**: af-south-1 has the lowest latency for South African users

## Infrastructure Deployment

### Step 1: Prepare Terraform Backend

The infrastructure uses S3 for state management. First-time setup:

```bash
# Navigate to infrastructure directory
cd infrastructure/aws

# Create S3 bucket for Terraform state (one-time setup)
aws s3api create-bucket \
  --bucket taska-terraform-state \
  --region af-south-1 \
  --create-bucket-configuration LocationConstraint=af-south-1

# Enable versioning on the bucket
aws s3api put-bucket-versioning \
  --bucket taska-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket taska-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name taska-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region af-south-1
```

### Step 2: Review and Customize Infrastructure

Edit `infrastructure/aws/main.tf` if needed:

```hcl
# Change domain name if you have one
variable "domain_name" {
  default     = "your-domain.com"  # Change this
}

# Adjust instance sizes to reduce costs (if needed)
# For development/testing, you can use smaller instances:
# - RDS: db.t3.micro instead of db.t3.medium
# - ElastiCache: cache.t3.micro (already set)
```

### Step 3: Initialize Terraform

```bash
cd infrastructure/aws

# Initialize Terraform (download providers)
terraform init

# Validate configuration
terraform validate

# See what will be created
terraform plan
```

Review the plan carefully. You should see:
- VPC and networking components
- RDS PostgreSQL database
- ElastiCache Redis cluster
- ECS cluster
- Load balancer
- S3 bucket
- CloudFront distribution

### Step 4: Deploy Infrastructure

```bash
# Apply the configuration (this will take 15-20 minutes)
terraform apply

# Type 'yes' when prompted
```

**What's happening:**
- Creating VPC with subnets across availability zones
- Setting up database (takes ~10 minutes)
- Configuring Redis cluster
- Creating load balancer
- Setting up S3 and CloudFront

### Step 5: Save Terraform Outputs

```bash
# Get important outputs
terraform output

# Save these values - you'll need them:
terraform output -json > outputs.json

# Get database password (save securely!)
terraform output database_endpoint

# Get Redis endpoint
terraform output redis_endpoint

# Get S3 bucket name
terraform output s3_bucket_name
```

## Application Deployment

### Step 1: Set Up ECR (Elastic Container Registry)

```bash
# Create ECR repositories for your Docker images
aws ecr create-repository \
  --repository-name taska/backend \
  --region af-south-1

aws ecr create-repository \
  --repository-name taska/frontend \
  --region af-south-1

# Get login command
aws ecr get-login-password --region af-south-1 | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.af-south-1.amazonaws.com
```

### Step 2: Configure Environment Variables

Create `.env.production` file in project root:

```bash
# Copy from outputs and set these values
DATABASE_URL=postgresql://taska_admin:[DB_PASSWORD]@[RDS_ENDPOINT]:5432/taska
REDIS_HOST=[REDIS_ENDPOINT]
REDIS_PORT=6379
REDIS_PASSWORD=[REDIS_PASSWORD]

# AWS Configuration
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=[YOUR_ACCESS_KEY]
AWS_SECRET_ACCESS_KEY=[YOUR_SECRET_KEY]
S3_BUCKET=[S3_BUCKET_NAME]

# Security
JWT_SECRET=[GENERATE_RANDOM_STRING]
JWT_REFRESH_SECRET=[GENERATE_RANDOM_STRING]

# Email (SendGrid)
SENDGRID_API_KEY=[GET_FROM_SENDGRID]

# Payment (Stripe)
STRIPE_SECRET_KEY=[GET_FROM_STRIPE]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[GET_FROM_STRIPE]

# Payment (PayFast - for South African payments)
PAYFAST_MERCHANT_ID=[GET_FROM_PAYFAST]
PAYFAST_MERCHANT_KEY=[GET_FROM_PAYFAST]
NEXT_PUBLIC_PAYFAST_MERCHANT_ID=[GET_FROM_PAYFAST]

# Monitoring (Optional - Sentry)
SENTRY_DSN=[GET_FROM_SENTRY]
NEXT_PUBLIC_SENTRY_DSN=[GET_FROM_SENTRY]

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.your-domain.com
```

**Generate secure secrets:**
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Build and Push Docker Images

```bash
# Get ECR URL
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_URL=$AWS_ACCOUNT_ID.dkr.ecr.af-south-1.amazonaws.com

# Build backend
cd backend
docker build -t taska/backend .
docker tag taska/backend:latest $ECR_URL/taska/backend:latest
docker push $ECR_URL/taska/backend:latest

# Build frontend
cd ../frontend
docker build -t taska/frontend .
docker tag taska/frontend:latest $ECR_URL/taska/frontend:latest
docker push $ECR_URL/taska/frontend:latest
```

### Step 4: Create ECS Task Definitions

Create `infrastructure/aws/ecs-task-backend.json`:

```json
{
  "family": "taska-backend-production",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::[ACCOUNT_ID]:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "[ECR_URL]/taska/backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "AWS_REGION", "value": "af-south-1"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/taska-production",
          "awslogs-region": "af-south-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

### Step 5: Run Database Migrations

```bash
# Connect to database from your local machine
# First, get the database endpoint from Terraform outputs
export DB_ENDPOINT=$(terraform output -raw database_endpoint)
export DB_PASSWORD=$(terraform output -raw db_password)

# Set DATABASE_URL
export DATABASE_URL="postgresql://taska_admin:$DB_PASSWORD@$DB_ENDPOINT:5432/taska"

# Run migrations
cd backend
npm run db:migrate
npm run db:seed
```

### Step 6: Deploy to ECS

You can deploy using:
1. **AWS Console** (easier for first time)
2. **AWS CLI** (scriptable)
3. **CI/CD Pipeline** (recommended for production)

**Quick deploy via Console:**
1. Go to ECS in AWS Console
2. Click your cluster → Services → Create
3. Launch type: Fargate
4. Task definition: Select your task
5. Number of tasks: 2
6. Configure load balancer to point to your service

## Post-Deployment Configuration

### Step 1: Configure Domain (Optional)

If you have a domain:

```bash
# In Route 53, create hosted zone for your domain
aws route53 create-hosted-zone \
  --name your-domain.com \
  --caller-reference $(date +%s)

# Point your domain's nameservers to AWS Route 53 nameservers
# (You'll do this in your domain registrar's control panel)

# Create DNS records pointing to CloudFront and ALB
```

### Step 2: Set Up SSL Certificate

```bash
# Certificate is created by Terraform, but needs validation
# Check Certificate Manager in AWS Console
# Add the DNS validation records to your domain
```

### Step 3: Configure External Services

1. **SendGrid** (Email):
   - Sign up at sendgrid.com
   - Create API key
   - Verify sender domain

2. **Stripe** (Payments):
   - Sign up at stripe.com
   - Get API keys from dashboard
   - Set up webhooks

3. **PayFast** (South African Payments):
   - Sign up at payfast.co.za
   - Get merchant credentials
   - Configure webhooks

4. **Sentry** (Error Tracking - Optional):
   - Sign up at sentry.io
   - Create new project
   - Get DSN

### Step 4: Test Your Deployment

```bash
# Get load balancer URL
terraform output load_balancer_dns

# Test backend health
curl http://[LOAD_BALANCER_URL]/health

# Test API
curl http://[LOAD_BALANCER_URL]/api/health
```

## Monitoring and Maintenance

### CloudWatch Dashboards

1. Go to CloudWatch in AWS Console
2. Create custom dashboard for Taska
3. Add widgets for:
   - ECS CPU/Memory utilization
   - RDS connections and performance
   - Redis cache hit ratio
   - ALB request count and latency
   - Application errors (from logs)

### Set Up Alarms

```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name taska-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database connections
# Memory utilization
# Error rate
```

### Regular Backups

RDS automated backups are enabled (7-day retention). For additional security:

```bash
# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier taska-postgres-production \
  --db-snapshot-identifier taska-manual-backup-$(date +%Y%m%d)
```

### View Logs

```bash
# View ECS logs
aws logs tail /ecs/taska-production --follow

# Filter for errors
aws logs filter-log-events \
  --log-group-name /ecs/taska-production \
  --filter-pattern "ERROR"
```

## Cost Optimization

### Tips to Reduce Costs

1. **Use Spot Instances** for non-critical workloads
2. **Enable Auto Scaling** to scale down during low traffic
3. **Use S3 Lifecycle Policies** to move old data to cheaper storage
4. **Review CloudWatch retention** - shorter = cheaper
5. **Delete unused resources** regularly
6. **Use Reserved Instances** if you commit to 1-3 years (up to 75% savings)

### Monthly Cost Review

```bash
# Set up AWS Cost Explorer
# Review costs by service
# Set up billing alerts
```

## Troubleshooting

### Common Issues

**1. Terraform fails with "AccessDenied"**
- Check IAM permissions
- Ensure AWS credentials are configured correctly

**2. Database connection fails**
- Check security group rules
- Verify VPC configuration
- Check database endpoint and credentials

**3. ECS tasks won't start**
- Check CloudWatch logs
- Verify task definition
- Check ECR image exists
- Verify IAM roles

**4. Can't access application**
- Check security groups
- Verify load balancer health checks
- Check DNS configuration
- Verify SSL certificate status

### Getting Help

- AWS Support: https://console.aws.amazon.com/support
- Terraform Documentation: https://www.terraform.io/docs
- AWS Documentation: https://docs.aws.amazon.com

## Next Steps

1. **Set up CI/CD**: Use GitHub Actions or AWS CodePipeline
2. **Enable WAF**: Add Web Application Firewall for security
3. **Configure Auto Scaling**: Automatically scale based on traffic
4. **Set up CloudWatch Alarms**: Get notified of issues
5. **Regular Security Audits**: Use AWS Security Hub
6. **Disaster Recovery Plan**: Document and test recovery procedures

## Security Best Practices

- ✅ Never commit secrets to git
- ✅ Use AWS Secrets Manager for sensitive data
- ✅ Enable MFA on all accounts
- ✅ Regular security updates
- ✅ Use principle of least privilege for IAM
- ✅ Enable CloudTrail for audit logging
- ✅ Regular backup testing
- ✅ Use WAF to protect against common attacks

## Support

For issues specific to Taska deployment, check:
- Project README
- GitHub Issues
- Team documentation

---

**Ready to deploy?** Start with [AWS Account Setup](#aws-account-setup) and work through each section carefully. Take your time and don't skip the security steps!
