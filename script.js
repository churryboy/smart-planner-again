/**
 * QANDA Design System v4.0
 * JavaScript Implementation
 * Following component naming conventions and event tracking
 */

// ========================================
// Configuration
// ========================================
const CONFIG = {
    MIXPANEL_ENABLED: true,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 66,
    TOUCH_FEEDBACK: true,
    RANDOMIZE_CARDS: true
};

// ========================================
// Mixpanel Tracking Functions
// ========================================

/**
 * Track Smart Review Note interaction
 * Component: button-primary-medium
 */
function trackSmartReviewNote() {
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        mixpanel.track('Smart Review Note Clicked', {
            'feature': 'smart_review_note',
            'action': 'button_click',
            'button_type': 'primary',
            'button_size': 'medium',
            'timestamp': new Date().toISOString(),
            'user_agent': navigator.userAgent,
            'viewport': {
                'width': window.innerWidth,
                'height': window.innerHeight
            }
        });
    }
    
    // Redirect to Smart Review Note with proper error handling
    try {
        window.open('https://review-note.onrender.com/', '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('Failed to open Smart Review Note:', error);
        window.location.href = 'https://review-note.onrender.com/';
    }
}

/**
 * Track Smart Planner interaction
 * Component: button-primary-medium
 */
function trackSmartPlanner() {
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        mixpanel.track('Smart Planner Clicked', {
            'feature': 'smart_planner',
            'action': 'button_click',
            'button_type': 'primary',
            'button_size': 'medium',
            'timestamp': new Date().toISOString(),
            'user_agent': navigator.userAgent,
            'viewport': {
                'width': window.innerWidth,
                'height': window.innerHeight
            }
        });
    }
    
    // Redirect to Smart Planner
    try {
        window.open('https://forms.gle/F1kfEmfbY2N5HoDG8', '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('Failed to open Smart Planner:', error);
        window.location.href = 'https://forms.gle/F1kfEmfbY2N5HoDG8';
    }
}

/**
 * Track Smart Tutor interaction
 * Component: button-primary-medium
 */
function trackSmartTutor() {
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        mixpanel.track('Smart Tutor Clicked', {
            'feature': 'smart_tutor',
            'action': 'button_click',
            'button_type': 'primary',
            'button_size': 'medium',
            'timestamp': new Date().toISOString(),
            'user_agent': navigator.userAgent,
            'viewport': {
                'width': window.innerWidth,
                'height': window.innerHeight
            }
        });
    }
    
    // Redirect to Smart Tutor
    try {
        window.open('https://forms.gle/F1kfEmfbY2N5HoDG8', '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('Failed to open Smart Tutor:', error);
        window.location.href = 'https://forms.gle/F1kfEmfbY2N5HoDG8';
    }
}

/**
 * Track Feature Recommendation interaction
 * Component: button-secondary-medium
 */
function trackFeatureRecommendation() {
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        mixpanel.track('Feature Recommendation Clicked', {
            'feature': 'feature_recommendation',
            'action': 'button_click',
            'button_type': 'secondary',
            'button_size': 'medium',
            'timestamp': new Date().toISOString(),
            'user_agent': navigator.userAgent,
            'viewport': {
                'width': window.innerWidth,
                'height': window.innerHeight
            }
        });
    }
    
    // Redirect to Google Forms
    try {
        window.open('https://forms.gle/zsqajdXUEjKBoVHE6', '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('Failed to open Feature Recommendation form:', error);
        window.location.href = 'https://forms.gle/zsqajdXUEjKBoVHE6';
    }
}

/**
 * Track navigation interactions
 * @param {string} section - Navigation section identifier
 */
function trackNavigation(section) {
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        mixpanel.track('Navigation Clicked', {
            'section': section,
            'action': 'navigation_click',
            'timestamp': new Date().toISOString(),
            'previous_section': document.querySelector('.nav-item.active')?.getAttribute('aria-label')?.toLowerCase() || 'unknown'
        });
    }
}

// ========================================
// Page View Tracking
// ========================================

/**
 * Track page view with comprehensive data
 */
function trackPageView() {
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        const performanceData = performance.getEntriesByType('navigation')[0] || {};
        
        mixpanel.track('Page View', {
            'page': 'main',
            'timestamp': new Date().toISOString(),
            'user_agent': navigator.userAgent,
            'screen_resolution': `${screen.width}x${screen.height}`,
            'viewport': `${window.innerWidth}x${window.innerHeight}`,
            'device_pixel_ratio': window.devicePixelRatio,
            'page_load_time': performanceData.loadEventEnd - performanceData.fetchStart,
            'dom_ready_time': performanceData.domContentLoadedEventEnd - performanceData.fetchStart,
            'connection_type': navigator.connection?.effectiveType || 'unknown'
        });
    }
}

// ========================================
// Card Randomization
// ========================================

/**
 * Randomize game cards while keeping "스마트 오답노트" at top and "신기능 제안" at bottom
 * Follows design system card-component structure
 */
