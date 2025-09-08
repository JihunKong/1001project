"use client"

interface AnalyticsEvent {
  eventName: string
  properties?: Record<string, any>
  userId?: string
  sessionId?: string
  timestamp?: number
}

interface UserAnalyticsData {
  userId?: string
  sessionId: string
  userRole?: string
  isNewUser: boolean
  migrationDate?: string
  sessionStart: number
  pageViews: number
  clickCount: number
  scrollDepth: number
  landingPage?: string
  exitPage?: string
  pageSequence: Array<{
    page: string
    timestamp: number
    timeSpent: number
  }>
  featuresUsed: string[]
  actionsPerformed: Array<{
    action: string
    timestamp: number
    page: string
    data?: any
  }>
  errorsEncountered: string[]
  deviceType?: string
  browserName?: string
  operatingSystem?: string
  screenResolution?: string
  engagementScore: number
  bounceRate: boolean
  returnVisitor: boolean
}

class UXTracker {
  private sessionData: UserAnalyticsData
  private startTime: number
  private lastPageView: number
  private currentPageStart: number
  private scrollDepthHistory: number[] = []
  private clickEvents: Array<{x: number, y: number, target: string, timestamp: number}> = []
  
  constructor() {
    this.startTime = Date.now()
    this.lastPageView = this.startTime
    this.currentPageStart = this.startTime
    
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('ux-session-id')
    if (!sessionId) {
      sessionId = this.generateSessionId()
      sessionStorage.setItem('ux-session-id', sessionId)
    }
    
    // Initialize session data
    this.sessionData = {
      sessionId,
      isNewUser: !localStorage.getItem('returning-user'),
      sessionStart: this.startTime,
      pageViews: 0,
      clickCount: 0,
      scrollDepth: 0,
      pageSequence: [],
      featuresUsed: [],
      actionsPerformed: [],
      errorsEncountered: [],
      engagementScore: 0,
      bounceRate: true,
      returnVisitor: !!localStorage.getItem('returning-user'),
      deviceType: this.getDeviceType(),
      browserName: this.getBrowserName(),
      operatingSystem: this.getOperatingSystem(),
      screenResolution: `${window.screen.width}x${window.screen.height}`
    }
    
    // Mark as returning user for future sessions
    localStorage.setItem('returning-user', 'true')
    
    // Track initial page view
    this.trackPageView(window.location.pathname)
    
    // Set up event listeners
    this.initializeEventListeners()
  }
  
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36)
  }
  
  private getDeviceType(): string {
    const width = window.innerWidth
    if (width <= 768) return 'mobile'
    if (width <= 1024) return 'tablet'
    return 'desktop'
  }
  
  private getBrowserName(): string {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }
  
  private getOperatingSystem(): string {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }
  
  private initializeEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageExit()
      } else {
        this.currentPageStart = Date.now()
      }
    })
    
    // Track clicks
    document.addEventListener('click', (e) => {
      this.trackClick(e)
    })
    
    // Track scrolling
    let scrollTimeout: NodeJS.Timeout
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.trackScroll()
      }, 100)
    })
    
    // Track errors
    window.addEventListener('error', (e) => {
      this.trackError(e.error?.message || 'JavaScript error')
    })
    
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.trackError(`Unhandled promise rejection: ${e.reason}`)
    })
    
    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endSession()
    })
  }
  
  // Public methods for tracking specific events
  
  public setUserContext(userId: string, userRole: string, migrationDate?: string): void {
    this.sessionData.userId = userId
    this.sessionData.userRole = userRole
    this.sessionData.migrationDate = migrationDate
  }
  
  public trackPageView(page: string): void {
    const now = Date.now()
    
    // Calculate time spent on previous page
    if (this.sessionData.pageSequence.length > 0) {
      const lastPage = this.sessionData.pageSequence[this.sessionData.pageSequence.length - 1]
      lastPage.timeSpent = now - this.currentPageStart
      
      // Update bounce rate (false if more than one page viewed)
      if (this.sessionData.pageSequence.length > 1) {
        this.sessionData.bounceRate = false
      }
    }
    
    // Add current page to sequence
    this.sessionData.pageSequence.push({
      page,
      timestamp: now,
      timeSpent: 0 // Will be updated when leaving page
    })
    
    this.sessionData.pageViews++
    this.currentPageStart = now
    
    // Set landing page
    if (!this.sessionData.landingPage) {
      this.sessionData.landingPage = page
    }
    
    // Track as action
    this.trackAction('page_view', { page })
  }
  
  public trackFeatureUsage(featureName: string, category?: string, data?: any): void {
    if (!this.sessionData.featuresUsed.includes(featureName)) {
      this.sessionData.featuresUsed.push(featureName)
    }
    
    this.trackAction('feature_used', {
      feature: featureName,
      category,
      ...data
    })
    
    // Send feature usage to server
    this.sendFeatureUsage(featureName, category, data)
  }
  
  public trackRoleMigration(fromRole: string, toRole: string, migrationType: string): void {
    this.trackAction('role_migration', {
      fromRole,
      toRole,
      migrationType,
      timestamp: Date.now()
    })
    
    // Send role migration data to server
    fetch('/api/analytics/role-migration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionData.sessionId,
        userId: this.sessionData.userId,
        fromRole,
        toRole,
        migrationType,
        userAgent: navigator.userAgent
      })
    }).catch(console.error)
  }
  
  public trackError(error: string): void {
    if (!this.sessionData.errorsEncountered.includes(error)) {
      this.sessionData.errorsEncountered.push(error)
    }
    
    this.trackAction('error_encountered', { error })
  }
  
  public trackAction(action: string, data?: any): void {
    this.sessionData.actionsPerformed.push({
      action,
      timestamp: Date.now(),
      page: window.location.pathname,
      data
    })
    
    // Calculate engagement score
    this.updateEngagementScore()
  }
  
  public trackClick(event: MouseEvent): void {
    this.sessionData.clickCount++
    
    const target = event.target as HTMLElement
    const className = typeof target.className === 'string' 
      ? target.className 
      : target.className?.baseVal || ''
    
    this.clickEvents.push({
      x: event.clientX,
      y: event.clientY,
      target: target.tagName + (className ? '.' + className.split(' ').join('.') : ''),
      timestamp: Date.now()
    })
    
    // Keep only last 50 clicks to prevent memory issues
    if (this.clickEvents.length > 50) {
      this.clickEvents = this.clickEvents.slice(-50)
    }
  }
  
  public trackScroll(): void {
    const scrollTop = window.scrollY
    const documentHeight = document.body.scrollHeight - window.innerHeight
    const scrollPercent = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0
    
    this.scrollDepthHistory.push(scrollPercent)
    this.sessionData.scrollDepth = Math.max(...this.scrollDepthHistory)
  }
  
  private trackPageExit(): void {
    this.sessionData.exitPage = window.location.pathname
    
    // Update time spent on current page
    if (this.sessionData.pageSequence.length > 0) {
      const lastPage = this.sessionData.pageSequence[this.sessionData.pageSequence.length - 1]
      lastPage.timeSpent = Date.now() - this.currentPageStart
    }
  }
  
  private updateEngagementScore(): void {
    let score = 0
    
    // Page views (max 20 points)
    score += Math.min(this.sessionData.pageViews * 2, 20)
    
    // Features used (max 25 points)
    score += Math.min(this.sessionData.featuresUsed.length * 5, 25)
    
    // Actions performed (max 20 points)
    score += Math.min(this.sessionData.actionsPerformed.length, 20)
    
    // Time spent (max 15 points) - 1 point per minute up to 15 minutes
    const timeSpent = (Date.now() - this.sessionData.sessionStart) / (1000 * 60)
    score += Math.min(timeSpent, 15)
    
    // Scroll depth (max 10 points)
    score += (this.sessionData.scrollDepth / 100) * 10
    
    // Click engagement (max 10 points)
    score += Math.min(this.sessionData.clickCount / 10, 10)
    
    this.sessionData.engagementScore = Math.round(score)
  }
  
  private async sendFeatureUsage(featureName: string, category?: string, data?: any): Promise<void> {
    try {
      await fetch('/api/analytics/feature-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionData.sessionId,
          userId: this.sessionData.userId,
          featureName,
          featureCategory: category,
          userRole: this.sessionData.userRole,
          deviceType: this.sessionData.deviceType,
          data
        })
      })
    } catch (error) {
      console.error('Failed to send feature usage:', error)
    }
  }
  
  public async endSession(): Promise<void> {
    try {
      // Final updates
      this.trackPageExit()
      this.updateEngagementScore()
      
      // Send session data to server
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.sessionData,
          sessionEnd: Date.now(),
          totalDuration: Math.floor((Date.now() - this.sessionData.sessionStart) / 1000),
          clickPath: this.clickEvents.slice(-20) // Send last 20 clicks
        })
      })
    } catch (error) {
      console.error('Failed to send session data:', error)
    }
  }
  
  // Static methods for easy tracking
  static track(eventName: string, properties?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).uxTracker) {
      (window as any).uxTracker.trackAction(eventName, properties)
    }
  }
  
  static trackFeature(featureName: string, category?: string, data?: any): void {
    if (typeof window !== 'undefined' && (window as any).uxTracker) {
      (window as any).uxTracker.trackFeatureUsage(featureName, category, data)
    }
  }
}

// Initialize tracker on client-side
let tracker: UXTracker | null = null

export function initializeUXTracker(): UXTracker {
  if (typeof window !== 'undefined' && !tracker) {
    tracker = new UXTracker()
    ;(window as any).uxTracker = tracker
  }
  return tracker!
}

export function getUXTracker(): UXTracker | null {
  return tracker
}

export { UXTracker }
export default UXTracker