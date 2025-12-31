# Taska Platform - AWS Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment

### AWS Account Setup
- [ ] Created AWS account at aws.amazon.com
- [ ] Verified email address
- [ ] Added payment method (credit/debit card)
- [ ] Saved root account credentials securely

### Security Setup
- [ ] Enabled MFA on root account
- [ ] Created IAM admin user (`taska-admin`)
- [ ] Downloaded IAM user credentials (CSV file)
- [ ] Stored credentials in password manager
- [ ] Enabled MFA on IAM user (optional but recommended)

### Billing & Monitoring
- [ ] Set up billing alerts
- [ ] Created budget ($100/month recommended)
- [ ] Configured alert emails

### Local Tools Installation
- [ ] Installed AWS CLI (`aws --version`)
- [ ] Installed Terraform (`terraform --version`)
- [ ] Installed Docker (`docker --version`)
- [ ] Installed Node.js and npm

### AWS Configuration
- [ ] Configured AWS CLI (`aws configure`)
- [ ] Verified credentials (`aws sts get-caller-identity`)
- [ ] Selected region (af-south-1 recommended)

## Infrastructure Deployment

### Terraform Backend Setup
- [ ] Created S3 bucket for Terraform state
- [ ] Enabled versioning on S3 bucket
- [ ] Enabled encryption on S3 bucket
- [ ] Created DynamoDB table for state locking
- [ ] Created ECR repositories (backend & frontend)

### Infrastructure Code Review
- [ ] Reviewed `infrastructure/aws/main.tf`
- [ ] Updated domain name (if you have one)
- [ ] Reviewed instance sizes
- [ ] Reviewed estimated costs
- [ ] Adjusted configuration for your needs

### Terraform Deployment
- [ ] Ran `terraform init`
- [ ] Ran `terraform validate`
- [ ] Ran `terraform plan` and reviewed output
- [ ] Ran `terraform apply`
- [ ] Confirmed with "yes"
- [ ] Waited for completion (~20 minutes)
- [ ] Saved Terraform outputs (`terraform output -json`)

### Infrastructure Verification
- [ ] Verified VPC created
- [ ] Verified RDS database is available
- [ ] Verified Redis cluster is available
- [ ] Verified ECS cluster exists
- [ ] Verified load balancer is active
- [ ] Verified S3 bucket created
- [ ] Verified CloudFront distribution created

## Application Configuration

### Environment Variables
- [ ] Copied `.env.production.template` to `.env.production`
- [ ] Added database URL from Terraform outputs
- [ ] Added database password
- [ ] Added Redis endpoint
- [ ] Added Redis password
- [ ] Generated JWT secret
- [ ] Generated JWT refresh secret
- [ ] Added S3 bucket name
- [ ] Added AWS credentials

### External Services Setup

#### SendGrid (Email)
- [ ] Created SendGrid account
- [ ] Verified sender email/domain
- [ ] Created API key
- [ ] Added API key to `.env.production`
- [ ] Tested email sending

#### Stripe (Payments)
- [ ] Created Stripe account
- [ ] Got API keys (test mode first)
- [ ] Added secret key to `.env.production`
- [ ] Added publishable key to `.env.production`
- [ ] Set up webhooks

#### PayFast (South African Payments)
- [ ] Created PayFast account
- [ ] Got merchant ID and key
- [ ] Added credentials to `.env.production`
- [ ] Set up ITN (Instant Transaction Notification)

#### Sentry (Error Tracking - Optional)
- [ ] Created Sentry account
- [ ] Created new project
- [ ] Got DSN
- [ ] Added DSN to `.env.production`

## Application Deployment

### Database Setup
- [ ] Configured database connection
- [ ] Ran database migrations (`npm run db:migrate`)
- [ ] Ran database seeds (`npm run db:seed`)
- [ ] Verified tables created
- [ ] Tested database connection

### Docker Images
- [ ] Logged in to ECR
- [ ] Built backend Docker image
- [ ] Built frontend Docker image
- [ ] Tagged images with versions
- [ ] Pushed backend to ECR
- [ ] Pushed frontend to ECR
- [ ] Verified images in ECR console

### ECS Deployment
- [ ] Created task definitions (backend & frontend)
- [ ] Created ECS services
- [ ] Configured auto-scaling (optional)
- [ ] Attached services to load balancer
- [ ] Verified services are running
- [ ] Checked service health

## DNS & SSL

### Domain Configuration
- [ ] Purchased domain (or have existing)
- [ ] Created Route 53 hosted zone
- [ ] Updated nameservers at registrar
- [ ] Verified DNS propagation