function randomizeGameCards() {
    if (!CONFIG.RANDOMIZE_CARDS) return;
    
    const content = document.querySelector('.content');
    if (!content) return;
    
    const gameCards = Array.from(content.querySelectorAll('.card-component'));
    
    // Find the "스마트 오답노트" card (anchor at top)
    const reviewNoteCard = gameCards.find(card => 
        card.querySelector('.headline-strong')?.textContent.trim() === '스마트 오답노트'
    );
    
    // Find the "신기능 제안" card (anchor at bottom)
    const featureCard = gameCards.find(card => 
        card.querySelector('.headline-strong')?.textContent.trim() === '신기능 제안'
    );
    
    // Get all other cards (excluding anchored cards)
    const otherCards = gameCards.filter(card => 
        card !== featureCard && card !== reviewNoteCard
    );
    
    // Fisher-Yates shuffle algorithm for better randomization
    for (let i = otherCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherCards[i], otherCards[j]] = [otherCards[j], otherCards[i]];
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add review note card at the top
    if (reviewNoteCard) {
        fragment.appendChild(reviewNoteCard);
    }
    
    // Add randomized cards in the middle
    otherCards.forEach(card => fragment.appendChild(card));
    
    // Add feature card at the bottom
    if (featureCard) {
        fragment.appendChild(featureCard);
    }
    
    // Clear and append all at once
    content.innerHTML = '';
    content.appendChild(fragment);
    
    // Re-trigger animations
    requestAnimationFrame(() => {
        document.querySelectorAll('.card-component').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    });
}

// ========================================
// Event Handlers Setup
// ========================================

/**
 * Setup all event listeners following design system guidelines
 */
function setupEventListeners() {
    // Smooth scrolling with debounce
    const content = document.querySelector('.content');
    let scrollTimeout;
    
    if (content) {
        content.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                // Track scroll end if needed
                if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
                    const scrollPercentage = Math.round(
                        (content.scrollTop / (content.scrollHeight - content.clientHeight)) * 100
                    );
                    
                    if (scrollPercentage > 90) {
                        mixpanel.track('Content Scrolled to Bottom', {
                            'timestamp': new Date().toISOString()
                        });
                    }
                }
            }, CONFIG.DEBOUNCE_DELAY);
        }, { passive: true });
    }
    
    // Button interactions with proper touch feedback
    if (CONFIG.TOUCH_FEEDBACK) {
        setupButtonInteractions();
    }
    
    // Navigation interactions
    setupNavigationInteractions();
}

/**
 * Setup button touch and mouse interactions
 * Following design system button specifications
 */
function setupButtonInteractions() {
    const buttons = document.querySelectorAll('[class*="button-"]');
    
    buttons.forEach(btn => {
        // Touch events with passive flag for better performance
        btn.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.98)';
            this.dataset.touched = 'true';
        }, { passive: true });
        
        btn.addEventListener('touchend', function(e) {
            this.style.transform = '';
            delete this.dataset.touched;
        }, { passive: true });
        
        btn.addEventListener('touchcancel', function(e) {
            this.style.transform = '';
            delete this.dataset.touched;
        }, { passive: true });
        
        // Mouse events for desktop
        btn.addEventListener('mousedown', function(e) {
            if (!this.dataset.touched) {
                this.style.transform = 'scale(0.98)';
            }
        });
        
        btn.addEventListener('mouseup', function(e) {
            if (!this.dataset.touched) {
                this.style.transform = '';
            }
        });
        
        btn.addEventListener('mouseleave', function(e) {
            if (!this.dataset.touched) {
                this.style.transform = '';
            }
        });
    });
}

/**
 * Setup navigation item interactions
 */
function setupNavigationInteractions() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Haptic feedback if available (for mobile devices)
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        });
    });
}

// ========================================
// Performance Monitoring
// ========================================

/**
 * Monitor and track performance metrics
 */
function monitorPerformance() {
    if ('PerformanceObserver' in window) {
        // Monitor Largest Contentful Paint
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
                    mixpanel.track('Performance Metric', {
                        'metric': 'LCP',
                        'value': lastEntry.renderTime || lastEntry.loadTime,
                        'timestamp': new Date().toISOString()
                    });
                }
            });
            
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            console.warn('LCP Observer not supported');
        }
        
        // Monitor First Input Delay
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
                        mixpanel.track('Performance Metric', {
                            'metric': 'FID',
                            'value': entry.processingStart - entry.startTime,
                            'timestamp': new Date().toISOString()
                        });
                    }
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.warn('FID Observer not supported');
        }
    }
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize the application
 */
function initializeApp() {
    // Track page view
    trackPageView();
    
    // Randomize game cards
    randomizeGameCards();
    
    // Setup event listeners
    setupEventListeners();
    
    // Monitor performance
    monitorPerformance();
    
    // Track app initialization
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        mixpanel.track('App Initialized', {
            'timestamp': new Date().toISOString(),
            'page_load_time': performance.now(),
            'cards_randomized': CONFIG.RANDOMIZE_CARDS,
            'touch_feedback_enabled': CONFIG.TOUCH_FEEDBACK
        });
        
        // Set super properties for all future events
        mixpanel.register({
            'app_version': 'v1.0.0',
            'design_system_version': 'v4.0'
        });
    }
}

// ========================================
// DOM Content Loaded
// ========================================

/**
 * Wait for DOM to be fully loaded before initialization
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// ========================================
// Error Handling
// ========================================

/**
 * Global error handler for tracking
 */
window.addEventListener('error', function(event) {
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        mixpanel.track('JavaScript Error', {
            'message': event.message,
            'source': event.filename,
            'line': event.lineno,
            'column': event.colno,
            'error': event.error?.toString(),
            'timestamp': new Date().toISOString()
        });
    }
});

// ========================================
// Visibility Change Tracking
// ========================================

/**
 * Track when user leaves/returns to the page
 */
document.addEventListener('visibilitychange', function() {
    if (CONFIG.MIXPANEL_ENABLED && typeof mixpanel !== 'undefined') {
        mixpanel.track('Visibility Changed', {
            'visible': !document.hidden,
            'timestamp': new Date().toISOString()
        });
    }
});

// ========================================
// Export for testing (if needed)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        trackSmartReviewNote,
        trackSmartPlanner,
        trackSmartTutor,
        trackFeatureRecommendation,
        trackNavigation,
        trackPageView,
        randomizeGameCards,
        setupEventListeners,
        initializeApp
    };
}