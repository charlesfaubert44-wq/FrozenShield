// Northwest Territories Ice Crystals Animation
// Inspired by the aurora borealis, diamond dust, and frozen landscapes of the NWT
class IceCrystalsAnimation {
    constructor() {
        this.canvas = document.getElementById('codeCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();

        // Aurora Borealis color palette - inspired by Northwest Territories night sky
        this.auroraColors = [
            { r: 0, g: 255, b: 150, name: 'Northern Green' },      // Aurora green
            { r: 100, g: 220, b: 255, name: 'Glacial Blue' },      // Ice blue
            { r: 150, g: 150, b: 255, name: 'Arctic Purple' },     // Aurora purple
            { r: 0, g: 255, b: 200, name: 'Tundra Cyan' },         // Cyan
            { r: 200, g: 240, b: 255, name: 'Diamond White' },     // Ice white
            { r: 80, g: 200, b: 255, name: 'Midnight Blue' }       // Deep blue
        ];

        // Initialize particle systems
        this.crystals = [];
        this.diamondDust = [];
        this.shimmerParticles = [];
        this.time = 0;

        // Create ice crystal formations
        this.initializeCrystals();
        this.initializeDiamondDust();
        this.initializeShimmer();

        // Start animation loop
        this.animate();
        window.addEventListener('resize', () => this.handleResize());
    }

    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleResize() {
        this.setCanvasSize();
        this.initializeCrystals();
        this.initializeDiamondDust();
        this.initializeShimmer();
    }

    initializeCrystals() {
        this.crystals = [];
        const numCrystals = Math.floor((this.canvas.width * this.canvas.height) / 40000);

        for (let i = 0; i < numCrystals; i++) {
            this.crystals.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 15 + Math.random() * 35,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01,
                opacity: 0.3 + Math.random() * 0.4,
                complexity: Math.floor(Math.random() * 3), // 0: simple, 1: detailed, 2: complex
                color: this.auroraColors[Math.floor(Math.random() * this.auroraColors.length)],
                glowIntensity: 0.5 + Math.random() * 0.5,
                driftX: (Math.random() - 0.5) * 0.3,
                driftY: Math.random() * 0.2 + 0.1,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03
            });
        }
    }

    initializeDiamondDust() {
        // Diamond dust - tiny ice particles suspended in arctic air
        this.diamondDust = [];
        const numParticles = Math.floor((this.canvas.width * this.canvas.height) / 8000);

        for (let i = 0; i < numParticles; i++) {
            this.diamondDust.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 1 + Math.random() * 2,
                speed: 0.1 + Math.random() * 0.5,
                opacity: 0.3 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.05 + Math.random() * 0.1,
                drift: (Math.random() - 0.5) * 0.2
            });
        }
    }

    initializeShimmer() {
        // Shimmer particles for magical aurora-like sparkle effect
        this.shimmerParticles = [];
        const numShimmers = 30;

        for (let i = 0; i < numShimmers; i++) {
            this.shimmerParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                life: Math.random(),
                maxLife: 60 + Math.random() * 120,
                size: 2 + Math.random() * 4,
                color: this.auroraColors[Math.floor(Math.random() * this.auroraColors.length)]
            });
        }
    }

    drawHexagonalCrystal(x, y, size, rotation, complexity, color, opacity, glowIntensity) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        // Create radial gradient for aurora-like glow
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * glowIntensity})`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        // Draw outer glow
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Configure crystal appearance
        this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.15})`;
        this.ctx.lineWidth = 1.5;

        // Draw main hexagonal structure
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const pointX = Math.cos(angle) * size;
            const pointY = Math.sin(angle) * size;
            if (i === 0) {
                this.ctx.moveTo(pointX, pointY);
            } else {
                this.ctx.lineTo(pointX, pointY);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Add complexity - dendrite patterns (like real ice crystals)
        if (complexity >= 1) {
            // Inner hexagon
            const innerSize = size * 0.5;
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const pointX = Math.cos(angle) * innerSize;
                const pointY = Math.sin(angle) * innerSize;
                if (i === 0) {
                    this.ctx.moveTo(pointX, pointY);
                } else {
                    this.ctx.lineTo(pointX, pointY);
                }
            }
            this.ctx.closePath();
            this.ctx.stroke();

            // Radial spokes connecting inner and outer hexagons
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(Math.cos(angle) * innerSize, Math.sin(angle) * innerSize);
                this.ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
                this.ctx.stroke();
            }
        }

        if (complexity >= 2) {
            // Complex dendritic branching (snowflake-like patterns)
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const startX = Math.cos(angle) * (size * 0.5);
                const startY = Math.sin(angle) * (size * 0.5);
                const endX = Math.cos(angle) * size;
                const endY = Math.sin(angle) * size;

                // Draw intricate branch patterns
                this.ctx.lineWidth = 1;
                const branches = 3;
                for (let b = 1; b <= branches; b++) {
                    const t = b / (branches + 1);
                    const branchX = startX + (endX - startX) * t;
                    const branchY = startY + (endY - startY) * t;

                    // Side branches creating dendritic structure
                    const branchAngle1 = angle + Math.PI / 6;
                    const branchAngle2 = angle - Math.PI / 6;
                    const branchLength = size * 0.15;

                    this.ctx.beginPath();
                    this.ctx.moveTo(branchX, branchY);
                    this.ctx.lineTo(
                        branchX + Math.cos(branchAngle1) * branchLength,
                        branchY + Math.sin(branchAngle1) * branchLength
                    );
                    this.ctx.stroke();

                    this.ctx.beginPath();
                    this.ctx.moveTo(branchX, branchY);
                    this.ctx.lineTo(
                        branchX + Math.cos(branchAngle2) * branchLength,
                        branchY + Math.sin(branchAngle2) * branchLength
                    );
                    this.ctx.stroke();
                }
            }

            // Center star pattern
            this.ctx.lineWidth = 1.5;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + Math.PI / 6;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(Math.cos(angle) * size * 0.3, Math.sin(angle) * size * 0.3);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    animate() {
        // Create atmospheric gradient background
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, 'rgba(10, 10, 15, 0.3)');
        bgGradient.addColorStop(1, 'rgba(10, 10, 15, 0.3)');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.time += 1;

        // Animate diamond dust particles (falling ice crystals in air)
        this.diamondDust.forEach(particle => {
            particle.y += particle.speed;
            particle.x += particle.drift;
            particle.twinkle += particle.twinkleSpeed;

            // Wrap particles around screen
            if (particle.y > this.canvas.height) {
                particle.y = -10;
                particle.x = Math.random() * this.canvas.width;
            }
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.x = Math.random() * this.canvas.width;
            }

            // Twinkling effect (like real diamond dust catching light)
            const twinkleOpacity = particle.opacity * (0.5 + 0.5 * Math.sin(particle.twinkle));

            // Draw particle with subtle glow
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = `rgba(200, 240, 255, ${twinkleOpacity})`;
            this.ctx.fillStyle = `rgba(200, 240, 255, ${twinkleOpacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // Animate main ice crystal formations
        this.crystals.forEach(crystal => {
            // Pulsing glow effect (aurora-like breathing)
            crystal.pulsePhase += crystal.pulseSpeed;
            const pulseFactor = 0.7 + 0.3 * Math.sin(crystal.pulsePhase);

            // Gentle drift animation
            crystal.x += crystal.driftX;
            crystal.y += crystal.driftY;
            crystal.rotation += crystal.rotationSpeed;

            // Wrap crystals around screen edges
            if (crystal.x < -100) crystal.x = this.canvas.width + 100;
            if (crystal.x > this.canvas.width + 100) crystal.x = -100;
            if (crystal.y > this.canvas.height + 100) {
                crystal.y = -100;
                crystal.x = Math.random() * this.canvas.width;
            }

            // Draw the ice crystal
            this.drawHexagonalCrystal(
                crystal.x,
                crystal.y,
                crystal.size,
                crystal.rotation,
                crystal.complexity,
                crystal.color,
                crystal.opacity,
                crystal.glowIntensity * pulseFactor
            );
        });

        // Animate shimmer/sparkle particles (aurora-like magic)
        this.shimmerParticles.forEach((shimmer, index) => {
            shimmer.life++;

            if (shimmer.life > shimmer.maxLife) {
                // Respawn shimmer
                shimmer.x = Math.random() * this.canvas.width;
                shimmer.y = Math.random() * this.canvas.height;
                shimmer.life = 0;
                shimmer.maxLife = 60 + Math.random() * 120;
                shimmer.color = this.auroraColors[Math.floor(Math.random() * this.auroraColors.length)];
            }

            // Smooth fade in/out
            const lifeRatio = shimmer.life / shimmer.maxLife;
            let opacity;
            if (lifeRatio < 0.2) {
                opacity = lifeRatio / 0.2;
            } else if (lifeRatio > 0.8) {
                opacity = (1 - lifeRatio) / 0.2;
            } else {
                opacity = 1;
            }

            // Draw four-pointed star sparkle
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `rgba(${shimmer.color.r}, ${shimmer.color.g}, ${shimmer.color.b}, ${opacity})`;
            this.ctx.fillStyle = `rgba(${shimmer.color.r}, ${shimmer.color.g}, ${shimmer.color.b}, ${opacity * 0.8})`;

            this.ctx.save();
            this.ctx.translate(shimmer.x, shimmer.y);
            this.ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                const x = Math.cos(angle) * shimmer.size;
                const y = Math.sin(angle) * shimmer.size;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
            this.ctx.shadowBlur = 0;
        });

        // Continue animation loop (with tab visibility optimization)
        if (!document.hidden) {
            requestAnimationFrame(() => this.animate());
        } else {
            setTimeout(() => this.animate(), 100);
        }
    }
}

// Aurora Borealis Animation
class AuroraAnimation {
    constructor() {
        this.canvas = document.getElementById('auroraCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();

        // Aurora wave properties
        this.waves = [];
        this.numWaves = 5;
        this.time = 0;

        // Initialize waves with different colors and properties
        for (let i = 0; i < this.numWaves; i++) {
            this.waves.push({
                amplitude: 50 + Math.random() * 100,
                frequency: 0.002 + Math.random() * 0.003,
                offset: Math.random() * Math.PI * 2,
                speed: 0.0003 + Math.random() * 0.0005,
                yPosition: (this.canvas.height * 0.2) + (i * 40),
                color: this.getAuroraColor(i)
            });
        }

        this.animate();
        window.addEventListener('resize', () => this.handleResize());
    }

    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleResize() {
        this.setCanvasSize();
        // Reinitialize waves with new canvas size
        this.waves.forEach((wave, i) => {
            wave.yPosition = (this.canvas.height * 0.2) + (i * 40);
        });
    }

    getAuroraColor(index) {
        // Aurora colors blended with Canadian Shield blues and northern greens
        const colors = [
            { r: 0, g: 255, b: 150 },    // Northern green
            { r: 29, g: 200, b: 255 },   // Ice blue
            { r: 100, g: 220, b: 255 },  // Sky blue
            { r: 0, g: 255, b: 200 },    // Cyan-green
            { r: 150, g: 150, b: 255 }   // Cool purple
        ];
        return colors[index % colors.length];
    }

    drawWave(wave, time) {
        const { amplitude, frequency, offset, yPosition, color } = wave;

        // Create gradient for the wave
        const gradient = this.ctx.createLinearGradient(0, yPosition - amplitude, 0, yPosition + amplitude);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();

        // Draw flowing wave shape
        for (let x = 0; x <= this.canvas.width; x += 2) {
            const y1 = yPosition +
                       Math.sin(x * frequency + time + offset) * amplitude +
                       Math.sin(x * frequency * 2 + time * 1.5) * (amplitude * 0.3);

            if (x === 0) {
                this.ctx.moveTo(x, y1);
            } else {
                this.ctx.lineTo(x, y1);
            }
        }

        // Complete the shape
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();

        // Add glow effect
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
    }

    animate() {
        // Clear canvas with slight fade for trail effect
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw each aurora wave
        this.waves.forEach(wave => {
            this.time += wave.speed;
            this.drawWave(wave, this.time);
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Pause animations when tab is hidden (performance optimization)
let iceCrystalsAnimation;

document.addEventListener('visibilitychange', () => {
    if (document.hidden && iceCrystalsAnimation) {
        // Animation will naturally pause as RAF stops when tab is hidden
        // This is handled automatically by requestAnimationFrame
    }
});

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the Northwest Territories Ice Crystals animation
    iceCrystalsAnimation = new IceCrystalsAnimation();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards for animation
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.service-card, .project-link');

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// API Configuration
const API_URL = window.location.origin + '/api';

// Contact form handling
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = e.target.querySelector('input[type="text"]').value;
        const email = e.target.querySelector('input[type="email"]').value;
        const message = e.target.querySelector('textarea').value;

        const button = contactForm.querySelector('button');
        const originalText = button.textContent;

        try {
            // Disable button during submission
            button.disabled = true;
            button.textContent = 'Sending...';

            const response = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message })
            });

            const result = await response.json();

            if (result.success) {
                // Show success message
                button.textContent = 'Message Sent!';
                button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                // Reset form
                contactForm.reset();

                // Reset button after 3 seconds
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                    button.disabled = false;
                }, 3000);
            } else {
                throw new Error(result.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            button.textContent = 'Failed to Send';
            button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
                button.disabled = false;
            }, 3000);
        }
    });
}

// Consolidated scroll handler for parallax and scroll indicator
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;

    // Parallax effect on hero section
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
    }

    // Hide scroll indicator after scrolling
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.style.opacity = scrolled > 100 ? '0' : '1';
    }
});

// Service Card Interactions
function initServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');

    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const service = this.getAttribute('data-service');
            console.log(`Service clicked: ${service}`);

            // Add a subtle click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            // Scroll to contact section
            document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Project Card Interactions
function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    const viewButtons = document.querySelectorAll('.view-project-btn');
    const modal = document.getElementById('projectModal');
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modalCta = document.querySelector('.modal-cta');

    function openModal(projectCard) {
        const projectTitle = projectCard.querySelector('.project-title').textContent;
        const projectDescription = projectCard.querySelector('.project-description').textContent;
        const projectTags = projectCard.querySelectorAll('.tag');
        const projectPreview = projectCard.querySelector('.preview-placeholder');

        // Populate modal
        document.getElementById('modalTitle').textContent = projectTitle;
        document.getElementById('modalDescription').textContent = projectDescription;

        // Copy preview SVG
        const previewScreen = document.getElementById('modalPreviewScreen');
        if (projectPreview) {
            previewScreen.innerHTML = projectPreview.outerHTML;
        }

        // Copy tags
        const modalTags = document.getElementById('modalTags');
        modalTags.innerHTML = '';
        projectTags.forEach(tag => {
            const newTag = document.createElement('span');
            newTag.className = 'tag';
            newTag.textContent = tag.textContent;
            modalTags.appendChild(newTag);
        });

        // Show modal
        modal.classList.add('active');

        // Lock body scroll on desktop only
        if (window.innerWidth > 768) {
            document.body.style.overflow = 'hidden';
        } else {
            // On mobile, lock body position but allow modal scroll
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${window.scrollY}px`;
        }
    }

    function closeModal() {
        modal.classList.remove('active');

        // Restore body scroll
        if (window.innerWidth > 768) {
            document.body.style.overflow = '';
        } else {
            // Restore scroll position on mobile
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }

    viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const projectCard = this.closest('.project-card');
            openModal(projectCard);
        });
    });

    // Make entire card clickable
    projectCards.forEach(card => {
        card.addEventListener('click', function() {
            openModal(this);
        });
    });

    // Close modal handlers
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }

    if (modalCta) {
        modalCta.addEventListener('click', function() {
            closeModal();
            document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Load dynamic structured data from server
async function updateStructuredData() {
    try {
        const response = await fetch(`${API_URL.replace('/api', '')}/structured-data.json`);
        if (response.ok) {
            const structuredData = await response.json();

            // Update the structured data script tag
            const existingScript = document.getElementById('structured-data');
            if (existingScript) {
                existingScript.textContent = JSON.stringify(structuredData, null, 4);
            }
        }
    } catch (error) {
        console.log('Using static structured data');
    }
}

// Portfolio Filter Functionality
function initPortfolioFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const projectsGrid = document.getElementById('projectsGrid');
    const videosSection = document.getElementById('videosSection');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterValue = this.getAttribute('data-filter');

            // Update active button state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Show/hide videos section
            if (filterValue === 'videos') {
                if (projectsGrid) projectsGrid.style.display = 'none';
                if (videosSection) videosSection.style.display = 'block';
            } else {
                if (projectsGrid) projectsGrid.style.display = 'grid';
                if (videosSection) videosSection.style.display = 'none';

                // Filter project cards
                projectCards.forEach(card => {
                    const category = card.getAttribute('data-category');

                    if (filterValue === 'all' || category === filterValue) {
                        // Show card with fade-in animation
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        // Hide card with fade-out
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            }
        });
    });
}

// Album Gallery Functions
let currentAlbumMedia = [];
let currentLightboxIndex = 0;

// Load and display albums
async function loadAlbums() {
    try {
        const response = await fetch(`${API_URL}/albums`);
        const result = await response.json();

        if (result.success && result.data) {
            displayAlbums(result.data);
        }
    } catch (error) {
        console.error('Error loading albums:', error);
    }
}

// Display albums in grid
function displayAlbums(albums) {
    const albumsGrid = document.getElementById('albumsGrid');
    if (!albumsGrid) return;

    albumsGrid.innerHTML = '';

    albums.forEach((album, index) => {
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.style.opacity = '0';
        albumCard.style.transform = 'translateY(30px)';

        albumCard.innerHTML = `
            <div class="album-cover" style="background-image: url('${album.coverImage || '/placeholder.jpg'}')">
                <div class="album-overlay">
                    <h3 class="album-title">${album.title}</h3>
                    <p class="album-count">${album.stats?.totalMedia || 0} photos</p>
                </div>
            </div>
        `;

        albumCard.addEventListener('click', () => openAlbumModal(album));
        albumsGrid.appendChild(albumCard);

        // Staggered fade-in animation
        setTimeout(() => {
            albumCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            albumCard.style.opacity = '1';
            albumCard.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Open album modal and load media
async function openAlbumModal(album) {
    const modal = document.getElementById('albumModal');
    const title = document.getElementById('albumModalTitle');
    const description = document.getElementById('albumModalDescription');
    const tags = document.getElementById('albumModalTags');
    const mediaGrid = document.getElementById('albumMediaGrid');

    if (!modal) return;

    title.textContent = album.title;
    description.textContent = album.description || '';

    // Display tags
    tags.innerHTML = '';
    if (album.tags && album.tags.length > 0) {
        album.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tags.appendChild(tagElement);
        });
    }

    // Load media for this album
    try {
        const response = await fetch(`${API_URL}/albums/${album._id}`);
        const result = await response.json();

        if (result.success && result.data && result.data.media) {
            currentAlbumMedia = result.data.media;
            displayAlbumMedia(result.data.media, mediaGrid);
        }
    } catch (error) {
        console.error('Error loading album media:', error);
        mediaGrid.innerHTML = '<p>Failed to load media</p>';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Display media items in album modal
function displayAlbumMedia(mediaItems, container) {
    container.innerHTML = '';

    mediaItems.forEach((media, index) => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';

        if (media.type === 'image') {
            mediaItem.innerHTML = `
                <img src="${media.thumbnail || media.optimized || media.url}"
                     alt="${media.alt || ''}"
                     loading="lazy">
            `;
            mediaItem.addEventListener('click', () => openLightbox(index));
        } else if (media.type === 'video') {
            mediaItem.innerHTML = `
                <video src="${media.url}" controls>
                    Your browser does not support the video tag.
                </video>
            `;
        }

        container.appendChild(mediaItem);
    });
}

// Open lightbox for viewing full-size images
function openLightbox(index) {
    const lightbox = document.getElementById('lightboxModal');
    if (!lightbox) return;

    currentLightboxIndex = index;
    updateLightboxContent();
    lightbox.classList.add('active');
}

// Update lightbox content
function updateLightboxContent() {
    const media = currentAlbumMedia[currentLightboxIndex];
    if (!media) return;

    const image = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    const counter = document.getElementById('lightboxCounter');

    image.src = media.url;
    image.alt = media.alt || '';
    caption.textContent = media.caption || '';
    counter.textContent = `${currentLightboxIndex + 1} / ${currentAlbumMedia.length}`;
}

// Navigate lightbox
function navigateLightbox(direction) {
    currentLightboxIndex += direction;

    // Wrap around
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = currentAlbumMedia.length - 1;
    } else if (currentLightboxIndex >= currentAlbumMedia.length) {
        currentLightboxIndex = 0;
    }

    updateLightboxContent();
}

// Initialize lightbox controls
function initLightbox() {
    const lightbox = document.getElementById('lightboxModal');
    if (!lightbox) return;

    const closeBtn = lightbox.querySelector('.modal-close');
    const backdrop = lightbox.querySelector('.modal-backdrop');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    function closeLightbox() {
        lightbox.classList.remove('active');
    }

    closeBtn?.addEventListener('click', closeLightbox);
    backdrop?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', () => navigateLightbox(-1));
    nextBtn?.addEventListener('click', () => navigateLightbox(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

// Initialize album modal controls
function initAlbumModal() {
    const modal = document.getElementById('albumModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Initialize interactivity when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    initServicesCarousel(); // Initialize carousel instead of cards
    initProjectCards();
    initPortfolioFilters(); // Initialize portfolio filters
    updateStructuredData(); // Load dynamic SEO data
    loadAlbums(); // Load album gallery
    initLightbox(); // Initialize lightbox
    initAlbumModal(); // Initialize album modal

    // Add staggered fade-in animation to project cards only
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Services Carousel
function initServicesCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.service-slide'));
    const dots = Array.from(document.querySelectorAll('.carousel-dot'));
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    // Exit if carousel elements don't exist
    if (!track || slides.length === 0 || !prevBtn || !nextBtn) {
        return;
    }

    let currentSlide = 0;
    let isTransitioning = false;
    let autoPlayInterval;

    // Move to specific slide
    function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;

        // Remove active class from current slide
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');

        // Update current slide
        currentSlide = index;

        // Add active class to new slide
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');

        // Move track
        track.style.transform = `translateX(-${currentSlide * 100}%)`;

        setTimeout(() => {
            isTransitioning = false;
        }, 600);
    }

    // Next slide
    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        goToSlide(next);
    }

    // Previous slide
    function prevSlide() {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        goToSlide(prev);
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoPlay();
    });

    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoPlay();
    });

    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            resetAutoPlay();
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            resetAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            resetAutoPlay();
        }
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchStartX - touchEndX > swipeThreshold) {
            nextSlide();
            resetAutoPlay();
        }
        if (touchEndX - touchStartX > swipeThreshold) {
            prevSlide();
            resetAutoPlay();
        }
    }

    // Auto-play
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }

    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    // Start auto-play
    startAutoPlay();

    // Pause auto-play on hover
    const carousel = document.querySelector('.carousel-container');
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);

    // Pause auto-play when page is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    });
}
