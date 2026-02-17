#!/bin/bash

# Taska Platform - AWS Deployment Script
# Deploys CloudFormation stacks to AWS Africa (Cape Town) region

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
REGION="af-south-1"
ENVIRONMENT="dev"
COMPONENT="all"
ACTION="deploy"
GITHUB_TOKEN=""

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Taska platform infrastructure to AWS

OPTIONS:
    -e, --environment ENV     Environment to deploy (dev|uat|prod) [default: dev]
    -c, --component COMP      Component to deploy (all|network|database|cache|ecr|ecs|pipeline) [default: all]
    -r, --region REGION       AWS region [default: af-south-1]
    -t, --github-token TOKEN  GitHub personal access token
    -d, --delete              Delete stack instead of deploying
    -h, --help                Show this help message

EXAMPLES:
    # Deploy all components to dev
    $0 --environment dev --github-token ghp_xxx

    # Deploy only network to UAT
    $0 --environment uat --component network

    # Delete prod stack
    $0 --environment prod --delete

EOF
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--component)
            COMPONENT="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -t|--github-token)
            GITHUB_TOKEN="$2"
            shift 2
            ;;
        -d|--delete)
            ACTION="delete"
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|uat|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    usage
fi

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ -z "$ACCOUNT_ID" ]; then
    print_error "Failed to get AWS account ID. Please configure AWS CLI."
    exit 1
fi

print_info "AWS Account ID: $ACCOUNT_ID"
print_info "Region: $REGION"
print_info "Environment: $ENVIRONMENT"
print_info "Component: $COMPONENT"
print_info "Action: $ACTION"

# Stack names
STACK_PREFIX="taska"
NETWORK_STACK="${STACK_PREFIX}-network-${ENVIRONMENT}"
ECR_STACK="${STACK_PREFIX}-ecr-${ENVIRONMENT}"
DATABASE_STACK="${STACK_PREFIX}-database-${ENVIRONMENT}"
CACHE_STACK="${STACK_PREFIX}-cache-${ENVIRONMENT}"
IAM_STACK="${STACK_PREFIX}-iam-${ENVIRONMENT}"
ECS_CLUSTER_STACK="${STACK_PREFIX}-ecs-cluster-${ENVIRONMENT}"
LOAD_BALANCER_STACK="${STACK_PREFIX}-load-balancer-${ENVIRONMENT}"
ECS_SERVICES_STACK="${STACK_PREFIX}-ecs-services-${ENVIRONMENT}"
CODEBUILD_STACK="${STACK_PREFIX}-codebuild-${ENVIRONMENT}"
PIPELINE_STACK="${STACK_PREFIX}-pipeline-${ENVIRONMENT}"

# Function to deploy stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local parameters_file=$3

    print_info "Deploying stack: $stack_name"

    local params=""
    if [ -f "$parameters_file" ]; then
        params="--parameter-overrides file://$parameters_file"
    fi

    aws cloudformation deploy \
        --template-file "$template_file" \
        --stack-name "$stack_name" \
        --region "$REGION" \
        $params \
        --capabilities CAPABILITY_NAMED_IAM \
        --tags Environment=$ENVIRONMENT Project=Taska \
        || {
            print_error "Failed to deploy $stack_name"
            return 1
        }

    print_info "✅ Successfully deployed $stack_name"
}

# Function to delete stack
delete_stack() {
    local stack_name=$1

    print_warn "Deleting stack: $stack_name"

    aws cloudformation delete-stack \
        --stack-name "$stack_name" \
        --region "$REGION"

    print_info "Stack deletion initiated: $stack_name"
}

# Function to wait for stack
wait_for_stack() {
    local stack_name=$1
    local operation=$2

    print_info "Waiting for stack $operation: $stack_name"

    aws cloudformation wait "stack-${operation}-complete" \
        --stack-name "$stack_name" \
        --region "$REGION" \
        || {
            print_error "Stack $operation failed: $stack_name"
            return 1
        }

    print_info "✅ Stack $operation completed: $stack_name"
}

