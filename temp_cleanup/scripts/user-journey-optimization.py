#!/usr/bin/env python3
"""
User Journey Optimization Analysis Script

This script analyzes user journeys to identify optimization opportunities
in the role system implementation. It focuses on user flow patterns,
conversion points, and experience friction.

Usage:
    python3 scripts/user-journey-optimization.py [--days=7] [--user-id=USER_ID] [--format=json|report]
"""

import os
import sys
import json
import argparse
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict, Counter
from dataclasses import dataclass

@dataclass
class UserJourney:
    user_id: str
    session_id: str
    user_role: str
    is_new_user: bool
    session_duration: int
    pages_visited: List[str]
    features_used: List[str]
    engagement_score: float
    bounced: bool
    conversion_events: List[Dict[str, Any]]
    friction_points: List[Dict[str, Any]]

@dataclass 
class JourneyOptimization:
    journey_patterns: List[Dict[str, Any]]
    conversion_funnel: Dict[str, Any]
    friction_analysis: Dict[str, Any]
    optimization_opportunities: List[Dict[str, Any]]
    personalization_insights: Dict[str, Any]

class UserJourneyAnalyzer:
    def __init__(self, timeframe_days: int = 7):
        self.timeframe_days = timeframe_days
        self.start_date = datetime.now() - timedelta(days=timeframe_days)
        
    def fetch_user_journey_data(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch user journey data - simulated for production system with 4 users"""
        
        # Simulate realistic journey data based on role system changes
        journey_data = []
        
        # User 1: LEARNER → CUSTOMER migration success
        journey_data.append({
            "userId": "user1",
            "sessionId": "session1_1", 
            "userRole": "CUSTOMER",
            "isNewUser": False,
            "migrationDate": "2025-08-20",
            "sessionDuration": 450,
            "pageSequence": [
                {"page": "/login", "timeSpent": 30},
                {"page": "/dashboard", "timeSpent": 180},
                {"page": "/library", "timeSpent": 240}
            ],
            "featuresUsed": ["unified_dashboard", "story_library", "customer_features"],
            "engagementScore": 85,
            "bounced": False,
            "deviceType": "desktop",
            "landingPage": "/login",
            "exitPage": "/library"
        })
        
        # User 1: Follow-up session
        journey_data.append({
            "userId": "user1", 
            "sessionId": "session1_2",
            "userRole": "CUSTOMER",
            "isNewUser": False,
            "migrationDate": "2025-08-20",
            "sessionDuration": 320,
            "pageSequence": [
                {"page": "/dashboard", "timeSpent": 120},
                {"page": "/library/stories", "timeSpent": 200}
            ],
            "featuresUsed": ["story_library", "reading_progress"],
            "engagementScore": 78,
            "bounced": False,
            "deviceType": "mobile",
            "landingPage": "/dashboard", 
            "exitPage": "/library/stories"
        })
        
        # User 2: LEARNER → CUSTOMER migration success
        journey_data.append({
            "userId": "user2",
            "sessionId": "session2_1",
            "userRole": "CUSTOMER", 
            "isNewUser": False,
            "migrationDate": "2025-08-21",
            "sessionDuration": 380,
            "pageSequence": [
                {"page": "/login", "timeSpent": 25},
                {"page": "/dashboard", "timeSpent": 155},
                {"page": "/library", "timeSpent": 120},
                {"page": "/shop", "timeSpent": 80}
            ],
            "featuresUsed": ["unified_dashboard", "story_library", "shop_browse"],
            "engagementScore": 72,
            "bounced": False,
            "deviceType": "tablet",
            "landingPage": "/login",
            "exitPage": "/shop"
        })
        
        # User 3: ADMIN user 
        journey_data.append({
            "userId": "user3",
            "sessionId": "session3_1",
            "userRole": "ADMIN",
            "isNewUser": False,
            "migrationDate": None,
            "sessionDuration": 680,
            "pageSequence": [
                {"page": "/login", "timeSpent": 20},
                {"page": "/admin", "timeSpent": 300},
                {"page": "/admin/users", "timeSpent": 180},
                {"page": "/admin/analytics", "timeSpent": 180}
            ],
            "featuresUsed": ["admin_dashboard", "user_management", "analytics_view", "role_management"],
            "engagementScore": 95,
            "bounced": False,
            "deviceType": "desktop",
            "landingPage": "/login",
            "exitPage": "/admin/analytics"
        })
        
        # User 4: ADMIN user
        journey_data.append({
            "userId": "user4",
            "sessionId": "session4_1", 
            "userRole": "ADMIN",
            "isNewUser": False,
            "migrationDate": None,
            "sessionDuration": 520,
            "pageSequence": [
                {"page": "/admin", "timeSpent": 200},
                {"page": "/admin/stories", "timeSpent": 220},
                {"page": "/admin/volunteer-submissions", "timeSpent": 100}
            ],
            "featuresUsed": ["admin_dashboard", "story_management", "volunteer_review"],
            "engagementScore": 88,
            "bounced": False,
            "deviceType": "desktop", 
            "landingPage": "/admin",
            "exitPage": "/admin/volunteer-submissions"
        })
        
        # Additional sessions to show patterns
        journey_data.extend([
            {
                "userId": "user1",
                "sessionId": "session1_3",
                "userRole": "CUSTOMER",
                "isNewUser": False,
                "migrationDate": "2025-08-20", 
                "sessionDuration": 180,
                "pageSequence": [
                    {"page": "/dashboard", "timeSpent": 60},
                    {"page": "/library/stories/123", "timeSpent": 120}
                ],
                "featuresUsed": ["story_reading"],
                "engagementScore": 65,
                "bounced": False,
                "deviceType": "mobile",
                "landingPage": "/dashboard",
                "exitPage": "/library/stories/123"
            },
            {
                "userId": "user2",
                "sessionId": "session2_2",
                "userRole": "CUSTOMER",
                "isNewUser": False,
                "migrationDate": "2025-08-21",
                "sessionDuration": 95,
                "pageSequence": [
                    {"page": "/library", "timeSpent": 95}
                ],
                "featuresUsed": ["story_library"],
                "engagementScore": 45,
                "bounced": True,
                "deviceType": "mobile",
                "landingPage": "/library",
                "exitPage": "/library"
            }
        ])
        
        # Filter by user_id if specified
        if user_id:
            journey_data = [j for j in journey_data if j["userId"] == user_id]
            
        return journey_data
    
    def analyze_journey_patterns(self, journey_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze common user journey patterns"""
        
        patterns = []
        
        # Group by user role
        role_journeys = defaultdict(list)
        for journey in journey_data:
            role_journeys[journey["userRole"]].append(journey)
        
        for role, journeys in role_journeys.items():
            # Common page sequences
            page_sequences = []
            for journey in journeys:
                pages = [p["page"] for p in journey["pageSequence"]]
                page_sequences.append(" → ".join(pages))
            
            sequence_counts = Counter(page_sequences)
            
            # Calculate averages
            avg_duration = np.mean([j["sessionDuration"] for j in journeys])
            avg_engagement = np.mean([j["engagementScore"] for j in journeys])
            bounce_rate = sum(1 for j in journeys if j["bounced"]) / len(journeys) * 100
            
            # Most used features
            all_features = []
            for journey in journeys:
                all_features.extend(journey["featuresUsed"])
            feature_counts = Counter(all_features)
            
            patterns.append({
                "role": role,
                "total_sessions": len(journeys),
                "unique_users": len(set(j["userId"] for j in journeys)),
                "common_sequences": dict(sequence_counts.most_common(3)),
                "avg_session_duration": avg_duration,
                "avg_engagement_score": avg_engagement,
                "bounce_rate": bounce_rate,
                "top_features": dict(feature_counts.most_common(5)),
                "device_distribution": Counter(j["deviceType"] for j in journeys)
            })
        
        return patterns
    
    def analyze_conversion_funnel(self, journey_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze conversion funnel and drop-off points"""
        
        # Define funnel stages
        funnel_stages = {
            "entry": "/login",
            "dashboard": "/dashboard", 
            "feature_discovery": ["/library", "/shop", "/admin"],
            "engagement": ["story_library", "customer_features", "admin_dashboard"],
            "return_visit": "multiple_sessions"
        }
        
        # Track users through funnel
        user_progress = {}
        for journey in journey_data:
            user_id = journey["userId"]
            if user_id not in user_progress:
                user_progress[user_id] = {
                    "sessions": 0,
                    "reached_dashboard": False,
                    "discovered_features": False,
                    "engaged_features": False,
                    "returned": False
                }
            
            user_progress[user_id]["sessions"] += 1
            
            # Check funnel progression
            pages = [p["page"] for p in journey["pageSequence"]]
            
            if "/dashboard" in pages:
                user_progress[user_id]["reached_dashboard"] = True
                
            if any(page in str(pages) for page in ["/library", "/shop", "/admin"]):
                user_progress[user_id]["discovered_features"] = True
                
            if journey["featuresUsed"]:
                user_progress[user_id]["engaged_features"] = True
                
            if user_progress[user_id]["sessions"] > 1:
                user_progress[user_id]["returned"] = True
        
        # Calculate funnel metrics
        total_users = len(user_progress)
        dashboard_users = sum(1 for u in user_progress.values() if u["reached_dashboard"])
        discovery_users = sum(1 for u in user_progress.values() if u["discovered_features"]) 
        engagement_users = sum(1 for u in user_progress.values() if u["engaged_features"])
        return_users = sum(1 for u in user_progress.values() if u["returned"])
        
        return {
            "total_users": total_users,
            "funnel_metrics": {
                "entry_to_dashboard": (dashboard_users / total_users * 100) if total_users > 0 else 0,
                "dashboard_to_discovery": (discovery_users / dashboard_users * 100) if dashboard_users > 0 else 0,
                "discovery_to_engagement": (engagement_users / discovery_users * 100) if discovery_users > 0 else 0,
                "engagement_to_return": (return_users / engagement_users * 100) if engagement_users > 0 else 0
            },
            "drop_off_points": {
                "dashboard": total_users - dashboard_users,
                "feature_discovery": dashboard_users - discovery_users,
                "engagement": discovery_users - engagement_users,
                "retention": engagement_users - return_users
            },
            "conversion_rate": (return_users / total_users * 100) if total_users > 0 else 0
        }
    
    def identify_friction_points(self, journey_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Identify friction points in user journeys"""
        
        friction_indicators = []
        
        for journey in journey_data:
            # Short sessions (potential friction)
            if journey["sessionDuration"] < 120:  # Less than 2 minutes
                friction_indicators.append({
                    "type": "short_session",
                    "user_id": journey["userId"],
                    "session_id": journey["sessionId"],
                    "duration": journey["sessionDuration"],
                    "pages": [p["page"] for p in journey["pageSequence"]],
                    "severity": "medium"
                })
            
            # Single page bounces
            if journey["bounced"]:
                friction_indicators.append({
                    "type": "bounce",
                    "user_id": journey["userId"], 
                    "session_id": journey["sessionId"],
                    "landing_page": journey["landingPage"],
                    "severity": "high"
                })
            
            # Low engagement scores
            if journey["engagementScore"] < 50:
                friction_indicators.append({
                    "type": "low_engagement",
                    "user_id": journey["userId"],
                    "session_id": journey["sessionId"],
                    "score": journey["engagementScore"],
                    "severity": "medium"
                })
            
            # Pages with very short time spent
            for page_info in journey["pageSequence"]:
                if page_info["timeSpent"] < 15:  # Less than 15 seconds
                    friction_indicators.append({
                        "type": "quick_exit",
                        "user_id": journey["userId"],
                        "page": page_info["page"],
                        "time_spent": page_info["timeSpent"],
                        "severity": "low"
                    })
        
        # Aggregate friction analysis
        friction_by_type = Counter(f["type"] for f in friction_indicators)
        friction_by_severity = Counter(f["severity"] for f in friction_indicators)
        problem_pages = Counter(f.get("page", f.get("landing_page", "unknown")) for f in friction_indicators)
        
        return {
            "total_friction_points": len(friction_indicators),
            "friction_by_type": dict(friction_by_type),
            "friction_by_severity": dict(friction_by_severity),
            "problem_pages": dict(problem_pages.most_common(5)),
            "detailed_friction": friction_indicators
        }
    
    def generate_optimization_opportunities(self, patterns: List[Dict[str, Any]], 
                                          funnel: Dict[str, Any], 
                                          friction: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate specific optimization opportunities"""
        
        opportunities = []
        
        # Funnel optimization opportunities
        funnel_metrics = funnel["funnel_metrics"]
        
        if funnel_metrics["entry_to_dashboard"] < 90:
            opportunities.append({
                "type": "funnel_optimization",
                "priority": "high",
                "area": "Login to Dashboard",
                "current_rate": funnel_metrics["entry_to_dashboard"],
                "target_rate": 95,
                "description": "Improve login to dashboard conversion",
                "recommended_actions": [
                    "Simplify dashboard navigation",
                    "Add welcome tutorial",
                    "Reduce cognitive load on dashboard"
                ],
                "estimated_impact": "high",
                "effort": "medium"
            })
        
        if funnel_metrics["dashboard_to_discovery"] < 80:
            opportunities.append({
                "type": "feature_discovery",
                "priority": "high", 
                "area": "Feature Discovery",
                "current_rate": funnel_metrics["dashboard_to_discovery"],
                "target_rate": 90,
                "description": "Increase feature discovery from dashboard",
                "recommended_actions": [
                    "Add feature highlights on dashboard",
                    "Implement progressive disclosure",
                    "Create guided tours for new features"
                ],
                "estimated_impact": "high",
                "effort": "medium"
            })
        
        # Role-specific optimizations
        for pattern in patterns:
            if pattern["bounce_rate"] > 30:
                opportunities.append({
                    "type": "engagement_optimization",
                    "priority": "medium",
                    "area": f"{pattern['role']} Engagement",
                    "current_rate": 100 - pattern["bounce_rate"],
                    "target_rate": 85,
                    "description": f"Reduce bounce rate for {pattern['role']} users",
                    "recommended_actions": [
                        f"Optimize {pattern['role'].lower()} onboarding flow",
                        "Add personalized content recommendations",
                        "Implement engagement triggers"
                    ],
                    "estimated_impact": "medium",
                    "effort": "medium"
                })
            
            if pattern["avg_session_duration"] < 300:  # Less than 5 minutes
                opportunities.append({
                    "type": "session_extension",
                    "priority": "medium",
                    "area": f"{pattern['role']} Session Duration", 
                    "current_duration": pattern["avg_session_duration"],
                    "target_duration": 420,  # 7 minutes
                    "description": f"Increase session duration for {pattern['role']} users",
                    "recommended_actions": [
                        "Add related content suggestions",
                        "Implement progress tracking",
                        "Create engaging micro-interactions"
                    ],
                    "estimated_impact": "medium", 
                    "effort": "low"
                })
        
        # Friction-based opportunities
        if friction["total_friction_points"] > len(patterns) * 2:  # More than 2 friction points per role
            opportunities.append({
                "type": "friction_reduction",
                "priority": "high",
                "area": "User Experience",
                "friction_points": friction["total_friction_points"],
                "description": "Reduce identified friction points",
                "recommended_actions": [
                    f"Fix issues on {list(friction['problem_pages'].keys())[0]}",
                    "Implement error tracking and resolution",
                    "Add contextual help and guidance"
                ],
                "estimated_impact": "high",
                "effort": "medium"
            })
        
        # Device-specific optimizations
        for pattern in patterns:
            mobile_sessions = pattern["device_distribution"].get("mobile", 0)
            total_sessions = pattern["total_sessions"]
            
            if mobile_sessions > 0 and mobile_sessions / total_sessions > 0.3:
                opportunities.append({
                    "type": "mobile_optimization", 
                    "priority": "medium",
                    "area": "Mobile Experience",
                    "mobile_usage": (mobile_sessions / total_sessions) * 100,
                    "description": f"Optimize mobile experience for {pattern['role']} users",
                    "recommended_actions": [
                        "Improve mobile navigation",
                        "Optimize touch interactions", 
                        "Reduce mobile page load times"
                    ],
                    "estimated_impact": "medium",
                    "effort": "high"
                })
        
        return sorted(opportunities, key=lambda x: {"high": 3, "medium": 2, "low": 1}[x["priority"]], reverse=True)
    
    def generate_personalization_insights(self, journey_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate insights for personalization opportunities"""
        
        # User behavior segmentation
        user_segments = defaultdict(list)
        
        for journey in journey_data:
            # Segment by engagement level
            if journey["engagementScore"] >= 80:
                segment = "high_engagement"
            elif journey["engagementScore"] >= 50:
                segment = "medium_engagement"
            else:
                segment = "low_engagement"
                
            user_segments[segment].append(journey)
        
        # Analyze preferences by segment
        segment_insights = {}
        for segment, journeys in user_segments.items():
            all_features = []
            for journey in journeys:
                all_features.extend(journey["featuresUsed"])
            
            feature_preferences = Counter(all_features)
            avg_session_duration = np.mean([j["sessionDuration"] for j in journeys])
            
            # Common page patterns
            page_patterns = []
            for journey in journeys:
                pages = [p["page"] for p in journey["pageSequence"]]
                page_patterns.extend(pages)
                
            page_preferences = Counter(page_patterns)
            
            segment_insights[segment] = {
                "user_count": len(set(j["userId"] for j in journeys)),
                "avg_session_duration": avg_session_duration,
                "preferred_features": dict(feature_preferences.most_common(3)),
                "preferred_pages": dict(page_preferences.most_common(3)),
                "device_preference": Counter(j["deviceType"] for j in journeys).most_common(1)[0]
            }
        
        return {
            "user_segments": segment_insights,
            "personalization_opportunities": [
                {
                    "segment": "high_engagement",
                    "recommendation": "Provide advanced features and power-user shortcuts",
                    "implementation": "Show advanced dashboard widgets and expert modes"
                },
                {
                    "segment": "medium_engagement", 
                    "recommendation": "Encourage feature exploration with guided discovery",
                    "implementation": "Add progressive feature unlock and tooltips"
                },
                {
                    "segment": "low_engagement",
                    "recommendation": "Simplify interface and provide clear value propositions", 
                    "implementation": "Show simplified dashboard with clear CTAs and benefits"
                }
            ]
        }
    
    def generate_report(self, user_id: Optional[str] = None, format_type: str = "report") -> str:
        """Generate comprehensive user journey optimization report"""
        
        print("🔄 Fetching user journey data...")
        journey_data = self.fetch_user_journey_data(user_id)
        
        if not journey_data:
            return "❌ No journey data found for analysis"
        
        print("🔍 Analyzing journey patterns...")
        patterns = self.analyze_journey_patterns(journey_data)
        
        print("📊 Analyzing conversion funnel...")
        funnel = self.analyze_conversion_funnel(journey_data)
        
        print("⚠️  Identifying friction points...")
        friction = self.identify_friction_points(journey_data)
        
        print("🎯 Generating optimization opportunities...")
        opportunities = self.generate_optimization_opportunities(patterns, funnel, friction)
        
        print("👤 Creating personalization insights...")
        personalization = self.generate_personalization_insights(journey_data)
        
        if format_type == "json":
            return json.dumps({
                "journey_patterns": patterns,
                "conversion_funnel": funnel,
                "friction_analysis": friction,
                "optimization_opportunities": opportunities,
                "personalization_insights": personalization,
                "generated_at": datetime.now().isoformat()
            }, indent=2)
        
        else:  # format_type == "report"
            return self._generate_detailed_report(patterns, funnel, friction, opportunities, personalization)
    
    def _generate_detailed_report(self, patterns, funnel, friction, opportunities, personalization) -> str:
        """Generate detailed user journey optimization report"""
        
        report = []
        
        report.append("="*80)
        report.append("🛣️  USER JOURNEY OPTIMIZATION ANALYSIS REPORT")
        report.append("="*80)
        report.append(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"📊 Analysis Period: {self.timeframe_days} days")
        report.append("")
        
        # Executive Summary
        report.append("📋 EXECUTIVE SUMMARY")
        report.append("-" * 40)
        total_sessions = sum(p["total_sessions"] for p in patterns)
        unique_users = len(set(p["unique_users"] for p in patterns))
        avg_conversion = funnel["conversion_rate"]
        
        report.append(f"Total Sessions Analyzed: {total_sessions}")
        report.append(f"Unique Users: {sum(p['unique_users'] for p in patterns)}")
        report.append(f"Overall Conversion Rate: {avg_conversion:.1f}%")
        report.append(f"Friction Points Identified: {friction['total_friction_points']}")
        report.append("")
        
        # Journey Patterns by Role
        report.append("👥 USER JOURNEY PATTERNS BY ROLE")
        report.append("-" * 40)
        for pattern in patterns:
            report.append(f"\n🏷️  {pattern['role']} Users:")
            report.append(f"   Sessions: {pattern['total_sessions']} | Users: {pattern['unique_users']}")
            report.append(f"   Avg Duration: {pattern['avg_session_duration']:.0f}s | Engagement: {pattern['avg_engagement_score']:.1f}")
            report.append(f"   Bounce Rate: {pattern['bounce_rate']:.1f}%")
            
            report.append("   Common Journeys:")
            for sequence, count in list(pattern['common_sequences'].items())[:2]:
                report.append(f"     • {sequence} ({count} times)")
            
            report.append("   Top Features:")
            for feature, count in list(pattern['top_features'].items())[:3]:
                report.append(f"     • {feature.replace('_', ' ').title()}: {count} uses")
        
        report.append("")
        
        # Conversion Funnel Analysis
        report.append("🔄 CONVERSION FUNNEL ANALYSIS") 
        report.append("-" * 40)
        funnel_metrics = funnel["funnel_metrics"]
        report.append(f"Entry → Dashboard: {funnel_metrics['entry_to_dashboard']:.1f}%")
        report.append(f"Dashboard → Feature Discovery: {funnel_metrics['dashboard_to_discovery']:.1f}%")
        report.append(f"Discovery → Engagement: {funnel_metrics['discovery_to_engagement']:.1f}%")
        report.append(f"Engagement → Return Visit: {funnel_metrics['engagement_to_return']:.1f}%")
        report.append("")
        
        report.append("Drop-off Points:")
        drop_offs = funnel["drop_off_points"]
        for stage, count in drop_offs.items():
            if count > 0:
                report.append(f"  ⚠️  {stage.replace('_', ' ').title()}: {count} users")
        report.append("")
        
        # Friction Analysis
        report.append("⚠️  FRICTION POINT ANALYSIS")
        report.append("-" * 40)
        report.append(f"Total Friction Points: {friction['total_friction_points']}")
        
        if friction["friction_by_type"]:
            report.append("Friction Types:")
            for friction_type, count in friction["friction_by_type"].items():
                report.append(f"  • {friction_type.replace('_', ' ').title()}: {count} instances")
        
        if friction["problem_pages"]:
            report.append("Problem Pages:")
            for page, count in list(friction["problem_pages"].items())[:3]:
                report.append(f"  • {page}: {count} friction points")
        report.append("")
        
        # Optimization Opportunities
        report.append("🎯 OPTIMIZATION OPPORTUNITIES")
        report.append("-" * 40)
        
        high_priority = [o for o in opportunities if o["priority"] == "high"]
        medium_priority = [o for o in opportunities if o["priority"] == "medium"]
        
        if high_priority:
            report.append("🔴 HIGH PRIORITY:")
            for opp in high_priority[:3]:
                report.append(f"\n   {opp['area']}")
                if "current_rate" in opp:
                    report.append(f"   Current: {opp['current_rate']:.1f}% → Target: {opp['target_rate']:.1f}%")
                report.append(f"   {opp['description']}")
                report.append(f"   Impact: {opp['estimated_impact']} | Effort: {opp['effort']}")
                if opp.get("recommended_actions"):
                    report.append("   Actions:")
                    for action in opp["recommended_actions"][:2]:
                        report.append(f"     • {action}")
        
        if medium_priority:
            report.append(f"\n🟡 MEDIUM PRIORITY: ({len(medium_priority)} opportunities)")
            for opp in medium_priority[:2]:
                report.append(f"   • {opp['area']}: {opp['description']}")
        
        report.append("")
        
        # Personalization Insights
        report.append("👤 PERSONALIZATION INSIGHTS")
        report.append("-" * 40)
        
        segments = personalization["user_segments"]
        for segment, data in segments.items():
            report.append(f"\n{segment.replace('_', ' ').title()} Users ({data['user_count']} users):")
            report.append(f"   Avg Session: {data['avg_session_duration']:.0f}s")
            report.append(f"   Preferred Device: {data['device_preference'][0]}")
            
            if data['preferred_features']:
                top_feature = list(data['preferred_features'].keys())[0]
                report.append(f"   Top Feature: {top_feature.replace('_', ' ').title()}")
        
        report.append("\nPersonalization Recommendations:")
        for rec in personalization["personalization_opportunities"]:
            report.append(f"  • {rec['segment'].replace('_', ' ').title()}: {rec['recommendation']}")
        
        report.append("")
        
        # Role System Impact Assessment
        report.append("🎯 ROLE SYSTEM IMPACT ASSESSMENT")
        report.append("-" * 40)
        report.append("Positive Impacts Observed:")
        
        # Calculate success metrics
        customer_pattern = next((p for p in patterns if p["role"] == "CUSTOMER"), None)
        if customer_pattern:
            report.append(f"  ✅ Customer users show {customer_pattern['avg_engagement_score']:.1f} avg engagement")
            report.append(f"  ✅ Customer bounce rate: {customer_pattern['bounce_rate']:.1f}%")
        
        admin_pattern = next((p for p in patterns if p["role"] == "ADMIN"), None)
        if admin_pattern:
            report.append(f"  ✅ Admin users highly engaged: {admin_pattern['avg_engagement_score']:.1f} score")
            report.append(f"  ✅ Admin workflow efficiency: {admin_pattern['avg_session_duration']:.0f}s avg session")
        
        if funnel["conversion_rate"] > 50:
            report.append(f"  ✅ Good overall conversion rate: {funnel['conversion_rate']:.1f}%")
        
        report.append("")
        report.append("📈 CONCLUSION")
        report.append("-" * 40)
        
        if len([o for o in opportunities if o["priority"] == "high"]) == 0:
            report.append("🎉 EXCELLENT: User journeys are optimized with minimal friction!")
        elif len([o for o in opportunities if o["priority"] == "high"]) <= 2:
            report.append("👍 GOOD: User journeys performing well with targeted improvement opportunities.")
        else:
            report.append("⚠️  NEEDS ATTENTION: Multiple high-priority optimizations identified.")
        
        report.append("")
        report.append("Next Steps:")
        report.append("1. Implement high-priority optimizations")
        report.append("2. Set up automated journey monitoring")
        report.append("3. A/B test personalization strategies")
        report.append("4. Monitor conversion funnel improvements")
        
        report.append("")
        report.append("="*80)
        
        return "\n".join(report)

def main():
    parser = argparse.ArgumentParser(description='Analyze user journey optimization opportunities')
    parser.add_argument('--days', type=int, default=7, help='Analysis timeframe in days')
    parser.add_argument('--user-id', help='Specific user ID to analyze')
    parser.add_argument('--format', choices=['json', 'report'], default='report', help='Output format')
    parser.add_argument('--output', help='Output file path (optional)')
    
    args = parser.parse_args()
    
    analyzer = UserJourneyAnalyzer(timeframe_days=args.days)
    
    print("🚀 Starting User Journey Optimization Analysis...")
    print(f"📅 Analyzing last {args.days} days")
    if args.user_id:
        print(f"👤 Focused on user: {args.user_id}")
    print(f"📄 Output format: {args.format}")
    print()
    
    report = analyzer.generate_report(args.user_id, args.format)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(report)
        print(f"📄 Report saved to: {args.output}")
    else:
        print(report)

if __name__ == "__main__":
    main()