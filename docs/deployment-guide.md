# Taska Platform - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Taska platform to production using Docker, AWS infrastructure, and modern DevOps practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Production Deployment](#production-deployment)
5. [Monitoring & Logging](#monitoring--logging)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

## Prerequisites

### Required Tools
- Docker & Docker Compose
- Terraform (>= 1.0)
- AWS CLI configured
- kubectl for Kubernetes management
- Node.js 20 LTS
- Git

### AWS Account Setup
- Valid AWS account with appropriate permissions
- S3 bucket for Terraform state storage
- DynamoDB table for state locking
- Domain name registered and configured

### Environment Variables
Create the following environment files:

#### Production Environment (.env.production)
```bash
# Database
DATABASE_URL=postgresql://username:password@rds-endpoint:5432/taska_production
DATABASE_REPLICA_URL=postgresql://username:password@rds-replica-endpoint:5432/taska_production

# Redis Cache
REDIS_HOST=redis-cluster-endpoint
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS Services
AWS_REGION=af-south-1
AWS_S3_BUCKET=taska-uploads-production
AWS_S3_ACCESS_KEY=your-s3-access-key
AWS_S3_SECRET_KEY=your-s3-secret-key

# Payment Gateways
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
PAYFAST_MERCHANT_ID=your-payfast-merchant-id
PAYFAST_MERCHANT_KEY=your-payfast-merchant-key
PAYFAST_PASSPHRASE=your-payfast-passphrase

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@taska.co.za

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=15
VAT_PERCENTAGE=15
MINIMUM_WITHDRAWAL_AMOUNT=100
MAXIMUM_JOB_BUDGET=50000
```

## Infrastructure Setup

### 1. Terraform State Backend

First, create the Terraform state backend:

```bash
# Create S3 bucket for state
aws s3 mb s3://taska-terraform-state --region af-south-1

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name taska-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region af-south-1
```

### 2. Deploy AWS Infrastructure

```bash
# Navigate to infrastructure directory
cd infrastructure/aws

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var="environment=production" -var="domain_name=taska.co.za"

# Apply the infrastructure
terraform apply -var="environment=production" -var="domain_name=taska.co.za"
```

### 3. Domain Configuration

After Terraform deployment:

1. Update your domain's nameservers to point to AWS Route 53
2. Verify SSL certificate validation in AWS Certificate Manager
3. Wait for DNS propagation (can take up to 48 hours)

## CI/CD Pipeline

### GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=af-south-1

# Environment URLs
STAGING_BACKEND_URL=https://staging-api.taska.co.za
STAGING_FRONTEND_URL=https://staging.taska.co.za
PRODUCTION_BACKEND_URL=https://api.taska.co.za
PRODUCTION_FRONTEND_URL=https://taska.co.za

# Notifications
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

### Pipeline Workflow

The CI/CD pipeline automatically:

1. **Test Phase**: Runs unit tests, integration tests, and security scans
2. **Build Phase**: Creates Docker images for backend and frontend
3. **Deploy Staging**: Automatically deploys to staging environment
4. **Deploy Production**: Manual approval required for production deployment

### Manual Deployment Commands

If you need to deploy manually:

```bash
# Build and push Docker images
docker build -t taska/backend:latest ./backend
docker build -t taska/frontend:latest ./frontend

docker push ghcr.io/your-org/taska/backend:latest
docker push ghcr.io/your-org/taska/frontend:latest

# Deploy to ECS
aws ecs update-service \
  --cluster taska-production \
  --service taska-backend-production \
  --force-new-deployment

aws ecs update-service \
  --cluster taska-production \
  --service taska-frontend-production \
  --force-new-deployment
```

## Production Deployment

### 1. Database Migration

Before deploying new versions, run database migrations:

```bash
# Connect to production database via bastion host
kubectl exec -n taska deployment/backend -- npx prisma migrate deploy

# Or via direct connection (if allowed)
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 2. Health Check Verification

Before switching traffic, verify all services are healthy:

```bash
# Run health check script
./scripts/health-check.sh production

# Check individual services
curl -f https://api.taska.co.za/health
curl -f https://taska.co.za/api/health
```

### 3. Blue-Green Deployment

The deployment uses blue-green strategy:

1. New version deployed alongside current version
2. Health checks performed on new version
3. Traffic gradually shifted to new version
4. Old version kept for quick rollback if needed

### 4. Rollback Procedure

If issues are detected:

```bash
# Immediate rollback via GitHub Actions
# Go to Actions tab and run "Rollback Production" workflow

# Or manual rollback
aws ecs update-service \
  --cluster taska-production \
  --service taska-backend-production \
  --task-definition previous-task-definition-arn
```

## Monitoring & Logging

### 1. Prometheus Metrics

Access Prometheus dashboard at: `https://metrics.taska.co.za`

Key metrics to monitor:
- API response times (target: <200ms p95)
- Error rates (target: <1%)
- Database connection pool usage
- Memory and CPU utilization
- Active user sessions

### 2. Log Aggregation

Logs are collected using the ELK stack:

- **Loki**: Log aggregation and storage
- **Promtail**: Log collection from containers
- **Grafana**: Visualization and alerting

Access Grafana dashboard at: `https://logs.taska.co.za`

### 3. Application Monitoring

- **Sentry**: Error tracking and performance monitoring
- **New Relic**: APM and infrastructure monitoring
- **Uptime Robot**: External uptime monitoring

### 4. Alert Configuration

Critical alerts configured for:
- Service downtime (>2 minutes)
- High error rates (>5% for 5 minutes)
- Database connection failures
- High response times (>500ms p95 for 10 minutes)
- SSL certificate expiration (30 days before)

## Security Considerations

### 1. Network Security

- All traffic encrypted in transit (TLS 1.2+)
- VPC with private subnets for databases
- WAF configured for common attack patterns
- Rate limiting at nginx and application level

### 2. Data Protection

- Database encryption at rest
- S3 bucket encryption enabled
- Secrets managed via AWS Secrets Manager
- Regular security scans via Trivy and CodeQL

### 3. Access Control

- MFA required for all AWS access
- Role-based access control (RBAC)
- VPN required for database access
- Regular access reviews and rotation

### 4. Compliance

- GDPR/POPIA compliance measures
- Audit logging for all critical operations
- Data retention policies implemented
- Regular security assessments

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check ECS service status
aws ecs describe-services --cluster taska-production --services taska-backend-production

# Check task logs
aws logs get-log-events --log-group-name /ecs/taska-production --log-stream-name stream-name

# Check container health
docker ps
docker logs container-name
```

#### 2. Database Connection Issues

```bash
# Test database connectivity
psql "postgresql://username:password@rds-endpoint:5432/taska_production" -c "SELECT 1;"

# Check connection pool stats
# Access application metrics at /metrics endpoint
```

#### 3. High Memory Usage

```bash
# Check memory usage
docker stats

# Scale up services if needed
aws ecs update-service \
  --cluster taska-production \
  --service taska-backend-production \
  --desired-count 3
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
aws acm describe-certificate --certificate-arn your-cert-arn

# Test SSL configuration
openssl s_client -connect taska.co.za:443 -servername taska.co.za
```

### Performance Issues

#### 1. Slow API Responses

- Check database query performance
- Review Redis cache hit rates
- Analyze slow query logs
- Consider scaling database instance

#### 2. High Load

- Enable auto-scaling for ECS services
- Add CloudFront caching for static assets
- Optimize database queries
- Implement API response caching

## Maintenance

### 1. Regular Tasks

#### Daily
- Monitor dashboard for anomalies
- Check error rates and response times
- Review security alerts

#### Weekly
- Review and rotate logs
- Update dependencies (security patches)
- Backup verification
- Performance review

#### Monthly
- Security scan and vulnerability assessment
- Capacity planning review
- Cost optimization review
- Access control audit

### 2. Backup and Recovery

#### Database Backups
- Automated daily backups to S3
- 7-day retention for daily backups
- Monthly backups retained for 1 year
- Cross-region backup replication

#### Application Backups
- Infrastructure as Code (Terraform)
- Application code in Git
- Docker images in container registry
- Configuration in AWS Secrets Manager

#### Recovery Procedures
1. **Database Recovery**: Restore from RDS automated backup
2. **Application Recovery**: Deploy from Git using CI/CD pipeline
3. **Infrastructure Recovery**: Re-apply Terraform configuration
4. **Disaster Recovery**: Cross-region failover (manual process)

### 3. Scaling Considerations

#### Horizontal Scaling
- ECS auto-scaling based on CPU/memory utilization
- Database read replicas for read-heavy workloads
- Redis cluster for cache scaling
- CDN for static asset distribution

#### Vertical Scaling
- Database instance size upgrades
- ECS task definition resource limits
- Load balancer capacity adjustments

### 4. Cost Optimization

- Use Spot instances for non-critical workloads
- Implement lifecycle policies for S3 storage
- Regular review of unused resources
- Reserved instances for predictable workloads

## Support and Contacts

### Emergency Contacts
- **DevOps Lead**: devops@taska.co.za
- **Platform Team**: platform@taska.co.za
- **Security Team**: security@taska.co.za

### Service Level Objectives (SLOs)
- **Uptime**: 99.9% (excluding planned maintenance)
- **API Response Time**: <200ms (95th percentile)
- **Error Rate**: <1% of all requests
- **Recovery Time**: <4 hours for critical issues

### Documentation Links
- [API Documentation](https://api.taska.co.za/docs)
- [Infrastructure Runbook](./infrastructure-runbook.md)
- [Security Playbook](./security-playbook.md)
- [Incident Response Guide](./incident-response.md)

---

## Conclusion

This deployment guide provides a comprehensive foundation for running the Taska platform in production. Regular review and updates of this documentation are essential as the platform evolves.

For questions or issues not covered in this guide, please contact the platform team at platform@taska.co.za.
