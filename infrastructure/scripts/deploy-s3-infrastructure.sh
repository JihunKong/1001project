#!/bin/bash

# 1001 Stories S3 Infrastructure Deployment Script
# Comprehensive deployment for S3-based publishing system

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TERRAFORM_DIR="${PROJECT_ROOT}/infrastructure/terraform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
1001 Stories S3 Infrastructure Deployment Script

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    init        Initialize Terraform backend and modules
    plan        Create deployment plan
    apply       Apply infrastructure changes
    destroy     Destroy infrastructure
    validate    Validate Terraform configuration
    status      Show current infrastructure status
    cost        Estimate infrastructure costs
    backup      Backup current state
    rollback    Rollback to previous state

OPTIONS:
    -e, --environment ENV    Environment (production, staging, development)
    -r, --region REGION      AWS region (default: us-east-1)
    -v, --var-file FILE      Terraform variables file
    -y, --auto-approve       Auto approve changes (dangerous!)
    -h, --help              Show this help message

EXAMPLES:
    $0 init -e production
    $0 plan -e production -r us-east-1
    $0 apply -e production --auto-approve
    $0 status -e production

PREREQUISITES:
    - AWS CLI configured with appropriate permissions
    - Terraform >= 1.0 installed
    - Valid SSL certificate in ACM (us-east-1 for CloudFront)
    - Environment variables or .tfvars file configured

SAFETY CHECKS:
    - Validates AWS credentials
    - Checks for required tools
    - Confirms environment before destructive operations
    - Creates automatic backups before major changes

EOF
}

# Default values
ENVIRONMENT="production"
AWS_REGION="us-east-1"
VAR_FILE=""
AUTO_APPROVE=false
COMMAND=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        init|plan|apply|destroy|validate|status|cost|backup|rollback)
            COMMAND="$1"
            shift
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -v|--var-file)
            VAR_FILE="$2"
            shift 2
            ;;
        -y|--auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate command
if [[ -z "$COMMAND" ]]; then
    log_error "No command specified"
    show_help
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_info "Valid environments: production, staging, development"
    exit 1
fi

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform not found. Please install Terraform >= 1.0."
        exit 1
    fi

    # Check Terraform version
    local tf_version
    tf_version=$(terraform version -json | jq -r '.terraform_version')
    if [[ $(echo "$tf_version 1.0.0" | tr " " "\n" | sort -V | head -n1) != "1.0.0" ]]; then
        log_error "Terraform version $tf_version is too old. Please upgrade to >= 1.0."
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid."
        log_info "Please run 'aws configure' or set AWS environment variables."
        exit 1
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install jq for JSON processing."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Backup current state
backup_state() {
    log_info "Creating state backup..."

    local backup_dir="${TERRAFORM_DIR}/backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/terraform.tfstate.backup.${timestamp}"

    mkdir -p "$backup_dir"

    if [[ -f "${TERRAFORM_DIR}/terraform.tfstate" ]]; then
        cp "${TERRAFORM_DIR}/terraform.tfstate" "$backup_file"
        log_success "State backed up to: $backup_file"
    else
        log_warning "No state file found to backup"
    fi
}

# Set up environment variables
setup_environment() {
    log_info "Setting up environment for: $ENVIRONMENT"

    export TF_VAR_environment="$ENVIRONMENT"
    export TF_VAR_aws_region="$AWS_REGION"

    # Set workspace
    cd "$TERRAFORM_DIR"

    if terraform workspace list | grep -q "$ENVIRONMENT"; then
        terraform workspace select "$ENVIRONMENT"
    else
        terraform workspace new "$ENVIRONMENT"
    fi

    log_success "Environment configured: $ENVIRONMENT"
}

# Initialize Terraform
terraform_init() {
    log_info "Initializing Terraform..."

    cd "$TERRAFORM_DIR"

    # Initialize with backend configuration
    terraform init -upgrade

    # Validate configuration
    terraform validate

    log_success "Terraform initialized successfully"
}

# Create deployment plan
terraform_plan() {
    log_info "Creating Terraform plan..."

    cd "$TERRAFORM_DIR"

    local plan_file="plans/${ENVIRONMENT}.tfplan"
    mkdir -p "$(dirname "$plan_file")"

    local var_file_args=""
    if [[ -n "$VAR_FILE" ]]; then
        var_file_args="-var-file=$VAR_FILE"
    elif [[ -f "environments/${ENVIRONMENT}.tfvars" ]]; then
        var_file_args="-var-file=environments/${ENVIRONMENT}.tfvars"
    fi

    terraform plan \
        $var_file_args \
        -out="$plan_file" \
        -detailed-exitcode

    local plan_exit_code=$?

    case $plan_exit_code in
        0)
            log_success "No changes needed"
            ;;
        1)
            log_error "Plan failed"
            exit 1
            ;;
        2)
            log_success "Plan created with changes: $plan_file"
            ;;
    esac

    return $plan_exit_code
}

# Apply infrastructure changes
terraform_apply() {
    log_info "Applying Terraform changes..."

    cd "$TERRAFORM_DIR"

    # Create backup before applying
    backup_state

    local plan_file="plans/${ENVIRONMENT}.tfplan"

    if [[ ! -f "$plan_file" ]]; then
        log_warning "No plan file found. Creating new plan..."
        terraform_plan
    fi

    local apply_args=""
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        apply_args="-auto-approve"
        log_warning "Auto-approve enabled. Changes will be applied without confirmation!"
    else
        log_info "Review the plan above and confirm to proceed."
    fi

    if [[ -f "$plan_file" ]]; then
        terraform apply $apply_args "$plan_file"
    else
        local var_file_args=""
        if [[ -n "$VAR_FILE" ]]; then
            var_file_args="-var-file=$VAR_FILE"
        elif [[ -f "environments/${ENVIRONMENT}.tfvars" ]]; then
            var_file_args="-var-file=environments/${ENVIRONMENT}.tfvars"
        fi

        terraform apply $apply_args $var_file_args
    fi

    log_success "Infrastructure applied successfully"

    # Show outputs
    terraform output -json > "outputs/${ENVIRONMENT}.json"
    log_info "Outputs saved to: outputs/${ENVIRONMENT}.json"
}

