// Code Animation Background
class CodeAnimation {
    constructor() {
        this.canvas = document.getElementById('codeCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();

        // Code snippets to display
        this.codeSnippets = [
            'const', 'function', 'return', 'import', 'export', 'class',
            'async', 'await', 'if', 'else', 'for', 'while',
            '=>', '{}', '[]', '()', '===', '!==',
            'React', 'Node', 'Express', 'MongoDB', 'API',
            'const app', 'app.get', 'useState', 'useEffect',
            'fetch()', 'async function', 'try catch', 'await',
            'map()', 'filter()', 'reduce()', 'forEach()',
            '{ }', '[ ]', '< >', '/ >', 'npm', 'git'
        ];

        this.columns = Math.floor(this.canvas.width / 20);
        this.drops = [];
        this.speeds = [];
        this.colors = [];

        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100;
            this.speeds[i] = 0.1 + Math.random() * 0.2; // Slower speed
            this.colors[i] = this.getRandomColor();
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
        this.columns = Math.floor(this.canvas.width / 20);
        this.drops = [];
        this.speeds = [];
        this.colors = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100;
            this.speeds[i] = 0.1 + Math.random() * 0.2; // Slower speed
            this.colors[i] = this.getRandomColor();
        }
    }

    getRandomColor() {
        const colors = [
            'rgba(29, 84, 108, 0.8)',    // Medium blue
            'rgba(26, 61, 100, 0.8)',    // Medium dark blue
            'rgba(12, 43, 78, 0.8)',     // Dark blue
            'rgba(96, 165, 250, 0.8)',   // Light blue
            'rgba(244, 244, 244, 0.6)'   // White/ice
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    animate() {
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = '14px "Fira Code", "Courier New", monospace';

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.codeSnippets[Math.floor(Math.random() * this.codeSnippets.length)];
            this.ctx.fillStyle = this.colors[i];
            this.ctx.fillText(text, i * 20, this.drops[i] * 20);

            if (this.drops[i] * 20 > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
                this.colors[i] = this.getRandomColor();
            }

            this.drops[i] += this.speeds[i];
        }

        requestAnimationFrame(() => this.animate());
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

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Aurora disabled due to performance issues
    // new AuroraAnimation();
    new CodeAnimation();
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

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');

    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
    }
});

// Hide scroll indicator on scroll
window.addEventListener('scroll', () => {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator && window.pageYOffset > 100) {
        scrollIndicator.style.opacity = '0';
    } else if (scrollIndicator) {
        scrollIndicator.style.opacity = '1';
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

// Initialize interactivity when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    initServiceCards();
    initProjectCards();
    updateStructuredData(); // Load dynamic SEO data

    // Add staggered fade-in animation to cards
    const cards = document.querySelectorAll('.service-card, .project-card');
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
