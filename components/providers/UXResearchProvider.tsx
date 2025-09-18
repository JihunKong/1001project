"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { initializeUXTracker, UXTracker } from '@/lib/analytics/ux-tracker'
import FeedbackWidget from '@/components/feedback/FeedbackWidget'
import SurveyModal from '@/components/feedback/SurveyModal'

interface UXResearchContextType {
  tracker: UXTracker | null
  showFeedbackWidget: () => void
  trackFeature: (featureName: string, category?: string, data?: any) => void
  trackRoleMigration: (fromRole: string, toRole: string, type: string) => void
}

const UXResearchContext = createContext<UXResearchContextType>({
  tracker: null,
  showFeedbackWidget: () => {},
  trackFeature: () => {},
  trackRoleMigration: () => {}
})

export const useUXResearch = () => {
  const context = useContext(UXResearchContext)
  if (!context) {
    throw new Error('useUXResearch must be used within UXResearchProvider')
  }
  return context
}

interface Survey {
  id: string
  name: string
  description?: string
  questions: any[]
  trigger: string
  targetPage?: string
  targetRole?: string[]
  displayType: string
  position: string
  delay: number
}

interface UXResearchProviderProps {
  children: React.ReactNode
}

export default function UXResearchProvider({ children }: UXResearchProviderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [tracker, setTracker] = useState<UXTracker | null>(null)
  const [feedbackWidgetVisible, setFeedbackWidgetVisible] = useState(false)
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null)
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([])
  
  // Initialize UX tracker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uxTracker = initializeUXTracker()
      setTracker(uxTracker)
      
      // Set user context when session is available
      if (session?.user) {
        uxTracker.setUserContext(
          session.user.id,
          session.user.role,
          // Add migration date if user was migrated (this would come from user profile)
          undefined
        )
      }
    }
  }, [session])
  
  // Track page views
  useEffect(() => {
    if (tracker && pathname) {
      tracker.trackPageView(pathname)
      
      // Track specific page types
      if (pathname.includes('/dashboard')) {
        tracker.trackFeatureUsage('dashboard_access', 'navigation')
      } else if (pathname.includes('/library')) {
        tracker.trackFeatureUsage('library_access', 'content')
      } else if (pathname.includes('/admin')) {
        tracker.trackFeatureUsage('admin_access', 'admin')
      }
    }
  }, [tracker, pathname])
  
  // Load available surveys
  useEffect(() => {
    loadSurveys()
  }, [session, pathname])
  
  // Check for survey triggers
  useEffect(() => {
    if (availableSurveys.length > 0) {
      checkSurveyTriggers()
    }
  }, [availableSurveys, pathname, session])
  
  const loadSurveys = async () => {
    try {
      const response = await fetch(`/api/surveys/active?page=${pathname}&role=${session?.user?.role}`)
      if (response.ok) {
        const surveys = await response.json()
        setAvailableSurveys(surveys)
      }
    } catch (error) {
      console.error('Failed to load surveys:', error)
    }
  }
  
  const checkSurveyTriggers = () => {
    const now = Date.now()
    
    for (const survey of availableSurveys) {
      // Check if survey should be triggered
      let shouldTrigger = false
      
      // Page-based triggers
      if (survey.targetPage && pathname === survey.targetPage) {
        if (survey.trigger === 'PAGE_LOAD') {
          shouldTrigger = true
        } else if (survey.trigger === 'TIME_DELAY') {
          setTimeout(() => {
            setActiveSurvey(survey)
          }, survey.delay)
        }
      }
      
      // Role-based triggers
      if (survey.targetRole && session?.user?.role && 
          survey.targetRole.includes(session.user.role)) {
        shouldTrigger = true
      }
      
      // General triggers
      if (!survey.targetPage && !survey.targetRole) {
        if (survey.trigger === 'PAGE_LOAD') {
          shouldTrigger = true
        }
      }
      
      if (shouldTrigger && survey.trigger === 'PAGE_LOAD') {
        // Add delay even for page load triggers
        setTimeout(() => {
          setActiveSurvey(survey)
        }, survey.delay)
        break // Only show one survey at a time
      }
    }
  }
  
  const showFeedbackWidget = () => {
    setFeedbackWidgetVisible(true)
  }
  
  const trackFeature = (featureName: string, category?: string, data?: any) => {
    if (tracker) {
      tracker.trackFeatureUsage(featureName, category, data)
    }
  }
  
  const trackRoleMigration = (fromRole: string, toRole: string, type: string) => {
    if (tracker) {
      tracker.trackRoleMigration(fromRole, toRole, type)
    }
  }
  
  const handleSurveyComplete = () => {
    setActiveSurvey(null)
    // Remove completed survey from available surveys to prevent re-showing
    if (activeSurvey) {
      setAvailableSurveys(prev => prev.filter(s => s.id !== activeSurvey.id))
    }
  }
  
  const handleSurveyClose = () => {
    setActiveSurvey(null)
  }
  
  const contextValue: UXResearchContextType = {
    tracker,
    showFeedbackWidget,
    trackFeature,
    trackRoleMigration
  }
  
  return (
    <UXResearchContext.Provider value={contextValue}>
      {children}
      
      {/* Feedback Widget */}
      {feedbackWidgetVisible && (
        <FeedbackWidget
          page={pathname}
          onClose={() => setFeedbackWidgetVisible(false)}
        />
      )}
      
      {/* Floating Feedback Button (always visible) */}
      {!feedbackWidgetVisible && !activeSurvey && (
        <FeedbackWidget
          page={pathname}
          trigger="manual"
          position="bottom-right"
        />
      )}
      
      {/* Survey Modal */}
      {activeSurvey && (
        <SurveyModal
          survey={activeSurvey}
          onComplete={handleSurveyComplete}
          onClose={handleSurveyClose}
        />
      )}
      
      {/* Role Migration Detection and Feedback */}
      <RoleMigrationDetector onMigrationDetected={trackRoleMigration} />
    </UXResearchContext.Provider>
  )
}

// Component to detect role migrations
function RoleMigrationDetector({ 
  onMigrationDetected 
}: { 
  onMigrationDetected: (from: string, to: string, type: string) => void 
}) {
  const { data: session } = useSession()
  const [lastKnownRole, setLastKnownRole] = useState<string | null>(null)
  
  useEffect(() => {
    if (session?.user?.role) {
      const storedRole = localStorage.getItem('user-role')
      
      if (storedRole && storedRole !== session.user.role) {
        // Role migration detected
        onMigrationDetected(storedRole, session.user.role, 'SYSTEM_MIGRATION')
        
        // Show role migration feedback prompt after a delay
        setTimeout(() => {
          const showMigrationFeedback = confirm(
            'We notice your role has changed. Would you like to provide feedback about this change?'
          )
          if (showMigrationFeedback) {
            // This would trigger a specific role migration survey
            // or show the feedback widget with pre-selected role migration type
          }
        }, 3000)
      }
      
      // Update stored role
      localStorage.setItem('user-role', session.user.role)
      setLastKnownRole(session.user.role)
    }
  }, [session?.user?.role, onMigrationDetected])
  
  return null
}