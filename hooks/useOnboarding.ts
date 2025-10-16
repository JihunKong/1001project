'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  shouldShowOnboarding: boolean
  onboardingVersion: string
}

const CURRENT_ONBOARDING_VERSION = '1.0.0'
const ONBOARDING_STORAGE_KEY = '1001stories_onboarding'

export function useOnboarding() {
  const { data: session, status } = useSession()
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    shouldShowOnboarding: false,
    onboardingVersion: CURRENT_ONBOARDING_VERSION
  })

  // Load onboarding state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || status === 'loading') return

    const savedState = localStorage.getItem(ONBOARDING_STORAGE_KEY)

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as Record<string, OnboardingState>
        const userEmail = session?.user?.email

        if (userEmail && parsed[userEmail]) {
          const userOnboardingState = parsed[userEmail]

          // Check if user needs to see onboarding (new user or version update)
          const needsOnboarding = !userOnboardingState.hasCompletedOnboarding ||
                                  userOnboardingState.onboardingVersion !== CURRENT_ONBOARDING_VERSION

          setOnboardingState({
            hasCompletedOnboarding: userOnboardingState.hasCompletedOnboarding,
            shouldShowOnboarding: needsOnboarding && session?.user?.role !== 'ADMIN', // Admins skip onboarding
            onboardingVersion: CURRENT_ONBOARDING_VERSION
          })
        } else if (session?.user && session.user.role !== 'ADMIN') {
          // New user
          setOnboardingState({
            hasCompletedOnboarding: false,
            shouldShowOnboarding: true,
            onboardingVersion: CURRENT_ONBOARDING_VERSION
          })
        }
      } catch (error) {
        console.error('Error parsing onboarding state:', error)
        // Reset to default state for new users
        if (session?.user && session.user.role !== 'ADMIN') {
          setOnboardingState({
            hasCompletedOnboarding: false,
            shouldShowOnboarding: true,
            onboardingVersion: CURRENT_ONBOARDING_VERSION
          })
        }
      }
    } else if (session?.user && session.user.role !== 'ADMIN') {
      // No saved state, new user
      setOnboardingState({
        hasCompletedOnboarding: false,
        shouldShowOnboarding: true,
        onboardingVersion: CURRENT_ONBOARDING_VERSION
      })
    }
  }, [session, status])

  const completeOnboarding = () => {
    if (!session?.user?.email) return

    const userEmail = session.user.email
    const savedState = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    let allUsersState: Record<string, OnboardingState> = {}

    if (savedState) {
      try {
        allUsersState = JSON.parse(savedState)
      } catch (error) {
        console.error('Error parsing saved onboarding state:', error)
      }
    }

    // Update state for current user
    allUsersState[userEmail] = {
      hasCompletedOnboarding: true,
      shouldShowOnboarding: false,
      onboardingVersion: CURRENT_ONBOARDING_VERSION
    }

    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(allUsersState))

    setOnboardingState({
      hasCompletedOnboarding: true,
      shouldShowOnboarding: false,
      onboardingVersion: CURRENT_ONBOARDING_VERSION
    })

    // Track onboarding completion
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as any).gtag('event', 'onboarding_completed', {
        event_category: 'engagement',
        user_role: session.user.role,
        onboarding_version: CURRENT_ONBOARDING_VERSION
      })
    }
  }

  const skipOnboarding = () => {
    if (!session?.user?.email) return

    const userEmail = session.user.email
    const savedState = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    let allUsersState: Record<string, OnboardingState> = {}

    if (savedState) {
      try {
        allUsersState = JSON.parse(savedState)
      } catch (error) {
        console.error('Error parsing saved onboarding state:', error)
      }
    }

    // Mark as skipped (not completed, but don't show again)
    allUsersState[userEmail] = {
      hasCompletedOnboarding: false,
      shouldShowOnboarding: false,
      onboardingVersion: CURRENT_ONBOARDING_VERSION
    }

    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(allUsersState))

    setOnboardingState({
      hasCompletedOnboarding: false,
      shouldShowOnboarding: false,
      onboardingVersion: CURRENT_ONBOARDING_VERSION
    })

    // Track onboarding skip
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as any).gtag('event', 'onboarding_skipped', {
        event_category: 'engagement',
        user_role: session.user.role,
        onboarding_version: CURRENT_ONBOARDING_VERSION
      })
    }
  }

  const resetOnboarding = () => {
    if (!session?.user?.email) return

    const userEmail = session.user.email
    const savedState = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    let allUsersState: Record<string, OnboardingState> = {}

    if (savedState) {
      try {
        allUsersState = JSON.parse(savedState)
      } catch (error) {
        console.error('Error parsing saved onboarding state:', error)
      }
    }

    // Reset onboarding for current user
    allUsersState[userEmail] = {
      hasCompletedOnboarding: false,
      shouldShowOnboarding: true,
      onboardingVersion: CURRENT_ONBOARDING_VERSION
    }

    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(allUsersState))

    setOnboardingState({
      hasCompletedOnboarding: false,
      shouldShowOnboarding: true,
      onboardingVersion: CURRENT_ONBOARDING_VERSION
    })
  }

  const triggerOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      shouldShowOnboarding: true
    }))
  }

  return {
    ...onboardingState,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    triggerOnboarding,
    isNewUser: !onboardingState.hasCompletedOnboarding,
    userRole: session?.user?.role as 'LEARNER' | 'TEACHER' | 'VOLUNTEER' | 'STORY_MANAGER' | 'BOOK_MANAGER' | 'CONTENT_ADMIN' | 'ADMIN'
  }
}