# Destroy infrastructure
terraform_destroy() {
    log_error "DANGER: This will destroy all infrastructure!"
    log_warning "Environment: $ENVIRONMENT"
    log_warning "Region: $AWS_REGION"

    if [[ "$AUTO_APPROVE" != "true" ]]; then
        read -p "Are you absolutely sure? Type 'DELETE' to confirm: " confirmation
        if [[ "$confirmation" != "DELETE" ]]; then
            log_info "Operation cancelled"
            exit 0
        fi
    fi

    cd "$TERRAFORM_DIR"

    # Create backup before destroying
    backup_state

    local var_file_args=""
    if [[ -n "$VAR_FILE" ]]; then
        var_file_args="-var-file=$VAR_FILE"
    elif [[ -f "environments/${ENVIRONMENT}.tfvars" ]]; then
        var_file_args="-var-file=environments/${ENVIRONMENT}.tfvars"
    fi

    local destroy_args=""
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        destroy_args="-auto-approve"
    fi

    terraform destroy $destroy_args $var_file_args

    log_success "Infrastructure destroyed"
}

# Show infrastructure status
show_status() {
    log_info "Infrastructure Status - Environment: $ENVIRONMENT"

    cd "$TERRAFORM_DIR"

    # Check if state exists
    if ! terraform show &> /dev/null; then
        log_warning "No infrastructure deployed"
        return
    fi

    # Show state summary
    echo ""
    log_info "=== Resource Summary ==="
    terraform state list | wc -l | xargs printf "Total Resources: %d\n"

    echo ""
    log_info "=== Key Resources ==="
    terraform state list | grep -E "(aws_s3_bucket|aws_cloudfront_distribution|aws_iam_role)" | head -10

    echo ""
    log_info "=== Outputs ==="
    terraform output

    echo ""
    log_info "=== Workspace ==="
    terraform workspace show
}

# Estimate costs
estimate_costs() {
    log_info "Estimating infrastructure costs..."

    # Check if infracost is available
    if command -v infracost &> /dev/null; then
        cd "$TERRAFORM_DIR"

        local var_file_args=""
        if [[ -n "$VAR_FILE" ]]; then
            var_file_args="--terraform-var-file=$VAR_FILE"
        elif [[ -f "environments/${ENVIRONMENT}.tfvars" ]]; then
            var_file_args="--terraform-var-file=environments/${ENVIRONMENT}.tfvars"
        fi

        infracost breakdown \
            --path . \
            $var_file_args \
            --format table
    else
        log_warning "Infracost not installed. Install from: https://www.infracost.io/docs/"
        log_info "Manual cost estimation for $ENVIRONMENT:"
        echo "  - S3 Storage: ~\$0.023/GB/month"
        echo "  - CloudFront: ~\$0.085/GB for first 10TB"
        echo "  - Data Transfer: ~\$0.09/GB"
        echo "  - KMS: ~\$1/month per key"
        echo "  - CloudWatch: ~\$0.30/metric/month"
    fi
}

# Rollback to previous state
rollback_state() {
    log_warning "Rolling back to previous state..."

    local backup_dir="${TERRAFORM_DIR}/backups"

    if [[ ! -d "$backup_dir" ]]; then
        log_error "No backup directory found"
        exit 1
    fi

    # Find latest backup
    local latest_backup
    latest_backup=$(ls -t "$backup_dir"/terraform.tfstate.backup.* 2>/dev/null | head -n1)

    if [[ -z "$latest_backup" ]]; then
        log_error "No backup files found"
        exit 1
    fi

    log_info "Latest backup: $(basename "$latest_backup")"

    if [[ "$AUTO_APPROVE" != "true" ]]; then
        read -p "Confirm rollback? (y/N): " confirmation
        if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
            log_info "Rollback cancelled"
            exit 0
        fi
    fi

    # Create backup of current state
    backup_state

    # Restore backup
    cp "$latest_backup" "${TERRAFORM_DIR}/terraform.tfstate"

    log_success "State rolled back to: $(basename "$latest_backup")"
    log_warning "You may need to run 'terraform refresh' to sync with actual resources"
}

# Main execution
main() {
    log_info "1001 Stories S3 Infrastructure Deployment"
    log_info "Command: $COMMAND"
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $AWS_REGION"

    # Check prerequisites for all commands except help
    if [[ "$COMMAND" != "help" ]]; then
        check_prerequisites
        setup_environment
    fi

    case "$COMMAND" in
        init)
            terraform_init
            ;;
        plan)
            terraform_plan
            ;;
        apply)
            terraform_apply
            ;;
        destroy)
            terraform_destroy
            ;;
        validate)
            cd "$TERRAFORM_DIR"
            terraform validate
            log_success "Configuration is valid"
            ;;
        status)
            show_status
            ;;
        cost)
            estimate_costs
            ;;
        backup)
            backup_state
            ;;
        rollback)
            rollback_state
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac

    log_success "Operation completed: $COMMAND"
}

# Run main function
main "$@"