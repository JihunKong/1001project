import json
import boto3
import os
from datetime import datetime, timedelta
from decimal import Decimal

def handler(event, context):
    """
    AWS Lambda function for cost optimization recommendations
    Analyzes usage patterns and sends recommendations via SNS
    """

    ce_client = boto3.client('ce')  # Cost Explorer
    sns_client = boto3.client('sns')

    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    environment = os.environ['ENVIRONMENT']
    cost_threshold = float(os.environ['COST_THRESHOLD'])

    try:
        # Get cost and usage for the last 30 days
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        # Get current month's costs
        cost_response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'SERVICE'
                }
            ]
        )

        recommendations = []
        total_cost = 0

        # Analyze costs by service
        for result in cost_response['ResultsByTime']:
            for group in result['Groups']:
                service = group['Keys'][0]
                cost = float(group['Metrics']['BlendedCost']['Amount'])
                total_cost += cost

                if cost > cost_threshold:
                    # Generate service-specific recommendations
                    if 'Amazon Elastic Compute Cloud' in service:
                        rec = analyze_ec2_costs(ce_client, start_date, end_date)
                        if rec:
                            recommendations.append(rec)

                    elif 'Amazon Relational Database Service' in service:
                        rec = analyze_rds_costs(ce_client, start_date, end_date)
                        if rec:
                            recommendations.append(rec)

                    elif 'Amazon Simple Storage Service' in service:
                        rec = analyze_s3_costs(ce_client, start_date, end_date)
                        if rec:
                            recommendations.append(rec)

        # Get Reserved Instance recommendations
        ri_recommendations = get_ri_recommendations(ce_client)
        recommendations.extend(ri_recommendations)

        # Get Right-sizing recommendations
        rightsizing_recommendations = get_rightsizing_recommendations(ce_client)
        recommendations.extend(rightsizing_recommendations)

        # Send recommendations if any found
        if recommendations or total_cost > (cost_threshold * 5):
            message = format_recommendations_message(recommendations, total_cost, environment)

            sns_response = sns_client.publish(
                TopicArn=sns_topic_arn,
                Message=message,
                Subject=f'Cost Optimization Report - {environment}'
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Cost optimization report sent. Total cost: ${total_cost:.2f}',
                    'recommendations_count': len(recommendations),
                    'sns_message_id': sns_response['MessageId']
                })
            }

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'No significant cost optimization opportunities found. Total cost: ${total_cost:.2f}',
                'recommendations_count': 0
            })
        }

    except Exception as e:
        error_message = f'Error in cost optimization analysis: {str(e)}'

        # Send error notification
        sns_client.publish(
            TopicArn=sns_topic_arn,
            Message=error_message,
            Subject=f'Cost Optimization Error - {environment}'
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_message})
        }

def analyze_ec2_costs(ce_client, start_date, end_date):
    """Analyze EC2 costs and provide recommendations"""
    try:
        ec2_response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost', 'UsageQuantity'],
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'INSTANCE_TYPE'
                }
            ],
            Filter={
                'Dimensions': {
                    'Key': 'SERVICE',
                    'Values': ['Amazon Elastic Compute Cloud - Compute']
                }
            }
        )

        high_cost_instances = []
        for result in ec2_response['ResultsByTime']:
            for group in result['Groups']:
                instance_type = group['Keys'][0]
                cost = float(group['Metrics']['BlendedCost']['Amount'])
                usage = float(group['Metrics']['UsageQuantity']['Amount'])

                if cost > 50:  # Instances costing more than $50/month
                    high_cost_instances.append({
                        'instance_type': instance_type,
                        'cost': cost,
                        'usage_hours': usage
                    })

        if high_cost_instances:
            return {
                'service': 'EC2',
                'recommendation': 'Consider Reserved Instances or Savings Plans for consistently running instances',
                'details': high_cost_instances[:5],  # Top 5 instances
                'potential_savings': sum([inst['cost'] * 0.3 for inst in high_cost_instances])  # Estimated 30% savings
            }
    except Exception as e:
        print(f"Error analyzing EC2 costs: {e}")

    return None

def analyze_rds_costs(ce_client, start_date, end_date):
    """Analyze RDS costs and provide recommendations"""
    try:
        rds_response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'DATABASE_ENGINE'
                }
            ],
            Filter={
                'Dimensions': {
                    'Key': 'SERVICE',
                    'Values': ['Amazon Relational Database Service']
                }
            }
        )

        total_rds_cost = 0
        for result in rds_response['ResultsByTime']:
            for group in result['Groups']:
                cost = float(group['Metrics']['BlendedCost']['Amount'])
                total_rds_cost += cost

        if total_rds_cost > 200:  # More than $200/month on RDS
            return {
                'service': 'RDS',
                'recommendation': 'Consider Reserved Instances for RDS instances running continuously',
                'current_cost': total_rds_cost,
                'potential_savings': total_rds_cost * 0.4  # Estimated 40% savings with RI
            }
    except Exception as e:
        print(f"Error analyzing RDS costs: {e}")

    return None

def analyze_s3_costs(ce_client, start_date, end_date):
    """Analyze S3 costs and provide recommendations"""
    try:
        s3_response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'USAGE_TYPE'
                }
            ],
            Filter={
                'Dimensions': {
                    'Key': 'SERVICE',
                    'Values': ['Amazon Simple Storage Service']
                }
            }
        )

        storage_costs = []
        for result in s3_response['ResultsByTime']:
            for group in result['Groups']:
                usage_type = group['Keys'][0]
                cost = float(group['Metrics']['BlendedCost']['Amount'])

                if 'Storage' in usage_type and cost > 10:
                    storage_costs.append({
                        'usage_type': usage_type,
                        'cost': cost
                    })

        if storage_costs:
            total_storage_cost = sum([item['cost'] for item in storage_costs])
            return {
                'service': 'S3',
                'recommendation': 'Implement Intelligent Tiering and lifecycle policies for infrequently accessed data',
                'current_cost': total_storage_cost,
                'potential_savings': total_storage_cost * 0.2  # Estimated 20% savings
            }
    except Exception as e:
        print(f"Error analyzing S3 costs: {e}")

    return None

