# AWS Quick Start Guide

**Don't have an AWS account yet?** Follow this quick guide to get started!

## 1. Create AWS Account (15 minutes)

### Step-by-Step:

1. **Go to [aws.amazon.com](https://aws.amazon.com)**

2. **Click "Create an AWS Account"**

3. **Fill in account details:**
   - Root user email address
   - AWS account name: "Taska Production" (or your choice)
   - Click "Verify email address"
   - Enter the verification code from your email

4. **Create password:**
   - Strong password (save it in a password manager!)
   - Confirm password

5. **Contact information:**
   - Account type: **Personal** (unless you have a company)
   - Full name, phone number, country, address

6. **Payment information:**
   - Add credit/debit card
   - You won't be charged unless you exceed free tier limits
   - AWS will make a small verification charge ($1) that will be refunded

7. **Confirm identity:**
   - Phone verification (SMS or voice call)
   - Enter code received

8. **Select support plan:**
   - Choose **"Basic support - Free"**
   - You can upgrade later if needed

9. **Complete!**
   - You'll receive confirmation email
   - Sign in to AWS Console

## 2. Secure Your Account (10 minutes)

### Enable MFA (Multi-Factor Authentication) - CRITICAL!

1. Sign in to [AWS Console](https://console.aws.amazon.com)
2. Click your account name (top right) → **Security credentials**
3. Under "Multi-factor authentication (MFA)", click **Activate MFA**
4. Choose **Virtual MFA device**
5. Use **Google Authenticator** or **Authy** app:
   - Download app on your phone
   - Scan QR code shown
   - Enter two consecutive MFA codes
6. Click **Assign MFA**

**Important:** Save backup codes in a safe place!

### Create IAM Admin User (Don't use root account!)

1. In AWS Console, search for **IAM**
2. Click **Users** → **Add users**
3. Settings:
   - Username: `taska-admin`
   - Access type: ✅ Both "Programmatic access" and "AWS Management Console access"
   - Console password: Custom or autogenerate
   - ✅ Require password reset (unchecked for simplicity)
4. Click **Next: Permissions**
5. **Attach existing policies directly**
6. Search and check: **AdministratorAccess**
7. Click **Next: Tags** (skip)
8. Click **Next: Review**
9. Click **Create user**
10. **IMPORTANT:** Download the CSV file with credentials
    - Store it securely (password manager)
    - You'll need these credentials for deployment

## 3. Set Up Billing Alerts (5 minutes)

Avoid surprise charges!

1. Go to **Billing Dashboard** (click account name → Billing)
2. In left menu: **Budgets** → **Create budget**
3. Budget setup:
   - Choose template: **Monthly cost budget**
   - Budget name: `Taska Monthly Budget`
   - Budgeted amount: `$100` (adjust as needed)
   - Email: Your email address
4. Click **Create budget**

You'll get alerts at:
- 85% of budget
- 100% of budget
- Forecasted to exceed

## 4. Install Required Tools (15 minutes)

### AWS CLI

**macOS:**
```bash
brew install awscli
```

**Windows:**
Download and install: https://awscli.amazonaws.com/AWSCLIV2.msi

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Verify:**
```bash
aws --version
```

### Terraform

**macOS:**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Windows:**
Download from: https://www.terraform.io/downloads

**Linux:**
```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

**Verify:**
```bash
terraform --version
```

### Docker Desktop

Download and install from: https://docs.docker.com/get-docker/

**Verify:**
```bash
docker --version
docker-compose --version
```

## 5. Configure AWS Credentials (5 minutes)

Use the IAM user credentials from step 2:

```bash
aws configure
```

Enter when prompted:
- **AWS Access Key ID:** (from CSV file)
- **AWS Secret Access Key:** (from CSV file)
- **Default region:** `af-south-1` (Cape Town - best for South Africa)
- **Default output format:** `json`

**Verify:**
```bash
aws sts get-caller-identity
```

Should show your account ID and user ARN.

## 6. Deploy Infrastructure (30 minutes)

### Run Setup Script

```bash
cd scripts/deploy
./01-setup-aws-infrastructure.sh
```

This will:
- Create S3 bucket for Terraform state
- Create DynamoDB table for locking
- Create ECR repositories
- Initialize Terraform
- Plan infrastructure

### Apply Infrastructure

```bash
cd ../../infrastructure/aws
terraform apply
```

Type `yes` when prompted.

**Wait time:** 15-20 minutes (mostly database creation)

### Save Outputs

```bash
terraform output -json > ../../.aws-outputs.json
```

## 7. Configure Environment Variables (10 minutes)

```bash
# Copy template
cp .env.production.template .env.production

# Edit the file with your values
nano .env.production  # or use your preferred editor
```

Fill in from Terraform outputs:
- Database endpoint and password
- Redis endpoint
- S3 bucket name
- AWS credentials

Generate secrets:
```bash
# JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 8. Deploy Application (15 minutes)

```bash
# Set environment variables
export DATABASE_URL="postgresql://..." # from .env.production

# Run deployment script
cd scripts/deploy
./02-build-and-deploy.sh
```

This will:
- Build Docker images
- Push to ECR
- Run database migrations
- Update ECS services

## 9. Verify Deployment (5 minutes)

```bash
# Get load balancer URL
cd ../../infrastructure/aws
terraform output load_balancer_dns

# Test the backend
curl http://[LOAD_BALANCER_URL]/health

# View logs
aws logs tail /ecs/taska-production --follow
```

## Total Time Estimate

- AWS Account Setup: **15 min**
- Security Setup: **10 min**
- Billing Alerts: **5 min**
- Install Tools: **15 min**
- Configure Credentials: **5 min**
- Infrastructure Deploy: **30 min** (mostly waiting)
- Configure Env Vars: **10 min**
- Application Deploy: **15 min**
- Verify: **5 min**

**Total: ~2 hours** (includes waiting time)

## Costs Breakdown

### Free Tier (First 12 months)

If you're in your first 12 months, you get:
- 750 hours EC2 t2.micro
- 20 GB RDS storage
- 5 GB S3 storage
- 25 GB DynamoDB storage

### Estimated Monthly Costs After Free Tier

| Service | Cost |
|---------|------|
| RDS PostgreSQL (db.t3.medium) | ~$50 |
| ElastiCache Redis (cache.t3.micro x2) | ~$30 |
| ECS Fargate (2 tasks) | ~$30-40 |
| NAT Gateway (2 AZs) | ~$64 |
| Load Balancer | ~$20 |
| S3 + CloudFront | ~$5-10 |
| Data Transfer | ~$10-20 |
| **Total** | **~$209-234/month** |

### Cost Optimization Tips

1. **Use Spot Instances** for ECS (up to 70% savings)
2. **Single NAT Gateway** instead of 2 ($32/month savings)
3. **Smaller RDS** (db.t3.small = $25/month savings)
4. **Single Redis node** ($15/month savings)
5. **Auto-scaling** to scale down during low traffic

**Optimized cost:** ~$100-120/month

## Common Issues & Solutions

### Issue: "AccessDenied" errors

**Solution:** Check IAM permissions
```bash
aws iam get-user
```

### Issue: "Bucket already exists"

**Solution:** Bucket names are global. Change name in script:
```bash
STATE_BUCKET="taska-terraform-state-YOUR_UNIQUE_ID"
```

### Issue: Terraform timeout

**Solution:** Database creation takes time (10-15 min). Be patient!

### Issue: Can't connect to database

**Solution:** Check security groups allow your IP:
```bash
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

## Next Steps

1. **Set up domain:** Configure Route 53 for your domain
2. **SSL certificate:** Validate ACM certificate
3. **Configure SendGrid:** For email sending
4. **Set up Stripe/PayFast:** For payments
5. **Enable monitoring:** CloudWatch dashboards
6. **CI/CD pipeline:** GitHub Actions for auto-deploy

## Getting Help

- **AWS Documentation:** https://docs.aws.amazon.com
- **AWS Support:** Free tier includes basic support
- **AWS Forums:** https://forums.aws.amazon.com
- **Terraform Docs:** https://www.terraform.io/docs

## Important Security Notes

- ✅ Never commit `.env.production` to git
- ✅ Rotate credentials regularly
- ✅ Use AWS Secrets Manager for production
- ✅ Enable CloudTrail for audit logs
- ✅ Regular security audits with AWS Security Hub
- ✅ Keep MFA enabled always

---

**Ready to start?** Begin with [Create AWS Account](#1-create-aws-account-15-minutes)

For detailed information, see the full [AWS Deployment Guide](./AWS_DEPLOYMENT_GUIDE.md).
