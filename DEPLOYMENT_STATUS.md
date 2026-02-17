# Taska AWS Deployment Status

**Last Updated**: 2026-02-17
**Environment**: DEV
**Region**: af-south-1 (Cape Town)
**AWS Account**: 206005672864

---

## Deployment Progress

| # | Stack Name | Status |
|---|-----------|--------|
| 1 | taska-network-dev | ✅ Deployed |
| 2 | taska-ecr-dev | ✅ Deployed |
| 3 | taska-database-dev | ✅ Deployed |
| 4 | taska-cache-dev | ✅ Deployed |
| 5 | taska-iam-dev | ✅ Deployed |
| 6 | taska-ecs-cluster-dev | ✅ Deployed |
| 7 | taska-load-balancer-dev | ✅ Deployed |
| 8 | taska-ecs-services-dev | ✅ Deployed |
| 9 | taska-codebuild-dev | ✅ Deployed |
| 10 | taska-pipeline-dev | ✅ Deployed |

---

## Application URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://taska-alb-dev-940757620.af-south-1.elb.amazonaws.com | ✅ HTTP 200 |
| Backend API | http://taska-alb-dev-940757620.af-south-1.elb.amazonaws.com/api/v1/health/live | ✅ HTTP 200 |

**Full health check**: `{"status":"ok","services":{"database":{"status":"healthy"},"redis":{"status":"healthy"}}}`

---

## Database State

- Schema: ✅ Synced via `prisma db push`
- Migrations folder: No Prisma migration files (project uses `prisma db push`)
- Seed data: Not seeded (ts-node not available in production container)

---

## Key Fixes Applied During Deployment

### Backend Image Fixes
1. Added `curl` to production stage (`apk add --no-cache dumb-init openssl curl`)
2. Fixed `health-check.sh` to use `curl -f http://localhost:${PORT:-3000}/api/v1/health/live`
3. Added `.dockerignore` to prevent Windows binaries from overwriting Linux-compiled `node_modules`
4. Added `multer`, `sharp`, `@types/multer` to package.json
5. Added `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to prisma/schema.prisma
6. Added `RUN mkdir -p logs uploads storage && chown -R nestjs:nodejs logs uploads storage`

### Frontend Image Fixes
1. Changed `npm install --omit=dev` → `npm install` in builder stage (autoprefixer needed at build time)
2. Added `HOSTNAME=0.0.0.0` via CMD override: `CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]`
   - Note: Docker sets system `HOSTNAME` to container IP, overriding Dockerfile ENV
   - The CMD-level override takes precedence over the inherited system HOSTNAME
3. Fixed Dockerfile HEALTHCHECK to match ECS health check path: `curl -f http://localhost:3000/`
4. Added `output: 'standalone'` to `next.config.js` (required for Docker deployment)

### ECS/CloudFormation Fixes
1. Fixed `NODE_ENV`: changed `!Ref Environment` → hardcoded `production`
2. Added `JWT_SECRET` and `JWT_REFRESH_SECRET` parameters
3. Added `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` parameters
4. Fixed `DATABASE_URL` to use `!Ref DBPassword` parameter instead of placeholder
5. Fixed Redis env vars from `REDIS_URL` → separate `REDIS_HOST` and `REDIS_PORT`
6. Fixed ALB health check path from `/health` → `/api/v1/health/live`
7. Fixed ECS health check path from `/api/v1/health` → `/api/v1/health/live`

---

## Key Resource References

### ECR Repository URIs
| Service | URI |
|---------|-----|
| Frontend | `206005672864.dkr.ecr.af-south-1.amazonaws.com/taska-frontend-dev` |
| Backend | `206005672864.dkr.ecr.af-south-1.amazonaws.com/taska-backend-dev` |

### Infrastructure Files
```
infrastructure/
├── deploy.sh
├── cloudformation/
│   ├── templates/
│   │   ├── network.yaml
│   │   ├── ecr.yaml
│   │   ├── database.yaml
│   │   ├── cache.yaml
│   │   ├── iam.yaml
│   │   ├── ecs-cluster.yaml
│   │   ├── load-balancer.yaml
│   │   ├── ecs-services.yaml
│   │   ├── codebuild.yaml
│   │   └── codepipeline.yaml
│   └── parameters/
│       ├── dev-network.json
│       ├── dev-database.json
│       ├── dev-cache.json
│       ├── dev-ecs-cluster.json
│       ├── dev-load-balancer.json
│       ├── dev-ecs-services.json       ← Created during deployment
│       ├── dev-codebuild.json          ← Created during deployment
│       └── dev-codepipeline.json
└── buildspec.yml
```

### Application Architecture
- **Frontend**: Next.js container → ECS Fargate → ALB (route: `/`)
- **Backend**: NestJS container → ECS Fargate → ALB (route: `/api/*`)
- **Database**: RDS PostgreSQL (private subnet, schema synced)
- **Cache**: ElastiCache Redis (private subnet, healthy)
- **CI/CD**: GitHub (`YaseenRahiman/Taska` → `main` branch) → CodePipeline → CodeBuild → ECR → ECS

---

## Important Notes

- ⚠️ **Database password** in `dev-ecs-services.json` uses `CHANGE_THIS_PASSWORD_123!` — update before UAT/PROD
- ⚠️ **JWT secrets** in `dev-ecs-services.json` are dev-only values — rotate for UAT/PROD
- ⚠️ **GitHub token** in `dev-codepipeline.json` — rotate if compromised
- ⚠️ **Stripe keys** use placeholder values — add real keys when enabling payments
- ℹ️ **CI/CD pipeline** is now set up — pushing to `main` branch will trigger automatic deployments
