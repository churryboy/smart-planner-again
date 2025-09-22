// Mixpanel Tracking Functions
function trackSmartReviewNote() {
    mixpanel.track('Smart Review Note Clicked', {
        'feature': 'smart_review_note',
        'action': 'button_click',
        'timestamp': new Date().toISOString()
    });
    
    // Redirect to Smart Review Note
    window.open('https://review-note.onrender.com/', '_blank');
}

function trackSmartPlanner() {
    mixpanel.track('Smart Planner Clicked', {
        'feature': 'smart_Planner',
        'action': 'button_click',
        'timestamp': new Date().toISOString()
    });
    
    // Redirect to Smart Planner
    window.open('https://forms.gle/F1kfEmfbY2N5HoDG8', '_blank');
}

function trackSmartTutor() {
    mixpanel.track('Smart Tutor Clicked', {
        'feature': 'smart_Tutor',
        'action': 'button_click',
        'timestamp': new Date().toISOString()
    });
    
    // Redirect to Smart Tutor
    window.open('https://forms.gle/F1kfEmfbY2N5HoDG8', '_blank');
}

function trackFeatureRecommendation() {
    mixpanel.track('Feature Recommendation Clicked', {
        'feature': 'feature_recommendation',
        'action': 'button_click',
        'timestamp': new Date().toISOString()
    });
    
    // Redirect to Google Forms
    window.open('https://forms.gle/zsqajdXUEjKBoVHE6', '_blank');
}

function trackNavigation(section) {
    mixpanel.track('Navigation Clicked', {
        'section': section,
        'action': 'navigation_click',
        'timestamp': new Date().toISOString()
    });
}

// Track page view on load
function trackPageView() {
    mixpanel.track('Page View', {
        'page': 'main',
        'timestamp': new Date().toISOString(),
        'user_agent': navigator.userAgent,
        'screen_resolution': screen.width + 'x' + screen.height
    });
}

// Randomize game cards while keeping "신기능 제안" at bottom
function randomizeGameCards() {
    const content = document.querySelector('.content');
    const gameCards = Array.from(content.querySelectorAll('.game-card'));
    
    // Find the "신기능 제안" card
    const featureCard = gameCards.find(card => 
        card.querySelector('.game-title').textContent.trim() === '신기능 제안'
    );
    
    // Get all other cards (excluding "신기능 제안")
    const otherCards = gameCards.filter(card => 
        card.querySelector('.game-title').textContent.trim() !== '신기능 제안'
    );
    
    // Randomize the other cards
    for (let i = otherCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherCards[i], otherCards[j]] = [otherCards[j], otherCards[i]];
    }
    
    // Clear the content
    content.innerHTML = '';
    
    // Add randomized cards first, then the feature card at the bottom
    otherCards.forEach(card => content.appendChild(card));
    if (featureCard) {
        content.appendChild(featureCard);
    }
}

// Add smooth scrolling
let isScrolling;

// Add touch interactions and event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Randomize game cards on page load
    randomizeGameCards();
    
    // Track page view
    trackPageView();
    
    // Re-setup event listeners after randomization
    setupEventListeners();
    
    // Track user engagement
    mixpanel.track('App Loaded', {
        'timestamp': new Date().toISOString(),
        'page_load_time': performance.now()
    });
});

function setupEventListeners() {
    const content = document.querySelector('.content');
    
    if (content) {
        content.addEventListener('scroll', function() {
            window.clearTimeout(isScrolling);
            
            isScrolling = setTimeout(function() {
                // Scrolling has stopped
            }, 66);
        }, false);
    }
    
    // Challenge button interactions with passive event listeners
    document.querySelectorAll('.challenge-btn').forEach(btn => {
        // Use passive: true for touch events to improve performance
        btn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        btn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        }, { passive: true });
        
        // Mouse events don't need passive flag
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Add navigation interactions
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}
