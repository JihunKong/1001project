#!/bin/bash

# ============================================
# EC2 IAM Role Setup for SSM Access
# ============================================

set -e

# Configuration
ROLE_NAME="1001Stories-EC2-SSM-Role"
POLICY_NAME="1001Stories-SSM-ReadOnly"
INSTANCE_PROFILE_NAME="1001Stories-EC2-Profile"
REGION="us-east-2"
SSM_PREFIX="/1001stories/production"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   EC2 IAM Role Setup for SSM Access   ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Create trust policy for EC2
echo -e "\n${YELLOW}Creating trust policy...${NC}"
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
echo -e "${YELLOW}Creating IAM role: $ROLE_NAME${NC}"
aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document file://trust-policy.json \
    --description "Role for 1001 Stories EC2 instances to access SSM parameters" \
    2>/dev/null || echo -e "${YELLOW}Role already exists${NC}"

# Create SSM access policy
echo -e "\n${YELLOW}Creating SSM access policy...${NC}"
cat > ssm-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ReadSSMParameters",
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            "Resource": "arn:aws:ssm:${REGION}:*:parameter${SSM_PREFIX}/*"
        },
        {
            "Sid": "DecryptSSMParameters",
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt",
                "kms:DescribeKey"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "kms:ViaService": "ssm.${REGION}.amazonaws.com"
                }
            }
        },
        {
            "Sid": "ListSSMParameters",
            "Effect": "Allow",
            "Action": [
                "ssm:DescribeParameters"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Create and attach the policy
echo -e "${YELLOW}Creating and attaching policy: $POLICY_NAME${NC}"
POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file://ssm-policy.json \
    --description "Policy to read SSM parameters for 1001 Stories" \
    --query 'Policy.Arn' \
    --output text 2>/dev/null) || \
POLICY_ARN=$(aws iam list-policies \
    --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" \
    --output text)

echo -e "${GREEN}Policy ARN: $POLICY_ARN${NC}"

# Attach policy to role
echo -e "${YELLOW}Attaching policy to role...${NC}"
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN"

# Create instance profile
echo -e "\n${YELLOW}Creating instance profile: $INSTANCE_PROFILE_NAME${NC}"
aws iam create-instance-profile \
    --instance-profile-name "$INSTANCE_PROFILE_NAME" \
    2>/dev/null || echo -e "${YELLOW}Instance profile already exists${NC}"

# Add role to instance profile
echo -e "${YELLOW}Adding role to instance profile...${NC}"
aws iam add-role-to-instance-profile \
    --instance-profile-name "$INSTANCE_PROFILE_NAME" \
    --role-name "$ROLE_NAME" \
    2>/dev/null || echo -e "${YELLOW}Role already added to instance profile${NC}"

# Get EC2 instance ID (if running on EC2)
echo -e "\n${YELLOW}Checking for EC2 instance...${NC}"
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")

if [ -n "$INSTANCE_ID" ]; then
    echo -e "${GREEN}Running on EC2 instance: $INSTANCE_ID${NC}"
    
    # Associate instance profile with EC2 instance
    echo -e "${YELLOW}Associating instance profile with EC2 instance...${NC}"
    aws ec2 associate-iam-instance-profile \
        --instance-id "$INSTANCE_ID" \
        --iam-instance-profile Name="$INSTANCE_PROFILE_NAME" \
        --region "$REGION" \
        2>/dev/null || echo -e "${YELLOW}Instance profile already associated${NC}"
    
    echo -e "${GREEN}✓ IAM role attached to EC2 instance${NC}"
else
    echo -e "${YELLOW}Not running on EC2. Manual association required.${NC}"
    echo -e "${YELLOW}To attach the role to your EC2 instance:${NC}"
    echo -e "1. Go to EC2 Console"
    echo -e "2. Select your instance"
    echo -e "3. Actions > Security > Modify IAM Role"
    echo -e "4. Select: $INSTANCE_PROFILE_NAME"
fi

# Clean up temporary files
rm -f trust-policy.json ssm-policy.json

echo -e "\n${GREEN}✓ IAM role setup completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Role Name: $ROLE_NAME${NC}"
echo -e "${BLUE}Instance Profile: $INSTANCE_PROFILE_NAME${NC}"
echo -e "${BLUE}Policy: $POLICY_NAME${NC}"
echo -e "${BLUE}========================================${NC}"