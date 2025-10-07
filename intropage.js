// Configuration object with all settings centralized
const CONFIG = {
    parallax: {
        speedDesktop: -0.4,
        speedMobile: -0.55,
        breakpoint: 768
    },
    fade: {
        heroStart: 0.2,
        heroEnd: 0.7,
        clueboxTriggerDesktop: 0.5,
        clueboxTriggerMobile: 0.6
    },
    animation: {
        messageDelay: 1500,
        resizeDebounce: 250,
        scrollThrottle: 16 // ~60fps
    },
    validation: {
        correctPassword: 'Valhalla Meridius',
        nextPage: 'carouselpage.html'
    },
    messages: {
        correct: { text: 'That is the name!!', color: '#7dd3c0' },
        empty: { text: 'Where is the name?', color: '#bababaff' },
        incorrect: { text: 'That is not the name...', color: '#ff6b6b' }
    }
};

// State management
const state = {
    isScrolling: false,
    lastScrollY: 0,
    rafId: null,
    resizeTimer: null,
    clueboxVisible: false,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
};

// DOM element cache with error handling
const elements = {};

// Initialize DOM references with error handling
function initializeElements() {
    const selectors = {
        parallax: '.background-image',
        hero: '.hero-section',
        clueboxContainer: '.cluebox-container',
        cluebox: '.cluebox',
        input: '#passwordInput',
        btn: '#submitBtn',
        message: '#message'
    };

    for (const [key, selector] of Object.entries(selectors)) {
        elements[key] = document.querySelector(selector);
        if (!elements[key]) {
            console.error(`Element not found: ${selector}`);
        }
    }
    
    return Object.values(elements).every(el => el !== null);
}

// Utility functions
const utils = {
    lerp: (start, end, factor) => start + (end - start) * factor,
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    getParallaxSpeed: () => state.viewportWidth > CONFIG.parallax.breakpoint 
        ? CONFIG.parallax.speedDesktop 
        : CONFIG.parallax.speedMobile,
    getClueboxTrigger: () => state.viewportWidth <= CONFIG.parallax.breakpoint 
        ? CONFIG.fade.clueboxTriggerMobile 
        : CONFIG.fade.clueboxTriggerDesktop
};

