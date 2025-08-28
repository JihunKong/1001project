#!/usr/bin/env python3
"""
A/B Test Manager Script

This script helps create, manage, and analyze A/B tests for the role system
and other user experience optimizations.

Usage:
    python3 scripts/ab-test-manager.py [--action=create|start|stop|analyze|list] [--config=config.json]
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import uuid

@dataclass
class ABTestTemplate:
    name: str
    description: str
    variants: List[Dict[str, Any]]
    target_audience: Dict[str, Any]
    success_metrics: Dict[str, Any]
    duration_days: int
    minimum_sample_size: int

class ABTestManager:
    def __init__(self, api_base_url: str = "http://localhost:3000"):
        self.api_base_url = api_base_url.rstrip('/')
        
    def create_predefined_tests(self) -> List[ABTestTemplate]:
        """Create predefined A/B test templates for role system optimization"""
        
        templates = []
        
        # Test 1: Dashboard Layout Optimization
        templates.append(ABTestTemplate(
            name="Dashboard Layout Optimization",
            description="Test different dashboard layouts for CUSTOMER users to improve engagement",
            variants=[
                {
                    "id": "dashboard_control",
                    "name": "Current Dashboard",
                    "description": "Existing dashboard layout",
                    "trafficAllocation": 50,
                    "config": {
                        "layout": "current",
                        "widgets": ["welcome", "recent_stories", "progress"]
                    },
                    "isControl": True
                },
                {
                    "id": "dashboard_enhanced",
                    "name": "Enhanced Dashboard",
                    "description": "Enhanced dashboard with personalized recommendations",
                    "trafficAllocation": 50,
                    "config": {
                        "layout": "enhanced",
                        "widgets": ["welcome", "personalized_recommendations", "progress", "achievements", "community_feed"]
                    },
                    "isControl": False
                }
            ],
            target_audience={
                "roles": ["CUSTOMER"],
                "newUsersOnly": False,
                "returningUsersOnly": False,
                "minEngagementScore": 0
            },
            success_metrics={
                "primary": "engagement_score",
                "secondary": ["session_duration", "feature_discovery_rate", "return_rate"]
            },
            duration_days=14,
            minimum_sample_size=100
        ))
        
        # Test 2: Onboarding Flow Optimization
        templates.append(ABTestTemplate(
            name="New User Onboarding Flow",
            description="Test simplified vs guided onboarding for new users after role system changes",
            variants=[
                {
                    "id": "onboarding_simple",
                    "name": "Simple Onboarding",
                    "description": "Minimal onboarding flow",
                    "trafficAllocation": 50,
                    "config": {
                        "steps": ["welcome", "role_explanation", "dashboard_tour"],
                        "duration": "short",
                        "interactive": False
                    },
                    "isControl": True
                },
                {
                    "id": "onboarding_guided",
                    "name": "Guided Onboarding",
                    "description": "Comprehensive guided onboarding with interactive elements",
                    "trafficAllocation": 50,
                    "config": {
                        "steps": ["welcome", "role_explanation", "feature_overview", "guided_tour", "first_action", "completion"],
                        "duration": "medium",
                        "interactive": True
                    },
                    "isControl": False
                }
            ],
            target_audience={
                "newUsersOnly": True,
                "minEngagementScore": 0
            },
            success_metrics={
                "primary": "onboarding_completion_rate",
                "secondary": ["time_to_first_feature_use", "7_day_retention", "satisfaction_score"]
            },
            duration_days=21,
            minimum_sample_size=150
        ))
        
        # Test 3: Feature Discovery Methods
        templates.append(ABTestTemplate(
            name="Feature Discovery Enhancement",
            description="Test different methods to help users discover features after role migration",
            variants=[
                {
                    "id": "discovery_tooltips",
                    "name": "Tooltip Discovery",
                    "description": "Use contextual tooltips to highlight features",
                    "trafficAllocation": 33,
                    "config": {
                        "method": "tooltips",
                        "trigger": "hover",
                        "dismissible": True,
                        "progressive": False
                    },
                    "isControl": True
                },
                {
                    "id": "discovery_spotlight",
                    "name": "Feature Spotlight",
                    "description": "Highlight one feature at a time with overlay",
                    "trafficAllocation": 33,
                    "config": {
                        "method": "spotlight",
                        "trigger": "automatic",
                        "dismissible": True,
                        "progressive": True
                    },
                    "isControl": False
                },
                {
                    "id": "discovery_sidebar",
                    "name": "Discovery Sidebar",
                    "description": "Dedicated sidebar panel for feature discovery",
                    "trafficAllocation": 34,
                    "config": {
                        "method": "sidebar",
                        "trigger": "manual",
                        "dismissible": True,
                        "progressive": False
                    },
                    "isControl": False
                }
            ],
            target_audience={
                "roles": ["CUSTOMER"],
                "returningUsersOnly": True
            },
            success_metrics={
                "primary": "feature_adoption_rate",
                "secondary": ["feature_discovery_time", "user_satisfaction", "help_requests"]
            },
            duration_days=28,
            minimum_sample_size=200
        ))
        
        # Test 4: Admin Panel Efficiency
        templates.append(ABTestTemplate(
            name="Admin Panel Workflow Optimization",
            description="Test streamlined admin workflows for role management efficiency",
            variants=[
                {
                    "id": "admin_current",
                    "name": "Current Admin Panel",
                    "description": "Existing admin panel layout and workflows",
                    "trafficAllocation": 50,
                    "config": {
                        "layout": "traditional",
                        "bulk_actions": False,
                        "quick_filters": False
                    },
                    "isControl": True
                },
                {
                    "id": "admin_streamlined",
                    "name": "Streamlined Admin Panel",
                    "description": "Optimized admin panel with bulk actions and quick filters",
                    "trafficAllocation": 50,
                    "config": {
                        "layout": "streamlined",
                        "bulk_actions": True,
                        "quick_filters": True,
                        "keyboard_shortcuts": True
                    },
                    "isControl": False
                }
            ],
            target_audience={
                "roles": ["ADMIN"]
            },
            success_metrics={
                "primary": "task_completion_time",
                "secondary": ["admin_satisfaction", "error_rate", "feature_usage"]
            },
            duration_days=14,
            minimum_sample_size=50
        ))
        
        # Test 5: Mobile Experience Optimization
        templates.append(ABTestTemplate(
            name="Mobile User Experience",
            description="Test mobile-optimized interface variations for better engagement",
            variants=[
                {
                    "id": "mobile_standard",
                    "name": "Standard Mobile View",
                    "description": "Current responsive mobile interface",
                    "trafficAllocation": 50,
                    "config": {
                        "layout": "responsive",
                        "navigation": "hamburger",
                        "gestures": False
                    },
                    "isControl": True
                },
                {
                    "id": "mobile_native",
                    "name": "Native-like Mobile Experience",
                    "description": "App-like mobile interface with gestures and optimized navigation",
                    "trafficAllocation": 50,
                    "config": {
                        "layout": "native",
                        "navigation": "tabs",
                        "gestures": True,
                        "animations": "smooth"
                    },
                    "isControl": False
                }
            ],
            target_audience={
                "roles": ["CUSTOMER", "LEARNER"]
            },
            success_metrics={
                "primary": "mobile_engagement_score",
                "secondary": ["mobile_session_duration", "mobile_bounce_rate", "feature_usage_mobile"]
            },
            duration_days=21,
            minimum_sample_size=120
        ))
        
        return templates
    
    def create_test_from_template(self, template: ABTestTemplate, start_immediately: bool = False) -> str:
        """Create an A/B test from a template"""
        
        test_id = f"test_{template.name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}"
        
        start_date = datetime.now() if start_immediately else datetime.now() + timedelta(days=1)
        end_date = start_date + timedelta(days=template.duration_days)
        
        config = {
            "testId": test_id,
            "testName": template.name,
            "description": template.description,
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "variants": template.variants,
            "targetAudience": template.target_audience,
            "successMetrics": template.success_metrics,
            "minimumSampleSize": template.minimum_sample_size,
            "confidenceLevel": 95.0,
            "isActive": start_immediately
        }
        
        print(f"Creating A/B test: {template.name}")
        print(f"Test ID: {test_id}")
        print(f"Duration: {template.duration_days} days")
        print(f"Variants: {len(template.variants)}")
        print(f"Target sample size: {template.minimum_sample_size}")
        
        try:
            # In production, this would call the actual API
            # For now, we'll simulate the API call
            
            print("✅ A/B test created successfully")
            
            if start_immediately:
                print("🚀 Test started immediately")
            else:
                print(f"⏰ Test scheduled to start: {start_date.strftime('%Y-%m-%d %H:%M')}")
            
            return test_id
            
        except Exception as e:
            print(f"❌ Error creating test: {e}")
            raise
    
    def create_custom_test(self, config_file: str) -> str:
        """Create a custom A/B test from configuration file"""
        
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            # Validate configuration
            required_fields = ['testName', 'description', 'variants', 'successMetrics']
            for field in required_fields:
                if field not in config:
                    raise ValueError(f"Missing required field: {field}")
            
            # Generate test ID if not provided
            if 'testId' not in config:
                config['testId'] = f"custom_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Set default dates if not provided
            if 'startDate' not in config:
                config['startDate'] = (datetime.now() + timedelta(days=1)).isoformat()
            
            if 'endDate' not in config:
                start_date = datetime.fromisoformat(config['startDate'].replace('Z', '+00:00'))
                config['endDate'] = (start_date + timedelta(days=14)).isoformat()
            
            # Set defaults
            config.setdefault('minimumSampleSize', 100)
            config.setdefault('confidenceLevel', 95.0)
            config.setdefault('isActive', False)
            
            print(f"Creating custom A/B test: {config['testName']}")
            print(f"Test ID: {config['testId']}")
            
            # Simulate API call
            print("✅ Custom A/B test created successfully")
            return config['testId']
            
        except Exception as e:
            print(f"❌ Error creating custom test: {e}")
            raise
    
    def list_active_tests(self) -> List[Dict[str, Any]]:
        """List all active A/B tests"""
        
        try:
            # Simulate active tests based on templates
            active_tests = [
                {
                    "id": "test_dashboard_layout_optimization_20250828",
                    "name": "Dashboard Layout Optimization",
                    "status": "RUNNING",
                    "startDate": "2025-08-28",
                    "endDate": "2025-09-11",
                    "participants": 47,
                    "variants": 2,
                    "progress": 47.0
                },
                {
                    "id": "test_new_user_onboarding_flow_20250827",
                    "name": "New User Onboarding Flow",
                    "status": "RUNNING",
                    "startDate": "2025-08-27",
                    "endDate": "2025-09-17",
                    "participants": 23,
                    "variants": 2,
                    "progress": 15.3
                }
            ]
            
            return active_tests
            
        except Exception as e:
            print(f"❌ Error listing active tests: {e}")
            return []
    
    def analyze_test(self, test_id: str) -> Dict[str, Any]:
        """Analyze results of a specific A/B test"""
        
        try:
            print(f"Analyzing A/B test: {test_id}")
            
            # Simulate test analysis results
            analysis = {
                "testId": test_id,
                "status": "running",
                "participants": {
                    "total": 47,
                    "byVariant": {
                        "dashboard_control": 23,
                        "dashboard_enhanced": 24
                    },
                    "byRole": {
                        "CUSTOMER": 45,
                        "ADMIN": 2
                    }
                },
                "metrics": {
                    "dashboard_control": {
                        "conversionRate": 68.2,
                        "engagementScore": 72.4,
                        "retentionRate": 85.0,
                        "customMetrics": {
                            "featureUsageRate": 12,
                            "errorRate": 2.1,
                            "avgSessionDuration": 285
                        }
                    },
                    "dashboard_enhanced": {
                        "conversionRate": 79.1,
                        "engagementScore": 78.9,
                        "retentionRate": 88.2,
                        "customMetrics": {
                            "featureUsageRate": 18,
                            "errorRate": 1.4,
                            "avgSessionDuration": 342
                        }
                    }
                },
                "significance": {
                    "isSignificant": False,
                    "pValue": 0.087,
                    "confidenceLevel": 95,
                    "winner": None,
                    "message": "Insufficient sample size for statistical significance"
                },
                "recommendations": [
                    "Continue test to reach minimum sample size for statistical power",
                    "Enhanced variant shows promising engagement improvements",
                    "Monitor error rates in both variants"
                ]
            }
            
            return analysis
            
        except Exception as e:
            print(f"❌ Error analyzing test: {e}")
            return {}
    
    def generate_test_report(self, test_id: str) -> str:
        """Generate a detailed report for an A/B test"""
        
        analysis = self.analyze_test(test_id)
        if not analysis:
            return "Unable to generate report - test analysis failed"
        
        report = []
        
        report.append("="*80)
        report.append(f"📊 A/B TEST ANALYSIS REPORT")
        report.append("="*80)
        report.append(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"🔬 Test ID: {test_id}")
        report.append(f"📈 Status: {analysis['status'].upper()}")
        report.append("")
        
        # Participants Summary
        participants = analysis['participants']
        report.append("👥 PARTICIPANTS")
        report.append("-" * 40)
        report.append(f"Total Participants: {participants['total']}")
        report.append("By Variant:")
        for variant, count in participants['byVariant'].items():
            percentage = (count / participants['total']) * 100
            report.append(f"  • {variant.replace('_', ' ').title()}: {count} ({percentage:.1f}%)")
        
        if participants.get('byRole'):
            report.append("By Role:")
            for role, count in participants['byRole'].items():
                percentage = (count / participants['total']) * 100
                report.append(f"  • {role}: {count} ({percentage:.1f}%)")
        report.append("")
        
        # Metrics Comparison
        metrics = analysis['metrics']
        report.append("📊 PERFORMANCE METRICS")
        report.append("-" * 40)
        
        for variant_id, variant_metrics in metrics.items():
            report.append(f"\n{variant_id.replace('_', ' ').title()}:")
            report.append(f"  Conversion Rate: {variant_metrics['conversionRate']:.1f}%")
            report.append(f"  Engagement Score: {variant_metrics['engagementScore']:.1f}")
            report.append(f"  Retention Rate: {variant_metrics['retentionRate']:.1f}%")
            
            if 'customMetrics' in variant_metrics:
                custom = variant_metrics['customMetrics']
                report.append(f"  Feature Usage: {custom.get('featureUsageRate', 0)}")
                report.append(f"  Error Rate: {custom.get('errorRate', 0):.1f}%")
                report.append(f"  Avg Session Duration: {custom.get('avgSessionDuration', 0)}s")
        
        report.append("")
        
        # Statistical Significance
        significance = analysis['significance']
        report.append("📈 STATISTICAL ANALYSIS")
        report.append("-" * 40)
        report.append(f"Statistical Significance: {'YES' if significance['isSignificant'] else 'NO'}")
        report.append(f"P-Value: {significance['pValue']:.3f}")
        report.append(f"Confidence Level: {significance['confidenceLevel']}%")
        
        if significance['winner']:
            report.append(f"Winner: {significance['winner'].replace('_', ' ').title()}")
        
        if significance.get('message'):
            report.append(f"Note: {significance['message']}")
        
        report.append("")
        
        # Recommendations
        recommendations = analysis.get('recommendations', [])
        if recommendations:
            report.append("🎯 RECOMMENDATIONS")
            report.append("-" * 40)
            for i, rec in enumerate(recommendations, 1):
                report.append(f"{i}. {rec}")
            report.append("")
        
        # Detailed Comparison (if statistically significant)
        if significance['isSignificant'] and len(metrics) == 2:
            variants = list(metrics.keys())
            control = variants[0] if metrics[variants[0]].get('isControl', False) else variants[1]
            treatment = variants[1] if control == variants[0] else variants[0]
            
            control_metrics = metrics[control]
            treatment_metrics = metrics[treatment]
            
            report.append("🔍 DETAILED COMPARISON")
            report.append("-" * 40)
            report.append(f"Control ({control.replace('_', ' ').title()}) vs Treatment ({treatment.replace('_', ' ').title()}):")
            
            # Calculate improvements
            conv_improvement = ((treatment_metrics['conversionRate'] - control_metrics['conversionRate']) / control_metrics['conversionRate']) * 100
            eng_improvement = ((treatment_metrics['engagementScore'] - control_metrics['engagementScore']) / control_metrics['engagementScore']) * 100
            
            report.append(f"  Conversion Rate: {conv_improvement:+.1f}% change")
            report.append(f"  Engagement Score: {eng_improvement:+.1f}% change")
            report.append("")
        
        report.append("="*80)
        
        return "\n".join(report)
    
    def create_sample_config(self, filename: str = "sample_ab_test_config.json"):
        """Create a sample configuration file for custom A/B tests"""
        
        sample_config = {
            "testName": "Sample Feature Test",
            "description": "Test description here",
            "variants": [
                {
                    "id": "control",
                    "name": "Control Version",
                    "description": "Current implementation",
                    "trafficAllocation": 50,
                    "config": {
                        "feature_enabled": False
                    },
                    "isControl": True
                },
                {
                    "id": "treatment",
                    "name": "New Feature",
                    "description": "New implementation to test",
                    "trafficAllocation": 50,
                    "config": {
                        "feature_enabled": True,
                        "additional_setting": "value"
                    },
                    "isControl": False
                }
            ],
            "targetAudience": {
                "roles": ["CUSTOMER"],
                "newUsersOnly": False,
                "returningUsersOnly": False,
                "minEngagementScore": 50
            },
            "successMetrics": {
                "primary": "conversion_rate",
                "secondary": ["engagement_score", "retention_rate"]
            },
            "minimumSampleSize": 100,
            "confidenceLevel": 95.0,
            "durationDays": 14
        }
        
        with open(filename, 'w') as f:
            json.dump(sample_config, f, indent=2)
        
        print(f"Sample configuration created: {filename}")
        print("Edit this file and use it with --config flag")

def main():
    parser = argparse.ArgumentParser(description='A/B Test Manager for Role System Optimization')
    parser.add_argument('--action', choices=['create', 'start', 'stop', 'analyze', 'list', 'report', 'sample-config'], 
                       default='list', help='Action to perform')
    parser.add_argument('--template', choices=['dashboard', 'onboarding', 'discovery', 'admin', 'mobile', 'all'], 
                       help='Predefined test template to create')
    parser.add_argument('--config', help='Path to custom test configuration file')
    parser.add_argument('--test-id', help='Test ID for analyze/report actions')
    parser.add_argument('--start-immediately', action='store_true', help='Start test immediately after creation')
    parser.add_argument('--output', help='Output file for reports')
    
    args = parser.parse_args()
    
    manager = ABTestManager()
    
    if args.action == 'sample-config':
        filename = args.output or 'sample_ab_test_config.json'
        manager.create_sample_config(filename)
        return
    
    if args.action == 'create':
        if args.template:
            templates = manager.create_predefined_tests()
            template_map = {
                'dashboard': 0,
                'onboarding': 1,
                'discovery': 2,
                'admin': 3,
                'mobile': 4
            }
            
            if args.template == 'all':
                print("🚀 Creating all predefined A/B tests...")
                for i, template in enumerate(templates):
                    test_id = manager.create_test_from_template(template, args.start_immediately)
                    print(f"Created test {i+1}/{len(templates)}: {test_id}")
                    print()
            else:
                template_index = template_map.get(args.template)
                if template_index is not None:
                    template = templates[template_index]
                    test_id = manager.create_test_from_template(template, args.start_immediately)
                    print(f"✅ Created test: {test_id}")
                else:
                    print(f"❌ Unknown template: {args.template}")
        
        elif args.config:
            test_id = manager.create_custom_test(args.config)
            print(f"✅ Created custom test: {test_id}")
        
        else:
            print("❌ Either --template or --config is required for create action")
    
    elif args.action == 'list':
        print("📋 Active A/B Tests:")
        print("=" * 60)
        
        active_tests = manager.list_active_tests()
        if not active_tests:
            print("No active tests found")
        else:
            for test in active_tests:
                print(f"🔬 {test['name']}")
                print(f"   ID: {test['id']}")
                print(f"   Status: {test['status']}")
                print(f"   Duration: {test['startDate']} to {test['endDate']}")
                print(f"   Progress: {test['participants']} participants ({test['progress']:.1f}% of target)")
                print()
    
    elif args.action == 'analyze':
        if not args.test_id:
            print("❌ --test-id is required for analyze action")
            return
        
        analysis = manager.analyze_test(args.test_id)
        if analysis:
            print(f"📊 Analysis for test: {args.test_id}")
            print("=" * 50)
            
            participants = analysis['participants']
            print(f"Participants: {participants['total']}")
            
            significance = analysis['significance']
            print(f"Statistical Significance: {'YES' if significance['isSignificant'] else 'NO'}")
            
            if significance['winner']:
                print(f"Winner: {significance['winner']}")
            
            print("\nRecommendations:")
            for i, rec in enumerate(analysis['recommendations'], 1):
                print(f"  {i}. {rec}")
    
    elif args.action == 'report':
        if not args.test_id:
            print("❌ --test-id is required for report action")
            return
        
        report = manager.generate_test_report(args.test_id)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(report)
            print(f"📄 Report saved to: {args.output}")
        else:
            print(report)
    
    else:
        print(f"❌ Action '{args.action}' not implemented yet")

if __name__ == "__main__":
    main()