def get_ri_recommendations(ce_client):
    """Get Reserved Instance purchase recommendations"""
    try:
        ri_response = ce_client.get_reservation_purchase_recommendation(
            Service='Amazon Elastic Compute Cloud - Compute'
        )

        recommendations = []
        for rec in ri_response.get('Recommendations', []):
            if float(rec['EstimatedMonthlySavingsAmount']) > 50:  # Savings > $50/month
                recommendations.append({
                    'service': 'EC2 Reserved Instances',
                    'recommendation': f"Purchase {rec['InstanceDetails']['EC2InstanceDetails']['InstanceType']} Reserved Instances",
                    'monthly_savings': float(rec['EstimatedMonthlySavingsAmount']),
                    'payback_months': float(rec['EstimatedBreakEvenInMonths'])
                })

        return recommendations[:3]  # Top 3 recommendations
    except Exception as e:
        print(f"Error getting RI recommendations: {e}")
        return []

def get_rightsizing_recommendations(ce_client):
    """Get EC2 instance rightsizing recommendations"""
    try:
        rightsizing_response = ce_client.get_rightsizing_recommendation(
            Service='AmazonEC2'
        )

        recommendations = []
        for rec in rightsizing_response.get('RightsizingRecommendations', []):
            if rec['RightsizingType'] == 'Terminate':
                recommendations.append({
                    'service': 'EC2 Rightsizing',
                    'recommendation': 'Terminate underutilized instances',
                    'estimated_savings': float(rec['EstimatedMonthlySavings'])
                })
            elif rec['RightsizingType'] == 'Modify':
                recommendations.append({
                    'service': 'EC2 Rightsizing',
                    'recommendation': f"Downsize instance to {rec['ModifyRecommendationDetail']['TargetInstances'][0]['InstanceType']}",
                    'estimated_savings': float(rec['EstimatedMonthlySavings'])
                })

        return recommendations[:3]  # Top 3 recommendations
    except Exception as e:
        print(f"Error getting rightsizing recommendations: {e}")
        return []

def format_recommendations_message(recommendations, total_cost, environment):
    """Format the recommendations into a readable message"""
    message = f"""
1001 Stories Cost Optimization Report
Environment: {environment}
Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

=== MONTHLY COST SUMMARY ===
Total Monthly Cost: ${total_cost:.2f}
Annual Projection: ${total_cost * 12:.2f}

=== OPTIMIZATION RECOMMENDATIONS ===
"""

    if not recommendations:
        message += "\n✅ No significant cost optimization opportunities found at this time.\n"
        message += "Current spending appears to be within expected ranges.\n"
    else:
        total_potential_savings = 0

        for i, rec in enumerate(recommendations, 1):
            message += f"\n{i}. {rec['service']}\n"
            message += f"   Recommendation: {rec['recommendation']}\n"

            if 'potential_savings' in rec:
                message += f"   Potential Monthly Savings: ${rec['potential_savings']:.2f}\n"
                total_potential_savings += rec['potential_savings']
            elif 'monthly_savings' in rec:
                message += f"   Potential Monthly Savings: ${rec['monthly_savings']:.2f}\n"
                total_potential_savings += rec['monthly_savings']
            elif 'estimated_savings' in rec:
                message += f"   Potential Monthly Savings: ${rec['estimated_savings']:.2f}\n"
                total_potential_savings += rec['estimated_savings']

            if 'current_cost' in rec:
                message += f"   Current Monthly Cost: ${rec['current_cost']:.2f}\n"

            if 'payback_months' in rec:
                message += f"   Payback Period: {rec['payback_months']:.1f} months\n"

        message += f"\n=== TOTAL POTENTIAL SAVINGS ===\n"
        message += f"Monthly: ${total_potential_savings:.2f}\n"
        message += f"Annual: ${total_potential_savings * 12:.2f}\n"

        savings_percentage = (total_potential_savings / total_cost) * 100 if total_cost > 0 else 0
        message += f"Savings Percentage: {savings_percentage:.1f}%\n"

    message += f"\n=== NEXT STEPS ===\n"
    message += "1. Review recommendations in AWS Cost Explorer\n"
    message += "2. Implement Reserved Instances for consistent workloads\n"
    message += "3. Set up automatic S3 lifecycle policies\n"
    message += "4. Monitor usage patterns for rightsizing opportunities\n"
    message += "5. Consider Savings Plans for flexible compute savings\n"

    message += f"\n=== BUDGET TRACKING ===\n"

    # Assuming budget targets based on the requirements
    if environment == 'production':
        monthly_budget_target = 18000  # $216K annual / 12 months
        if total_cost > monthly_budget_target * 0.8:
            message += f"⚠️  WARNING: Approaching budget limit\n"
            message += f"Current: ${total_cost:.2f} | Target: ${monthly_budget_target:.2f}\n"
        else:
            message += f"✅ Within budget target\n"
            message += f"Current: ${total_cost:.2f} | Target: ${monthly_budget_target:.2f}\n"

    message += "\nFor detailed analysis, visit: https://console.aws.amazon.com/cost-management/home\n"

    return message