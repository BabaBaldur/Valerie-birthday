const BirthdayCarousel = (() => {
    // State management
    const state = {
        isTransitioning: false,
        currentView: 'carousel',
        currentItem: 2,
        wheelRotation: {
            current: 0,
            target: 0,
            velocity: 0,
            isInteracting: false,
            animationFrame: null
        }
    };

    // DOM elements cache
    const elements = {
        carousel: null,
        listHTML: null,
        blurBackground: null,
        nextButton: null,
        prevButton: null,
        backButton: null,
        seeMoreButtons: null,
        continueButtons: null,
        backButtons: null,
        slider: null,
        banner: null,
        blurBackgroundAlt: null
    };

    // Constants
    const TRANSITION_DELAY = 700;
    const ROTATION_SPEED = 0.15;
    const INERTIA_DAMPING = 0.95;
    const SMOOTH_FACTOR = 0.1;

    // Initialize elements
    function initElements() {
        elements.carousel = document.querySelector('.carousel');
        elements.listHTML = document.querySelector('.carousel .list');
        elements.blurBackground = document.querySelector('.blur-background');
        elements.nextButton = document.getElementById('next');
        elements.prevButton = document.getElementById('prev');
        elements.backButton = document.getElementById('back');
        elements.seeMoreButtons = document.querySelectorAll('.seeMore');
        elements.continueButtons = document.querySelectorAll('.continue-btn');
        elements.backButtons = document.querySelectorAll('.back-btn');
        elements.blurBackgroundAlt = document.querySelector('.blur-background-alt');
    }

    let currentBgLayer = 'primary'; // Track which layer is active

    function updateBlurBackgroundCrossfade(forceSrc = null) {
        if (!elements.blurBackground || !elements.blurBackgroundAlt) {
            // Fallback to simple update if alt layer doesn't exist
            updateBlurBackgroundCrossfade(forceSrc);
            return;
        }
        
        let newSrc;
        if (forceSrc) {
            newSrc = forceSrc;
        } else {
            const centerItem = document.querySelector('.carousel .list .item:nth-child(2)');
            if (!centerItem) return;
            const img = centerItem.querySelector('img');
            if (!img || !img.src) return;
            newSrc = img.src;
        }
        
        // Determine which layer to update
        if (currentBgLayer === 'primary') {
            // Set new image on alt layer
            elements.blurBackgroundAlt.style.backgroundImage = `url('${newSrc}')`;
            // Fade in alt, fade out primary
            elements.blurBackgroundAlt.style.opacity = '0.3';
            elements.blurBackground.style.opacity = '0';
            currentBgLayer = 'alt';
        } else {
            // Set new image on primary layer
            elements.blurBackground.style.backgroundImage = `url('${newSrc}')`;
            // Fade in primary, fade out alt
            elements.blurBackground.style.opacity = '0.3';
            elements.blurBackgroundAlt.style.opacity = '0';
            currentBgLayer = 'primary';
        }
    }

    // Show slider with animation
    function showSlider(type) {
        if (state.isTransitioning) return;
        
        state.isTransitioning = true;
        elements.nextButton.style.pointerEvents = 'none';
        elements.prevButton.style.pointerEvents = 'none';

        elements.carousel.classList.remove('next', 'prev');
        const items = document.querySelectorAll('.carousel .list .item');
        
        if (type === 'next') {
            elements.listHTML.appendChild(items[0]);
            elements.carousel.classList.add('next');
        } else {
            elements.listHTML.prepend(items[items.length - 1]);
            elements.carousel.classList.add('prev');
        }
        
        setTimeout(() => {
            state.isTransitioning = false;
            elements.nextButton.style.pointerEvents = 'auto';
            elements.prevButton.style.pointerEvents = 'auto';
            updateBlurBackgroundCrossfade();
            updateHash();
        }, TRANSITION_DELAY);
    }

    // Update URL hash based on current state
    function updateHash() {
        const centerItem = document.querySelector('.carousel .list .item:nth-child(2)');
        const itemNumber = centerItem?.getAttribute('data-item') || '1';
        
        if (state.currentView === 'carousel') {
            window.location.hash = `carousel-${itemNumber}`;
        } else if (state.currentView === 'detail') {
            window.location.hash = `detail-${itemNumber}`;
        } else if (state.currentView === 'wheel') {
            window.location.hash = 'wheel';
        } else if (state.currentView === 'poetry') {
            window.location.hash = 'poetry';
        }
    }

    // Navigate to specific item
    function navigateToItem(targetItemNumber) {
        const items = document.querySelectorAll('.carousel .list .item');
        
        for (let i = 0; i < items.length; i++) {
            const itemData = items[i].getAttribute('data-item');
            if (itemData === targetItemNumber) {
                const rotations = i - 1;
                
                for (let j = 0; j < Math.abs(rotations); j++) {
                    if (rotations > 0) {
                        elements.listHTML.appendChild(elements.listHTML.querySelector('.item'));
                    } else {
                        const allItems = elements.listHTML.querySelectorAll('.item');
                        elements.listHTML.prepend(allItems[allItems.length - 1]);
                    }
                }
                break;
            }
        }
        updateBlurBackgroundCrossfade();
    }

    // Show detail view
    function showDetail() {
        state.currentView = 'detail';
        elements.carousel.classList.remove('next', 'prev');
        elements.carousel.classList.add('showDetail');
        updateHash();
    }

    // Hide detail view
    function hideDetail() {
        state.currentView = 'carousel';
        elements.carousel.classList.remove('showDetail');
        updateHash();
    }

    // Show wheel view
    function showWheel() {
        state.currentView = 'wheel';
        elements.carousel.classList.remove('showDetail');
        elements.carousel.classList.add('showImage1wheel');
        updateBlurBackgroundCrossfade('pageimages/image1.PNG');
        updateHash();
        
        setTimeout(() => {
            elements.slider = document.querySelector('.banner .slider');
            elements.banner = document.querySelector('.banner');
            if (elements.slider) {
                resetWheelRotation();
                initWheelGestures();
            }
        }, 500);
    }

    // Show poetry view
    function showPoetry() {
        state.currentView = 'poetry';
        elements.carousel.classList.remove('showDetail');
        elements.carousel.classList.add('showPoetryScroll');
        updateBlurBackgroundCrossfade('pageimages/poemimage.png');
        updateHash();

        // Gradually fade in the fixed background
        setTimeout(() => {
            const fixedBg = document.querySelector('.poetryscrollpage .fixed-background');
            if (fixedBg) {
                fixedBg.style.display = 'block'; // Ensure it's displayed
            }
        }, 100);
    }

    // Reset wheel rotation
    function resetWheelRotation() {
        state.wheelRotation.current = 0;
        state.wheelRotation.target = 0;
        state.wheelRotation.velocity = 0;
        if (elements.slider) {
            elements.slider.style.animation = 'none';
            elements.slider.style.transform = 'translateX(-50%) perspective(1000px) translateY(20%) rotateY(0deg)';
        }
    }

    // Initialize wheel gestures
    function initWheelGestures() {
        if (!elements.banner || !elements.slider) return;
        
        cleanupWheelListeners();
        
        const handlers = {
            wheel: handleWheel,
            touchstart: handleTouchStart,
            touchmove: handleTouchMove,
            touchend: handleTouchEnd
        };
        
        elements.banner._handlers = handlers;
        elements.banner._touchData = { lastY: 0, lastX: 0, lastTime: 0 };
        
        elements.banner.addEventListener('wheel', handlers.wheel, { passive: false });
        elements.banner.addEventListener('touchstart', handlers.touchstart);
        elements.banner.addEventListener('touchmove', handlers.touchmove, { passive: false });
        elements.banner.addEventListener('touchend', handlers.touchend);
    }

    // Clean up wheel listeners
    function cleanupWheelListeners() {
        if (!elements.banner || !elements.banner._handlers) return;
        
        const h = elements.banner._handlers;
        elements.banner.removeEventListener('wheel', h.wheel);
        elements.banner.removeEventListener('touchstart', h.touchstart);
        elements.banner.removeEventListener('touchmove', h.touchmove);
        elements.banner.removeEventListener('touchend', h.touchend);
    }

    // Wheel handler
    function handleWheel(e) {
        if (!elements.carousel.classList.contains('showImage1wheel')) return;
        e.preventDefault();
        
        const delta = e.deltaY || e.deltaX;
        state.wheelRotation.target -= delta * ROTATION_SPEED;
        state.wheelRotation.velocity = -delta * 0.3;
        state.wheelRotation.isInteracting = true;
        
        updateWheelRotation();
    }

    // Touch handlers
    function handleTouchStart(e) {
        if (!elements.carousel.classList.contains('showImage1wheel')) return;
        
        state.wheelRotation.isInteracting = true;
        elements.banner._touchData.lastY = e.touches[0].clientY;
        elements.banner._touchData.lastX = e.touches[0].clientX;
        elements.banner._touchData.lastTime = Date.now();
        state.wheelRotation.velocity = 0;
    }

    function handleTouchMove(e) {
        if (!elements.carousel.classList.contains('showImage1wheel')) return;
        e.preventDefault();
        
        const touch = elements.banner._touchData;
        const currentX = e.touches[0].clientX;
        const currentTime = Date.now();
        
        const deltaX = currentX - touch.lastX;
        const deltaTime = currentTime - touch.lastTime;
        
        state.wheelRotation.target += deltaX * 0.5;
        state.wheelRotation.velocity = (deltaX / deltaTime) * 16;
        
        touch.lastX = currentX;
        touch.lastTime = currentTime;
        
        updateWheelRotation();
    }

    function handleTouchEnd() {
        state.wheelRotation.isInteracting = false;
        applyInertia();
    }

    // Update wheel rotation
    function updateWheelRotation() {
        const rot = state.wheelRotation;
        rot.current += (rot.target - rot.current) * SMOOTH_FACTOR;
        
        if (elements.slider) {
            elements.slider.style.transform = 
                `translateX(-50%) perspective(1000px) translateY(20%) rotateY(${rot.current}deg)`;
        }
        
        if (Math.abs(rot.target - rot.current) > 0.1 || rot.isInteracting) {
            cancelAnimationFrame(rot.animationFrame);
            rot.animationFrame = requestAnimationFrame(updateWheelRotation);
        }
    }

    // Apply inertia to wheel
    function applyInertia() {
        const rot = state.wheelRotation;
        
        if (Math.abs(rot.velocity) > 0.1) {
            rot.target += rot.velocity;
            rot.velocity *= INERTIA_DAMPING;
            updateWheelRotation();
            rot.animationFrame = requestAnimationFrame(applyInertia);
        }
    }

    // Restore state from hash
    function restoreFromHash() {
        const hash = window.location.hash.substring(1);
        if (!hash) return;
        
        if (hash.startsWith('carousel-')) {
            const itemNumber = hash.split('-')[1];
            navigateToItem(itemNumber);
            
        } else if (hash.startsWith('detail-')) {
            const itemNumber = hash.split('-')[1];
            navigateToItem(itemNumber);
            setTimeout(() => showDetail(), 100);
            
        } else if (hash === 'wheel') {
            navigateToItem('2');
            setTimeout(() => showWheel(), 100);
            
        } else if (hash === 'poetry') {
            navigateToItem('3');
            setTimeout(() => showPoetry(), 100);
        }
    }

    // Event listeners setup
    function setupEventListeners() {
        elements.nextButton.addEventListener('click', () => showSlider('next'));
        elements.prevButton.addEventListener('click', () => showSlider('prev'));
        
        elements.seeMoreButtons.forEach(button => {
            button.addEventListener('click', () => showDetail());
        });
        
        elements.backButton.addEventListener('click', () => hideDetail());
        
        elements.continueButtons.forEach(button => {
            button.addEventListener('click', () => {
                const target = button.getAttribute('data-target');
                if (target === 'wheel') showWheel();
                else if (target === 'poetry') showPoetry();
            });
        });
        
        elements.backButtons.forEach(button => {
            button.addEventListener('click', () => {
                const from = button.getAttribute('data-from');
                
                if (from === 'wheel') {
                    elements.carousel.classList.remove('showImage1wheel');
                    cleanupWheelListeners();
                    navigateToItem('2');
                    setTimeout(() => showDetail(), 100);
                    
                } else if (from === 'poetry') {
                    // Background transitions are handled via CSS
                    elements.carousel.classList.remove('showPoetryScroll');
                    navigateToItem('3');
                    setTimeout(() => showDetail(), 100);
                }
            });
        });
    }

    // Initialize the carousel
    function init() {
        initElements();
        setupEventListeners();
        restoreFromHash();
        updateBlurBackgroundCrossfade();
    }

    // Public API
    return {
        init,
        showSlider,
        showDetail,
        showWheel,
        showPoetry
    };
})();

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    BirthdayCarousel.init();
});

// Handle page visibility changes to pause animations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        const slider = document.querySelector('.banner .slider.auto-rotate');
        if (slider) {
            slider.classList.remove('auto-rotate');
        }
    }
});