# Deployment order
if [ "$ACTION" == "deploy" ]; then
    # Check GitHub token for pipeline deployment
    if [ "$COMPONENT" == "all" ] || [ "$COMPONENT" == "pipeline" ]; then
        if [ -z "$GITHUB_TOKEN" ]; then
            print_error "GitHub token is required for pipeline deployment"
            print_info "Get token from: https://github.com/settings/tokens"
            exit 1
        fi
    fi

    print_info "🚀 Starting deployment..."

    # Deploy in dependency order
    if [ "$COMPONENT" == "all" ] || [ "$COMPONENT" == "network" ]; then
        deploy_stack "$NETWORK_STACK" \
            "cloudformation/templates/network.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-network.json"
    fi

    if [ "$COMPONENT" == "all" ] || [ "$COMPONENT" == "ecr" ]; then
        deploy_stack "$ECR_STACK" \
            "cloudformation/templates/ecr.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-ecr.json"
    fi

    if [ "$COMPONENT" == "all" ] || [ "$COMPONENT" == "database" ]; then
        deploy_stack "$DATABASE_STACK" \
            "cloudformation/templates/database.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-database.json"
    fi

    if [ "$COMPONENT" == "all" ] || [ "$COMPONENT" == "cache" ]; then
        deploy_stack "$CACHE_STACK" \
            "cloudformation/templates/cache.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-cache.json"
    fi

    if [ "$COMPONENT" == "all" ] || [ "$COMPONENT" == "iam" ]; then
        deploy_stack "$IAM_STACK" \
            "cloudformation/templates/iam.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-iam.json"
    fi

    if [ "$COMPONENT" == "all" ] || [ "$COMPONENT" == "ecs" ]; then
        deploy_stack "$ECS_CLUSTER_STACK" \
            "cloudformation/templates/ecs-cluster.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-ecs-cluster.json"

        deploy_stack "$LOAD_BALANCER_STACK" \
            "cloudformation/templates/load-balancer.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-load-balancer.json"

        deploy_stack "$ECS_SERVICES_STACK" \
            "cloudformation/templates/ecs-services.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-ecs-services.json"
    fi

    if [ "$COMPONENT" == "all" ] || [ "$COMPONENT" == "pipeline" ]; then
        deploy_stack "$CODEBUILD_STACK" \
            "cloudformation/templates/codebuild.yaml" \
            "cloudformation/parameters/${ENVIRONMENT}-codebuild.json"

        # Deploy pipeline with GitHub token as parameter override
        aws cloudformation deploy \
            --template-file "cloudformation/templates/codepipeline.yaml" \
            --stack-name "$PIPELINE_STACK" \
            --region "$REGION" \
            --parameter-overrides GitHubToken="$GITHUB_TOKEN" \
            --parameters file://cloudformation/parameters/${ENVIRONMENT}-codepipeline.json \
            --capabilities CAPABILITY_NAMED_IAM \
            --tags Environment=$ENVIRONMENT Project=Taska
    fi

    print_info "🎉 Deployment completed successfully!"
    print_info ""
    print_info "Next steps:"
    print_info "1. Get Load Balancer DNS:"
    print_info "   aws cloudformation describe-stacks --stack-name $LOAD_BALANCER_STACK --query 'Stacks[0].Outputs'"
    print_info ""
    print_info "2. Get RDS endpoint:"
    print_info "   aws cloudformation describe-stacks --stack-name $DATABASE_STACK --query 'Stacks[0].Outputs'"
    print_info ""
    print_info "3. Push initial Docker images to ECR or trigger pipeline by pushing to GitHub"

elif [ "$ACTION" == "delete" ]; then
    print_warn "⚠️  Deleting infrastructure..."
    read -p "Are you sure you want to delete $ENVIRONMENT environment? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Deletion cancelled"
        exit 0
    fi

    # Delete in reverse dependency order
    delete_stack "$PIPELINE_STACK"
    wait_for_stack "$PIPELINE_STACK" "delete"

    delete_stack "$CODEBUILD_STACK"
    wait_for_stack "$CODEBUILD_STACK" "delete"

    delete_stack "$ECS_SERVICES_STACK"
    wait_for_stack "$ECS_SERVICES_STACK" "delete"

    delete_stack "$LOAD_BALANCER_STACK"
    wait_for_stack "$LOAD_BALANCER_STACK" "delete"

    delete_stack "$ECS_CLUSTER_STACK"
    wait_for_stack "$ECS_CLUSTER_STACK" "delete"

    delete_stack "$IAM_STACK"
    wait_for_stack "$IAM_STACK" "delete"

    delete_stack "$CACHE_STACK"
    wait_for_stack "$CACHE_STACK" "delete"

    delete_stack "$DATABASE_STACK"
    wait_for_stack "$DATABASE_STACK" "delete"

    delete_stack "$ECR_STACK"
    wait_for_stack "$ECR_STACK" "delete"

    delete_stack "$NETWORK_STACK"
    wait_for_stack "$NETWORK_STACK" "delete"

    print_info "✅ All stacks deleted successfully"
fi
