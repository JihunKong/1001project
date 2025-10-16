#!/bin/bash

# User data script for Spot instances
# Configures instances to join ECS cluster and handle spot interruption gracefully

# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install ECS agent
echo ECS_CLUSTER=${cluster_name} >> /etc/ecs/ecs.config
echo ECS_INSTANCE_ATTRIBUTES='{"spot":"true"}' >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config

# Configure spot instance interruption handling
cat > /opt/spot-interruption-handler.sh << 'EOF'
#!/bin/bash
# Monitor for spot interruption notice
while true; do
    TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
    INTERRUPTION_NOTICE=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/spot/instance-action)

    if [ $? -eq 0 ]; then
        echo "$(date): Spot interruption notice received. Gracefully draining tasks..."

        # Drain ECS tasks
        INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id)
        AWS_DEFAULT_REGION=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/placement/region)

        # Set container instance to DRAINING
        aws ecs put-attributes \
            --cluster ${cluster_name} \
            --attributes name=ecs.capability.spot,value=draining,targetType=container-instance,targetId=$INSTANCE_ID \
            --region $AWS_DEFAULT_REGION

        # Wait for tasks to drain (max 2 minutes)
        sleep 120

        break
    fi

    sleep 5
done
EOF

chmod +x /opt/spot-interruption-handler.sh

# Start spot interruption handler in background
/opt/spot-interruption-handler.sh &

# Configure CloudWatch monitoring
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "1001Stories/SpotInstances",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60,
                "totalcpu": false
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/ecs/ecs-agent.log*",
                        "log_group_name": "/aws/ecs/spot-instances",
                        "log_stream_name": "{instance_id}/ecs-agent",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ecs/spot-instances",
                        "log_stream_name": "{instance_id}/messages",
                        "timezone": "UTC"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Start ECS agent
systemctl enable ecs
systemctl start ecs

# Signal successful completion
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id)
AWS_DEFAULT_REGION=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/placement/region)

aws ec2 create-tags \
    --region $AWS_DEFAULT_REGION \
    --resources $INSTANCE_ID \
    --tags Key=SpotInstanceStatus,Value=Ready