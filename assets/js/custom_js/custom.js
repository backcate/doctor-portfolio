// counter
(function($) {
    $.fn.counterUp = function(options) {
        const settings = $.extend({
            duration: 2000,
            delay: 10,
            formatter: null
        }, options);

        return this.each(function() {
            const $this = $(this);
            const target = parseInt($this.data('target'));
            const increment = target / (settings.duration / settings.delay);
            let current = 0;

            const formatNumber = (num) => {
                if (settings.formatter) {
                    return settings.formatter(num);
                }
                return num.toLocaleString();
            };

            const updateCounter = () => {
                current += increment;
                if (current >= target) {
                    $this.text(formatNumber(target));
                    return;
                }
                
                $this.text(formatNumber(Math.floor(current)));
                setTimeout(updateCounter, settings.delay);
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(this);
        });
    };
})(jQuery);

$(document).ready(function() {
    $('.counter').counterUp({
        duration: 2000,
        formatter: (num) => `${num.toLocaleString()}`
    });
});

// Swiper
class Swiper {
    constructor(container) {
        this.container = container;
        this.wrapper = container.querySelector('.swiper-wrapper');
        this.slides = Array.from(container.querySelectorAll('.swiper-slide'));
        this.pagination = container.querySelector('.swiper-pagination');
        this.prevButton = container.querySelector('.swiper-button-prev');
        this.nextButton = container.querySelector('.swiper-button-next');
        
        this.currentIndex = 0;
        this.slidesPerView = this.getSlidesPerView();
        this.originalSlides = [...this.slides];
        this.totalOriginalSlides = this.originalSlides.length;
        this.isAnimating = false;
        this.touchStartX = 0;
        this.touchMoveX = 0;
        
        this.setupClones();
        this.init();
        this.bindEvents();
        this.startAutoplay();
    }
    
    setupClones() {
        const clonesCount = Math.ceil(3 * this.slidesPerView);
        
        for (let i = 0; i < clonesCount; i++) {
            const clone = this.originalSlides[i % this.totalOriginalSlides].cloneNode(true);
            clone.classList.add('clone');
            this.wrapper.appendChild(clone);
        }
        
        for (let i = this.totalOriginalSlides - 1; i >= Math.max(0, this.totalOriginalSlides - clonesCount); i--) {
            const clone = this.originalSlides[i].cloneNode(true);
            clone.classList.add('clone');
            this.wrapper.insertBefore(clone, this.wrapper.firstChild);
        }
        
        this.slides = Array.from(this.wrapper.querySelectorAll('.swiper-slide'));
        this.currentIndex = clonesCount;
        this.updateSlidePosition(false);
    }
    
    init() {
        for (let i = 0; i < this.totalOriginalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('pagination-dot');
            if (i === 0) dot.classList.add('active');
            this.pagination.appendChild(dot);
            
            dot.addEventListener('click', () => {
                if (!this.isAnimating) {
                    this.goToSlide(i);
                }
            });
        }
        
        this.updateActiveStates();
    }

    handleTransitionEnd = () => {
        const totalSlides = this.slides.length;
        
        const realIndex = this.getRealIndex();
        
        if (this.currentIndex >= totalSlides - this.slidesPerView) {
            this.wrapper.classList.add('no-transition');
            this.currentIndex = this.slidesPerView + realIndex;
            this.updateSlidePosition(false);
            requestAnimationFrame(() => {
                this.wrapper.classList.remove('no-transition');
            });
        }

        else if (this.currentIndex < this.slidesPerView) {
            this.wrapper.classList.add('no-transition');
            this.currentIndex = totalSlides - (2 * this.slidesPerView) + realIndex;
            this.updateSlidePosition(false);
            requestAnimationFrame(() => {
                this.wrapper.classList.remove('no-transition');
            });
        }
        
        this.isAnimating = false;
    }
    
    getRealIndex() {
        return (this.currentIndex - this.slidesPerView + this.totalOriginalSlides) % this.totalOriginalSlides;
    }
    
    bindEvents() {
        this.prevButton.addEventListener('click', () => this.prev());
        this.nextButton.addEventListener('click', () => this.next());
        this.wrapper.addEventListener('transitionend', this.handleTransitionEnd);
        
        let touchStartTime;
        let touchEndTime;
        
        this.wrapper.addEventListener('touchstart', (e) => {
            if (this.isAnimating) return;
            this.touchStartX = e.touches[0].clientX;
            touchStartTime = new Date().getTime();
        });
        
        this.wrapper.addEventListener('touchend', (e) => {
            if (this.isAnimating) return;
            touchEndTime = new Date().getTime();
            const touchDuration = touchEndTime - touchStartTime;
            
            if (touchDuration < 250 && Math.abs(this.touchMoveX - this.touchStartX) > 30) {
                if (this.touchMoveX < this.touchStartX) this.next();
                else this.prev();
            }
        });
        
        this.wrapper.addEventListener('touchmove', (e) => {
            if (this.isAnimating) return;
            this.touchMoveX = e.touches[0].clientX;
        });
        
        window.addEventListener('resize', () => {
            this.slidesPerView = this.getSlidesPerView();
            this.updateSlidePosition(false);
        });
    }
    
    updateActiveStates() {
        const realIndex = this.getRealIndex();
        
        this.slides.forEach((slide, index) => {
            const isActive = index >= this.currentIndex && 
                           index < this.currentIndex + this.slidesPerView;
            slide.classList.toggle('active', isActive);
        });
        
        const dots = this.pagination.querySelectorAll('.pagination-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === realIndex);
        });
    }
    
    updateSlidePosition(animate = true) {
        if (animate) {
            this.isAnimating = true;
        }
        
        const slideWidth = 100 / this.slidesPerView;
        this.slides.forEach(slide => {
            slide.style.flex = `0 0 ${slideWidth}%`;
        });
        
        const offset = -this.currentIndex * slideWidth;
        this.wrapper.style.transform = `translateX(${offset}%)`;
        this.updateActiveStates();
    }
    
    next() {
        if (this.isAnimating) return;
        this.currentIndex++;
        this.updateSlidePosition();
    }
    
    prev() {
        if (this.isAnimating) return;
        this.currentIndex--;
        this.updateSlidePosition();
    }
    
    goToSlide(index) {
        if (this.isAnimating) return;
        const realIndex = this.getRealIndex();
        const diff = index - realIndex;
        this.currentIndex += diff;
        this.updateSlidePosition();
    }
    
    startAutoplay() {
        setInterval(() => {
            if (!this.isAnimating) {
                this.next();
            }
        }, 5000);
    }
    
    getSlidesPerView() {
        if (window.innerWidth >= 1024) return 3;
        if (window.innerWidth >= 768) return 2;
        return 1;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const swiperContainer = document.querySelector('.swiper-container');
    new Swiper(swiperContainer);
});
