# RDS Module Outputs

output "cluster_id" {
  description = "RDS cluster identifier"
  value       = aws_rds_cluster.main.id
}

output "cluster_identifier" {
  description = "RDS cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "cluster_arn" {
  description = "RDS cluster ARN"
  value       = aws_rds_cluster.main.arn
}

output "cluster_endpoint" {
  description = "RDS cluster writer endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "RDS cluster port"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "master_username" {
  description = "RDS cluster master username"
  value       = aws_rds_cluster.main.master_username
  sensitive   = true
}

output "connection_string" {
  description = "Database connection string for application"
  value       = "postgresql://${aws_rds_cluster.main.master_username}:${var.master_password}@${aws_rds_cluster.main.endpoint}:${aws_rds_cluster.main.port}/${aws_rds_cluster.main.database_name}"
  sensitive   = true
}

output "proxy_endpoint" {
  description = "RDS Proxy endpoint for connection pooling"
  value       = aws_db_proxy.main.endpoint
}

output "proxy_connection_string" {
  description = "Database connection string via RDS Proxy"
  value       = "postgresql://${aws_rds_cluster.main.master_username}:${var.master_password}@${aws_db_proxy.main.endpoint}:${aws_rds_cluster.main.port}/${aws_rds_cluster.main.database_name}"
  sensitive   = true
}

output "replica_endpoints" {
  description = "List of read replica endpoints"
  value = [
    aws_rds_cluster_instance.replica_1.endpoint,
    aws_rds_cluster_instance.replica_2.endpoint,
  ]
}

output "replica_connection_strings" {
  description = "Connection strings for read replicas"
  value = {
    dashboard_queries = "postgresql://${aws_rds_cluster.main.master_username}:${var.master_password}@${aws_rds_cluster_instance.replica_1.endpoint}:${aws_rds_cluster.main.port}/${aws_rds_cluster.main.database_name}"
    analytics_reporting = "postgresql://${aws_rds_cluster.main.master_username}:${var.master_password}@${aws_rds_cluster_instance.replica_2.endpoint}:${aws_rds_cluster.main.port}/${aws_rds_cluster.main.database_name}"
  }
  sensitive = true
}

output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "kms_key_id" {
  description = "KMS key ID used for RDS encryption"
  value       = aws_kms_key.rds.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN used for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "cluster_parameter_group_name" {
  description = "Name of the cluster parameter group"
  value       = aws_rds_cluster_parameter_group.main.name
}

output "instance_parameter_group_name" {
  description = "Name of the instance parameter group"
  value       = aws_db_parameter_group.main.name
}

output "primary_instance_id" {
  description = "Identifier of the primary instance"
  value       = aws_rds_cluster_instance.primary.id
}

output "replica_instance_ids" {
  description = "Identifiers of read replica instances"
  value = [
    aws_rds_cluster_instance.replica_1.id,
    aws_rds_cluster_instance.replica_2.id,
  ]
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for PostgreSQL logs"
  value       = aws_cloudwatch_log_group.postgresql.name
}

output "enhanced_monitoring_role_arn" {
  description = "ARN of the IAM role for enhanced monitoring"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}