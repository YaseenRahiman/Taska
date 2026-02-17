# CloudFormation Parameter Files

This directory contains parameter files for CloudFormation stack deployments.

## Parameter File Naming Convention

`{environment}-{template-name}.json`

Example: `dev-database.json`, `prod-ecs-services.json`

## Creating Parameter Files

For each CloudFormation template, create a corresponding parameter file for each environment (dev, uat, prod).

### Template List

1. **network** - No parameters needed (uses defaults)
2. **ecr** - No parameters needed (uses defaults)
3. **iam** - No parameters needed (uses defaults)
4. **database** - ✅ Created `dev-database.json`
5. **cache** - Create as needed
6. **ecs-cluster** - No parameters needed (uses defaults)
7. **load-balancer** - No parameters needed (uses defaults from network stack)
8. **ecs-services** - Create as needed (customize CPU/memory)
9. **codebuild** - No parameters needed (uses defaults)
10. **codepipeline** - ✅ Created `dev-codepipeline.json` (⚠️ Add GitHub token via CLI)

## Sample Parameter Files

### dev-ecs-services.json
```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "NetworkStackName",
    "ParameterValue": "taska-network-dev"
  },
  {
    "ParameterKey": "ECSClusterStackName",
    "ParameterValue": "taska-ecs-cluster-dev"
  },
  {
    "ParameterKey": "LoadBalancerStackName",
    "ParameterValue": "taska-load-balancer-dev"
  },
  {
    "ParameterKey": "IAMStackName",
    "ParameterValue": "taska-iam-dev"
  },
  {
    "ParameterKey": "ECRStackName",
    "ParameterValue": "taska-ecr-dev"
  },
  {
    "ParameterKey": "DatabaseStackName",
    "ParameterValue": "taska-database-dev"
  },
  {
    "ParameterKey": "CacheStackName",
    "ParameterValue": "taska-cache-dev"
  },
  {
    "ParameterKey": "FrontendCPU",
    "ParameterValue": "256"
  },
  {
    "ParameterKey": "FrontendMemory",
    "ParameterValue": "512"
  },
  {
    "ParameterKey": "BackendCPU",
    "ParameterValue": "512"
  },
  {
    "ParameterKey": "BackendMemory",
    "ParameterValue": "1024"
  },
  {
    "ParameterKey": "DesiredCount",
    "ParameterValue": "1"
  }
]
```

### dev-cache.json
```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "NetworkStackName",
    "ParameterValue": "taska-network-dev"
  },
  {
    "ParameterKey": "CacheNodeType",
    "ParameterValue": "cache.t3.micro"
  },
  {
    "ParameterKey": "NumCacheNodes",
    "ParameterValue": "1"
  }
]
```

## Production Differences

For **PROD** environment, update these values:

### prod-database.json
```json
{
  "ParameterKey": "DBInstanceClass",
  "ParameterValue": "db.t3.medium"  // Larger instance
},
{
  "ParameterKey": "MultiAZ",
  "ParameterValue": "true"  // High availability
},
{
  "ParameterKey": "BackupRetentionPeriod",
  "ParameterValue": "30"  // Longer retention
}
```

### prod-cache.json
```json
{
  "ParameterKey": "CacheNodeType",
  "ParameterValue": "cache.t3.small"  // Larger instance
},
{
  "ParameterKey": "NumCacheNodes",
  "ParameterValue": "2"  // More nodes
}
```

### prod-ecs-services.json
```json
{
  "ParameterKey": "FrontendCPU",
  "ParameterValue": "512"  // More CPU
},
{
  "ParameterKey": "FrontendMemory",
  "ParameterValue": "1024"  // More memory
},
{
  "ParameterKey": "BackendCPU",
  "ParameterValue": "1024"
},
{
  "ParameterKey": "BackendMemory",
  "ParameterValue": "2048"
},
{
  "ParameterKey": "DesiredCount",
  "ParameterValue": "2"  // More instances
}
```

## Security Best Practices

⚠️ **IMPORTANT**: Never commit sensitive values to version control!

### Database Password
Store in AWS Secrets Manager and reference in parameter file:
```bash
aws secretsmanager create-secret \
  --name taska/dev/db-password \
  --secret-string "YOUR_SECURE_PASSWORD"
```

### GitHub Token
Pass via CLI instead of parameter file:
```bash
./deploy.sh --environment dev --github-token ghp_YOUR_TOKEN_HERE
```

Or use AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name taska/dev/github-token \
  --secret-string "ghp_YOUR_TOKEN"
```

## Deployment with Parameters

```bash
# Deploy with parameter file
aws cloudformation deploy \
  --template-file templates/database.yaml \
  --stack-name taska-database-dev \
  --parameter-overrides file://parameters/dev-database.json \
  --capabilities CAPABILITY_NAMED_IAM

# Or use deploy.sh which handles this automatically
./deploy.sh --environment dev
```

## Creating All Parameter Files

Run this to create all missing parameter files:

```bash
cd infrastructure/cloudformation/parameters

# Create for each environment
for env in dev uat prod; do
  # Copy and modify dev templates
  cp dev-database.json ${env}-database.json
  cp dev-codepipeline.json ${env}-codepipeline.json

  # Update environment value
  sed -i "s/\"dev\"/\"$env\"/g" ${env}-*.json
done
```

## Validation

Validate parameter files before deployment:

```bash
# Validate parameter file JSON syntax
for file in *.json; do
  echo "Validating $file"
  python3 -m json.tool $file > /dev/null && echo "✅ Valid" || echo "❌ Invalid"
done
```
