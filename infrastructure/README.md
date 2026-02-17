# Taska Platform - Infrastructure as Code

Complete AWS deployment automation using CloudFormation templates.

## 📁 Directory Structure

```
infrastructure/
├── DEPLOYMENT_GUIDE.md          # Complete deployment documentation
├── README.md                     # This file
├── deploy.sh                     # Automated deployment script
├── buildspec.yml                 # CodeBuild build specification
├── cloudformation/
│   ├── templates/
│   │   ├── network.yaml          # ✅ VPC, subnets, security groups
│   │   ├── ecr.yaml              # ✅ Docker image repositories
│   │   ├── iam.yaml              # ✅ IAM roles and policies
│   │   ├── database.yaml         # 🔄 RDS PostgreSQL
│   │   ├── cache.yaml            # 🔄 ElastiCache Redis
│   │   ├── ecs-cluster.yaml      # 🔄 ECS Fargate cluster
│   │   ├── load-balancer.yaml    # 🔄 Application Load Balancer
│   │   ├── ecs-services.yaml     # 🔄 ECS services (frontend/backend)
│   │   ├── codebuild.yaml        # 🔄 Build projects
│   │   └── codepipeline.yaml     # 🔄 CI/CD pipeline
│   └── parameters/
│       ├── dev-*.json            # DEV environment parameters
│       ├── uat-*.json            # UAT environment parameters
│       └── prod-*.json           # PROD environment parameters
```

## ✅ Created Templates

1. **network.yaml** (476 lines) - Complete VPC infrastructure
   - VPC with /16 CIDR
   - 2 Public subnets across 2 AZs
   - 2 Private subnets across 2 AZs
   - Internet Gateway
   - 2 NAT Gateways (high availability)
   - Route tables
   - Security groups (ALB, ECS, RDS, ElastiCache)

2. **ecr.yaml** (87 lines) - Docker image repositories
   - Frontend repository with lifecycle policy
   - Backend repository with lifecycle policy
   - Image scanning on push
   - Retention policy (keeps last 10 images)

3. **iam.yaml** (223 lines) - IAM roles and policies
   - ECS Task Execution Role
   - ECS Task Role (S3, SES access)
   - CodeBuild Service Role
   - CodePipeline Service Role

4. **deploy.sh** (270 lines) - Deployment automation
   - Deploy/delete stacks
   - Multi-environment support
   - Dependency ordering
   - Parameter management

5. **DEPLOYMENT_GUIDE.md** (400+ lines) - Complete documentation
   - Architecture overview
   - Prerequisites
   - Step-by-step deployment
   - Monitoring and maintenance
   - Cost optimization

## 🔄 Remaining Templates (Need to Create)

To complete the infrastructure, you need to create the following templates. I can help you create these based on the patterns established above:

### 1. database.yaml
- RDS PostgreSQL instance
- DB subnet group
- Parameter group
- Multi-AZ for production
- Automated backups

### 2. cache.yaml
- ElastiCache Redis cluster
- Subnet group
- Parameter group

### 3. ecs-cluster.yaml
- ECS Fargate cluster
- CloudWatch log groups
- Container Insights

### 4. load-balancer.yaml
- Application Load Balancer
- Target groups (frontend: /, backend: /api/*)
- Listeners (HTTP → HTTPS redirect)
- Health checks

### 5. ecs-services.yaml
- Frontend service (Next.js on port 3000)
- Backend service (NestJS on port 3000)
- Task definitions
- Auto-scaling policies
- Service discovery

### 6. codebuild.yaml
- Frontend build project
- Backend build project
- Build environments (Docker-enabled)
- Build specifications

### 7. codepipeline.yaml
- Source stage (GitHub)
- Build stage (frontend + backend)
- Deploy stage (ECS)
- S3 artifact bucket
- Webhooks

### 8. Parameter Files
- dev-network.json
- dev-ecr.json
- dev-iam.json
- dev-database.json
- dev-cache.json
- dev-ecs-cluster.json
- dev-load-balancer.json
- dev-ecs-services.json
- dev-codebuild.json
- dev-codepipeline.json
- (UAT and PROD versions)

### 9. buildspec.yml
CodeBuild build specification:
```yaml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
  build:
    commands:
      - echo Building frontend Docker image...
      - cd frontend
      - docker build -t $FRONTEND_IMAGE_REPO:$IMAGE_TAG .
      - docker tag $FRONTEND_IMAGE_REPO:$IMAGE_TAG $FRONTEND_IMAGE_REPO:latest

      - echo Building backend Docker image...
      - cd ../backend
      - docker build -t $BACKEND_IMAGE_REPO:$IMAGE_TAG .
      - docker tag $BACKEND_IMAGE_REPO:$IMAGE_TAG $BACKEND_IMAGE_REPO:latest
  post_build:
    commands:
      - echo Pushing Docker images...
      - docker push $FRONTEND_IMAGE_REPO:$IMAGE_TAG
      - docker push $FRONTEND_IMAGE_REPO:latest
      - docker push $BACKEND_IMAGE_REPO:$IMAGE_TAG
      - docker push $BACKEND_IMAGE_REPO:latest
```

## 🚀 Quick Start

Once all templates are created, deploy using:

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy to DEV environment
./deploy.sh --environment dev --github-token YOUR_GITHUB_TOKEN

# Deploy to UAT environment
./deploy.sh --environment uat --github-token YOUR_GITHUB_TOKEN

# Deploy to PROD environment
./deploy.sh --environment prod --github-token YOUR_GITHUB_TOKEN
```

## 📊 Deployment Progress

| Component | Template | Parameters | Status |
|-----------|----------|------------|---------|
| Network | network.yaml | ✅ | ✅ Complete |
| ECR | ecr.yaml | ✅ | ✅ Complete |
| IAM | iam.yaml | ✅ | ✅ Complete |
| Database | database.yaml | ⏳ | ⏳ Pending |
| Cache | cache.yaml | ⏳ | ⏳ Pending |
| ECS Cluster | ecs-cluster.yaml | ⏳ | ⏳ Pending |
| Load Balancer | load-balancer.yaml | ⏳ | ⏳ Pending |
| ECS Services | ecs-services.yaml | ⏳ | ⏳ Pending |
| CodeBuild | codebuild.yaml | ⏳ | ⏳ Pending |
| CodePipeline | codepipeline.yaml | ⏳ | ⏳ Pending |
| Build Spec | buildspec.yml | N/A | ⏳ Pending |

## 💡 Next Steps

1. **Create remaining CloudFormation templates** (I can help with this)
2. **Create parameter files** for each environment
3. **Create buildspec.yml** for CodeBuild
4. **Test deployment** in DEV environment first
5. **Set up monitoring** and alarms
6. **Document environment-specific configurations**

## 🔧 Template Creation Assistance

Would you like me to create the remaining templates? I can generate:
- All remaining CloudFormation templates
- Complete parameter files for DEV/UAT/PROD
- buildspec.yml for Docker builds
- Any additional configuration files needed

Just let me know which templates you'd like me to create next!

## 📞 Support

- See DEPLOYMENT_GUIDE.md for complete documentation
- AWS CloudFormation docs: https://docs.aws.amazon.com/cloudformation
- ECS Fargate docs: https://docs.aws.amazon.com/ecs/
- CodePipeline docs: https://docs.aws.amazon.com/codepipeline/

## 🎯 Estimated Completion Time

- Remaining templates: ~2-3 hours
- Parameter configuration: ~1 hour
- First deployment: ~30-45 minutes
- Testing and validation: ~1-2 hours

**Total**: ~4-6 hours to complete infrastructure automation