// Smooth scroll to cluebox when page loads with hash
if (window.location.hash === '#riddle') {
    setTimeout(() => {
        elements.clueboxContainer?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
}

// Optimized parallax with frame skipping for better performance
let parallaxFrame = 0;
function updateParallax(scrollY) {
    if (!elements.parallax) return;
    
    // Skip every other frame on low-end devices
    if (parallaxFrame++ % 2 === 0 && window.devicePixelRatio < 2) {
        return;
    }
    
    const speed = utils.getParallaxSpeed();
    
    if (state.viewportWidth > CONFIG.parallax.breakpoint) {
        // Desktop: vertical parallax
        const translateY = Math.round(scrollY * speed * 10) / 10; // Round to 0.1px
        elements.parallax.style.transform = `translate3d(0, ${translateY}px, 0)`;
    } else {
        // Mobile: horizontal parallax
        const maxTranslate = -state.viewportWidth;
        const translateX = Math.round(utils.clamp(scrollY * speed, maxTranslate, 0) * 10) / 10;
        elements.parallax.style.transform = `translate3d(${translateX}px, 0, 0)`;
    }
}

function updateHeroOpacity(scrollY) {
    if (!elements.hero) return;
    
    const heroHeight = elements.hero.offsetHeight;
    const fadeStart = heroHeight * CONFIG.fade.heroStart;
    const fadeEnd = heroHeight * CONFIG.fade.heroEnd;
    
    let opacity = 1;
    if (scrollY > fadeStart && scrollY < fadeEnd) {
        opacity = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
    } else if (scrollY >= fadeEnd) {
        opacity = 0;
    }
    
    elements.hero.style.opacity = opacity;
}

function updateClueboxVisibility(scrollY) {
    if (!elements.clueboxContainer || !elements.cluebox) return;
    
    const triggerRatio = utils.getClueboxTrigger();
    const triggerPoint = elements.clueboxContainer.offsetTop - state.viewportHeight * triggerRatio;
    const shouldShow = scrollY > triggerPoint;
    
    // Only update if visibility changed
    if (shouldShow !== state.clueboxVisible) {
        state.clueboxVisible = shouldShow;
        elements.clueboxContainer.style.opacity = shouldShow ? '1' : '0';
        elements.cluebox.classList.toggle('visible', shouldShow);
    }
}

// Main scroll update function
function updateScroll() {
    const scrollY = window.pageYOffset;
    state.lastScrollY = scrollY;
    
    updateParallax(scrollY);
    updateHeroOpacity(scrollY);
    updateClueboxVisibility(scrollY);
    
    state.isScrolling = false;
}

// Optimized scroll handler with RAF
function handleScroll() {
    if (!state.isScrolling) {
        state.isScrolling = true;
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
        }
        state.rafId = requestAnimationFrame(updateScroll);
    }
}

// Handle viewport changes
function handleResize() {
    clearTimeout(state.resizeTimer);
    state.resizeTimer = setTimeout(() => {
        state.viewportWidth = window.innerWidth;
        state.viewportHeight = window.innerHeight;
        updateScroll(); // Recalculate with new viewport
    }, CONFIG.animation.resizeDebounce);
}

// Password validation with improved UX
function validatePassword() {
    if (!elements.input || !elements.message) return;
    
    const password = elements.input.value.trim();
    const messageType = password === CONFIG.validation.correctPassword ? 'correct'
        : password === '' ? 'empty' 
        : 'incorrect';
    
    const config = CONFIG.messages[messageType];
    
    // Update message with animation
    elements.message.style.color = config.color;
    elements.message.textContent = config.text;
    elements.message.classList.add('show');
    
    if (messageType === 'correct') {
        elements.input.disabled = true;
        elements.btn.disabled = true;
        setTimeout(() => {
            window.location.href = CONFIG.validation.nextPage;
        }, CONFIG.animation.messageDelay);
    }
}

// Touch handling for iOS elastic scroll prevention
let touchStartY = 0;
const shouldPreventOverscroll = true;

function handleTouchStart(e) {
    if (!shouldPreventOverscroll) return;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    if (!shouldPreventOverscroll) return;
    
    const scrollY = window.pageYOffset;
    const touchY = e.touches[0].clientY;
    const maxScroll = document.documentElement.scrollHeight - state.viewportHeight;
    
    const isOverscrolling = 
        (scrollY <= 0 && touchY > touchStartY) || // Top overscroll
        (scrollY >= maxScroll && touchY < touchStartY); // Bottom overscroll
    
    if (isOverscrolling) {
        e.preventDefault();
    }
}

// Event listeners setup
function setupEventListeners() {
    // Scroll handling
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Resize handling
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    
    // Touch handling for iOS
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    // Password validation
    if (elements.btn) {
        elements.btn.addEventListener('click', validatePassword);
    }
    
    if (elements.input) {
        elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                validatePassword();
            }
        });
    }
}

// Initialize everything when DOM is ready
function initialize() {
    if (!initializeElements()) {
        console.error('Failed to initialize some elements');
        return;
    }
    
    setupEventListeners();
    
    // Initial update
    updateScroll();
    
    // Prefetch next page for better UX
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = CONFIG.validation.nextPage;
    document.head.appendChild(link);
}

// Performance monitoring in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function measureFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
            console.log(`FPS: ${Math.round(frameCount * 1000 / (currentTime - lastTime))}`);
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
    }
    
    measureFPS();
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
    }
    if (state.resizeTimer) {
        clearTimeout(state.resizeTimer);
    }
});