### SSL Certificate
- [ ] ACM certificate requested (done by Terraform)
- [ ] Added DNS validation records
- [ ] Waited for certificate validation
- [ ] Certificate status: Issued
- [ ] Certificate attached to CloudFront

### DNS Records
- [ ] Created A record for root domain
- [ ] Created A record for www subdomain
- [ ] Created CNAME for API subdomain
- [ ] Verified DNS resolution

## Testing & Verification

### Health Checks
- [ ] Backend health endpoint responding (`/health`)
- [ ] Frontend loading correctly
- [ ] API endpoints working
- [ ] WebSocket connections working

### Functionality Testing
- [ ] User registration works
- [ ] User login works
- [ ] Email sending works
- [ ] File uploads to S3 work
- [ ] Database queries working
- [ ] Redis caching working
- [ ] Payment processing works (test mode)

### Performance Testing
- [ ] Load balancer distributing traffic
- [ ] Auto-scaling triggers (if configured)
- [ ] Database performance acceptable
- [ ] Frontend load time < 3 seconds
- [ ] API response time < 500ms

### Security Testing
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present
- [ ] API authentication working
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] SQL injection protection verified

## Monitoring & Operations

### CloudWatch Setup
- [ ] Log groups created for ECS
- [ ] Logs flowing from backend
- [ ] Logs flowing from frontend
- [ ] Created custom dashboard
- [ ] Set up metric filters

### Alarms
- [ ] High CPU alarm
- [ ] High memory alarm
- [ ] Database connection alarm
- [ ] Error rate alarm
- [ ] 5xx error alarm
- [ ] Configured SNS topic for alerts
- [ ] Added email to SNS topic

### Backups
- [ ] RDS automated backups enabled (7 days)
- [ ] Tested manual snapshot
- [ ] S3 versioning enabled
- [ ] Created backup documentation

### Logging
- [ ] Application logs in CloudWatch
- [ ] Access logs from ALB
- [ ] Error tracking in Sentry
- [ ] Log retention configured

## Post-Deployment

### Documentation
- [ ] Documented deployment process
- [ ] Documented environment variables
- [ ] Documented external services
- [ ] Created runbook for common issues
- [ ] Documented rollback procedure

### Team Access
- [ ] Created IAM users for team members
- [ ] Configured IAM groups and policies
- [ ] Set up MFA for all users
- [ ] Shared credentials securely

### CI/CD Pipeline (Optional)
- [ ] Set up GitHub Actions
- [ ] Configured auto-deploy on merge to main
- [ ] Set up staging environment
- [ ] Configured blue-green deployment

### Performance Optimization
- [ ] Enabled CloudFront caching
- [ ] Configured CDN for static assets
- [ ] Optimized database queries
- [ ] Added database indexes
- [ ] Configured Redis caching strategy

### Security Hardening
- [ ] Enabled AWS WAF
- [ ] Configured WAF rules
- [ ] Enabled CloudTrail
- [ ] Enabled GuardDuty
- [ ] Enabled Security Hub
- [ ] Configured AWS Config
- [ ] Regular security scanning scheduled

### Cost Optimization
- [ ] Reviewed Cost Explorer
- [ ] Set up cost allocation tags
- [ ] Identified unused resources
- [ ] Considered Reserved Instances
- [ ] Configured auto-scaling to reduce costs
- [ ] Reviewed NAT Gateway usage (expensive!)

## Launch Preparation

### Pre-Launch
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] Support procedures documented

### Launch Day
- [ ] Final data migration
- [ ] DNS cutover
- [ ] Monitoring dashboard open
- [ ] Team on standby
- [ ] Announcement prepared

### Post-Launch
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Monitor costs
- [ ] Collect user feedback
- [ ] Address any issues

## Ongoing Maintenance

### Daily
- [ ] Check CloudWatch dashboard
- [ ] Review error logs
- [ ] Check service health

### Weekly
- [ ] Review CloudWatch metrics
- [ ] Check for security updates
- [ ] Review costs
- [ ] Check backup success

### Monthly
- [ ] Security audit
- [ ] Cost optimization review
- [ ] Performance review
- [ ] Update documentation
- [ ] Rotate credentials (if needed)

### Quarterly
- [ ] Disaster recovery test
- [ ] Architecture review
- [ ] Security assessment
- [ ] Cost vs performance optimization

---

## Quick Status Check

**Current Phase:** _________________

**Blockers:** _________________

**Next Steps:** _________________

**Estimated Completion:** _________________

---

## Notes

Use this space for deployment-specific notes, issues encountered, or reminders:

---

**Last Updated:** _________________
