#!/bin/bash

# ============================================
# AWS Systems Manager Parameter Store Migration Script
# ============================================

set -e

# Configuration
ENV_FILE=".env.production"
SSM_PREFIX="/1001stories/production"
REGION="us-east-2"  # Ohio region where your EC2 instance is

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AWS SSM Parameter Store Migration   ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    echo "Install with: brew install awscli (on macOS) or apt-get install awscli (on Ubuntu)"
    exit 1
fi

# Check AWS credentials
echo -e "\n${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS credentials configured${NC}"

# Function to upload parameter to SSM
upload_parameter() {
    local key=$1
    local value=$2
    local param_name="${SSM_PREFIX}/${key}"
    
    # Skip empty values
    if [ -z "$value" ]; then
        echo -e "${YELLOW}  ⚠ Skipping $key (empty value)${NC}"
        return
    fi
    
    # Check if parameter already exists
    if aws ssm get-parameter --name "$param_name" --region "$REGION" &> /dev/null; then
        echo -e "${YELLOW}  ⚠ Parameter $param_name already exists. Updating...${NC}"
        aws ssm put-parameter \
            --name "$param_name" \
            --value "$value" \
            --type "SecureString" \
            --overwrite \
            --region "$REGION" \
            --description "1001 Stories Production Environment Variable" \
            &> /dev/null
    else
        echo -e "${GREEN}  ✓ Creating parameter $param_name${NC}"
        aws ssm put-parameter \
            --name "$param_name" \
            --value "$value" \
            --type "SecureString" \
            --region "$REGION" \
            --description "1001 Stories Production Environment Variable" \
            &> /dev/null
    fi
}

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: Environment file $ENV_FILE not found${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Reading environment variables from $ENV_FILE...${NC}"

# Read environment file and upload to SSM
declare -A env_vars
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^#.*$ ]] || [ -z "$key" ]; then
        continue
    fi
    
    # Remove quotes from value
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    
    env_vars["$key"]="$value"
done < "$ENV_FILE"

echo -e "\n${YELLOW}Uploading ${#env_vars[@]} parameters to AWS SSM...${NC}"

# Upload each parameter
for key in "${!env_vars[@]}"; do
    upload_parameter "$key" "${env_vars[$key]}"
done

echo -e "\n${GREEN}✓ Migration completed successfully!${NC}"

# Generate IAM policy for EC2 instance
echo -e "\n${YELLOW}Generating IAM policy for EC2 instance...${NC}"

cat > ssm-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            "Resource": "arn:aws:ssm:${REGION}:*:parameter${SSM_PREFIX}/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "kms:ViaService": "ssm.${REGION}.amazonaws.com"
                }
            }
        }
    ]
}
EOF

echo -e "${GREEN}✓ IAM policy saved to ssm-policy.json${NC}"
echo -e "${YELLOW}Attach this policy to your EC2 instance's IAM role${NC}"

# List all parameters
echo -e "\n${YELLOW}Verifying parameters in SSM:${NC}"
aws ssm get-parameters-by-path \
    --path "$SSM_PREFIX" \
    --region "$REGION" \
    --query "Parameters[*].Name" \
    --output table

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Attach the IAM policy to your EC2 instance role"
echo -e "2. Install AWS SDK in your application: npm install @aws-sdk/client-ssm"
echo -e "3. Update your application to use the SSM utility"
echo -e "4. Test the integration before removing .env files"
echo -e "${BLUE}========================================${NC}"