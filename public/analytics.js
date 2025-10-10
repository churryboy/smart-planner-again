// Analytics module for Mixpanel integration
class Analytics {
  constructor() {
    this.isInitialized = false;
    this.userId = null;
    this.debugMode = window.location.hostname === 'localhost' || window.location.search.includes('debug=true');
  }

  // Initialize Mixpanel
  init(projectToken) {
    if (!projectToken) {
      console.error('❌ No Mixpanel project token provided');
      return;
    }

    if (typeof mixpanel !== 'undefined') {
      try {
        mixpanel.init(projectToken, {
          debug: this.debugMode,
          track_pageview: true,
          persistence: 'localStorage',
          loaded: (mixpanel) => {
            console.log('📊 Mixpanel loaded successfully');
          }
        });
        this.isInitialized = true;
        console.log('📊 Mixpanel initialized with token:', projectToken.substring(0, 8) + '...');
      } catch (error) {
        console.error('❌ Mixpanel initialization failed:', error);
      }
    } else {
      console.error('❌ Mixpanel library not loaded - check network connectivity and script loading');
    }
  }

  // Set user identity
  identify(userId) {
    if (!this.isInitialized) return;
    
    this.userId = userId;
    mixpanel.identify(userId);
    mixpanel.people.set({
      '$name': userId,
      'nickname': userId,
      'first_seen': new Date()
    });
    
    console.log('👤 User identified:', userId);
  }

  // Track events
  track(eventName, properties = {}) {
    if (!this.isInitialized) {
      console.warn('⚠️ Analytics not initialized, skipping event:', eventName);
      return;
    }
    
    try {
      const eventData = {
        ...properties,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      mixpanel.track(eventName, eventData);
      if (this.debugMode) {
        console.log('📈 Event tracked:', eventName, eventData);
      }
    } catch (error) {
      console.error('❌ Failed to track event:', eventName, error);
    }
  }

  // User registration/login events
  trackUserRegistration(nickname) {
    this.track('User Registered', {
      nickname: nickname,
      registration_method: 'nickname'
    });
  }

  trackUserLogin(nickname) {
    this.track('User Login', {
      nickname: nickname
    });
  }

  trackUserLogout(nickname) {
    this.track('User Logout', {
      nickname: nickname
    });
  }

  // Time tracking events
  trackTaskStart(taskName, tags = []) {
    this.track('Task Started', {
      task_name: taskName,
      tags: tags,
      tag_count: tags.length
    });
  }

  trackTaskStop(taskName, duration, tags = []) {
    this.track('Task Stopped', {
      task_name: taskName,
      duration_minutes: Math.round(duration / (1000 * 60)),
      duration_seconds: Math.round(duration / 1000),
      tags: tags,
      tag_count: tags.length
    });
  }

  trackTaskPause(taskName, duration, tags = []) {
    this.track('Task Paused', {
      task_name: taskName,
      duration_minutes: Math.round(duration / (1000 * 60)),
      tags: tags
    });
  }

  // Navigation events
  trackViewSwitch(fromView, toView) {
    this.track('View Switched', {
      from_view: fromView,
      to_view: toView
    });
  }

  // AI Todo events
  trackAIRecommendationGenerated(examType, examDate, recommendationCount) {
    this.track('AI Recommendation Generated', {
      exam_type: examType,
      exam_date: examDate,
      recommendation_count: recommendationCount,
      days_until_exam: Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))
    });
  }

  trackAIRecommendationClicked(recommendation) {
    this.track('AI Recommendation Clicked', {
      recommendation_title: recommendation.title,
      recommendation_priority: recommendation.priority,
      recommendation_category: recommendation.category,
      estimated_time: recommendation.estimatedTime
    });
  }

  trackAIRecommendationStarted(recommendation) {
    this.track('AI Recommendation Started', {
      recommendation_title: recommendation.title,
      recommendation_priority: recommendation.priority,
      recommendation_category: recommendation.category,
      estimated_time: recommendation.estimatedTime
    });
  }

  // Analytics events
  trackAnalyticsView(timeRange) {
    this.track('Analytics Viewed', {
      time_range: timeRange
    });
  }

  // Calendar events
  trackCalendarMonthChanged(year, month) {
    this.track('Calendar Month Changed', {
      year: year,
      month: month,
      month_name: new Date(year, month).toLocaleString('ko-KR', { month: 'long' })
    });
  }

  trackCalendarDateSelected(date, studyTime) {
    this.track('Calendar Date Selected', {
      selected_date: date,
      day_of_week: new Date(date).toLocaleString('ko-KR', { weekday: 'long' }),
      study_time_minutes: Math.round(studyTime / (1000 * 60)),
      has_data: studyTime > 0
    });
  }

  // Multi-task events
  trackTaskAdded(taskName) {
    this.track('Task Added', {
      task_name: taskName
    });
  }

  trackTaskDeleted(taskName, totalTime) {
    this.track('Task Deleted', {
      task_name: taskName,
      total_time_minutes: Math.round(totalTime / (1000 * 60))
    });
  }

  trackTaskCategoryChanged(taskName, oldCategory, newCategory) {
    this.track('Task Category Changed', {
      task_name: taskName,
      old_category: oldCategory,
      new_category: newCategory
    });
  }

  // Error tracking
  trackError(errorType, errorMessage, context = {}) {
    this.track('Error Occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context: context
    });
  }

  // Session events
  trackSessionStart() {
    this.track('Session Started', {
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    });
  }

  trackSessionEnd(duration) {
    this.track('Session Ended', {
      session_duration_minutes: Math.round(duration / (1000 * 60))
    });
  }
}

// Create global analytics instance
window.analytics = new Analytics(); 