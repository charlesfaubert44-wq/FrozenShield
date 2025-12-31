// Project Showcase Module
const ProjectShowcase = {
    // State management
    state: {
        projects: [],
        filteredProjects: [],
        currentProject: null,
        currentProjectIndex: -1,
        filters: {
            category: 'all',
            technology: null,
            search: ''
        }
    },

    // API Configuration
    API_URL: window.location.origin + '/api',

    // Technology color mapping
    techColors: {
        'React': { bg: 'rgba(97, 218, 251, 0.15)', border: '#61dafb', text: '#61dafb' },
        'Vue': { bg: 'rgba(66, 211, 146, 0.15)', border: '#42d392', text: '#42d392' },
        'Angular': { bg: 'rgba(221, 0, 49, 0.15)', border: '#dd0031', text: '#dd0031' },
        'Node.js': { bg: 'rgba(104, 160, 99, 0.15)', border: '#68a063', text: '#68a063' },
        'Express': { bg: 'rgba(255, 255, 255, 0.15)', border: '#ffffff', text: '#ffffff' },
        'MongoDB': { bg: 'rgba(71, 162, 72, 0.15)', border: '#47a248', text: '#47a248' },
        'PostgreSQL': { bg: 'rgba(49, 130, 206, 0.15)', border: '#3182ce', text: '#3182ce' },
        'MySQL': { bg: 'rgba(0, 117, 143, 0.15)', border: '#00758f', text: '#00758f' },
        'JavaScript': { bg: 'rgba(240, 219, 79, 0.15)', border: '#f0db4f', text: '#f0db4f' },
        'TypeScript': { bg: 'rgba(49, 120, 198, 0.15)', border: '#3178c6', text: '#3178c6' },
        'Python': { bg: 'rgba(55, 118, 171, 0.15)', border: '#3776ab', text: '#3776ab' },
        'PHP': { bg: 'rgba(119, 123, 180, 0.15)', border: '#777bb4', text: '#777bb4' },
        'Stripe': { bg: 'rgba(99, 91, 255, 0.15)', border: '#635bff', text: '#635bff' },
        'Tailwind': { bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8', text: '#38bdf8' },
        'Bootstrap': { bg: 'rgba(121, 82, 179, 0.15)', border: '#7952b3', text: '#7952b3' },
        'AWS': { bg: 'rgba(255, 153, 0, 0.15)', border: '#ff9900', text: '#ff9900' },
        'Docker': { bg: 'rgba(33, 150, 243, 0.15)', border: '#2196f3', text: '#2196f3' },
        'Git': { bg: 'rgba(240, 80, 50, 0.15)', border: '#f05032', text: '#f05032' },
        'Default': { bg: 'rgba(116, 192, 252, 0.15)', border: '#74c0fc', text: '#74c0fc' }
    },

    // Initialize the module
    async init() {
        await this.fetchProjects();
        this.setupEventListeners();
        this.setupCategoryFilters();
        this.renderProjects();
    },

    // Fetch projects from API
    async fetchProjects(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.category && filters.category !== 'all') {
                params.append('category', filters.category);
            }
            if (filters.technology) {
                params.append('technology', filters.technology);
            }
            if (filters.search) {
                params.append('search', filters.search);
            }

            const url = `${this.API_URL}/projects${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                this.state.projects = result.data.filter(project => project.visibility === 'public');
                this.state.filteredProjects = this.state.projects;
                return this.state.projects;
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    },

    // Render project grid
    renderProjects() {
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;

        // Clear existing cards except placeholder cards
        const existingCards = projectsGrid.querySelectorAll('.project-card[data-dynamic="true"]');
        existingCards.forEach(card => card.remove());

        if (this.state.filteredProjects.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <p>No projects found matching your filters.</p>
            `;
            projectsGrid.appendChild(noResults);
            return;
        }

        // Remove any existing no-results message
        const noResults = projectsGrid.querySelector('.no-results');
        if (noResults) noResults.remove();

        // Render each project
        this.state.filteredProjects.forEach((project, index) => {
            const card = this.createProjectCard(project, index);
            projectsGrid.appendChild(card);
        });
    },

    // Create project card element
    createProjectCard(project, index) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-dynamic', 'true');
        card.setAttribute('data-category', project.category || 'other');
        card.setAttribute('data-project-id', project._id);

        // Set initial animation state
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        // Get thumbnail or first image
        const thumbnail = project.thumbnail || (project.images && project.images[0]?.url) || '';

        // Create technology badges HTML
        const techBadges = project.technologies && project.technologies.length > 0
            ? project.technologies.slice(0, 4).map(tech => {
                const color = this.techColors[tech] || this.techColors['Default'];
                return `<span class="tech-badge" style="background: ${color.bg}; border-color: ${color.border}; color: ${color.text}">${tech}</span>`;
            }).join('')
            : '';

        card.innerHTML = `
            <div class="project-preview">
                <div class="project-thumbnail" style="background-image: url('${thumbnail}')">
                    ${!thumbnail ? '<div class="placeholder-icon">📁</div>' : ''}
                </div>
                <div class="project-overlay">
                    <button class="view-project-btn">View Project</button>
                </div>
            </div>
            <div class="project-info">
                <div class="project-meta">
                    ${project.category ? `<span class="category-badge">${this.formatCategory(project.category)}</span>` : ''}
                </div>
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.shortDescription || project.longDescription?.substring(0, 150) || 'No description available'}${(project.shortDescription?.length > 150 || project.longDescription?.length > 150) ? '...' : ''}</p>
                ${techBadges ? `<div class="project-technologies">${techBadges}</div>` : ''}
            </div>
        `;

        // Add click handler
        card.addEventListener('click', () => this.openProjectDetail(project._id));

        // Animate card appearance
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);

        return card;
    },

    // Format category name for display
    formatCategory(category) {
        const categoryMap = {
            'web-app': 'Web App',
            'ecommerce': 'E-commerce',
            'portfolio': 'Portfolio',
            'photography': 'Photography',
            'videography': 'Videography',
            'other': 'Other'
        };
        return categoryMap[category] || category;
    },

    // Open project detail modal
    async openProjectDetail(projectId) {
        try {
            // Find project in state
            const project = this.state.projects.find(p => p._id === projectId);
            if (!project) return;

            this.state.currentProject = project;
            this.state.currentProjectIndex = this.state.filteredProjects.findIndex(p => p._id === projectId);

            // Track view
            this.trackView(projectId);

            // Populate and show modal
            this.displayProjectDetail(project);
        } catch (error) {
            console.error('Error opening project detail:', error);
        }
    },

    // Display project detail in modal
    displayProjectDetail(project) {
        const modal = document.getElementById('projectDetailModal');
        if (!modal) return;

        // Set hero image
        const heroImage = modal.querySelector('#projectHeroImage');
        const heroImageContainer = modal.querySelector('.project-hero-image');
        if (heroImage && heroImageContainer) {
            const mainImage = project.thumbnail || (project.images && project.images[0]?.url);
            if (mainImage) {
                heroImage.src = mainImage;
                heroImage.alt = project.title;
                heroImageContainer.style.display = 'block';
            } else {
                heroImageContainer.style.display = 'none';
            }
        }

        // Set title
        const title = modal.querySelector('#projectDetailTitle');
        if (title) title.textContent = project.title;

        // Set description
        const description = modal.querySelector('#projectDetailDescription');
        if (description) {
            description.innerHTML = project.longDescription || project.shortDescription || 'No description available';
        }

        // Set category badge
        const categoryBadge = modal.querySelector('#projectDetailCategory');
        if (categoryBadge && project.category) {
            categoryBadge.textContent = this.formatCategory(project.category);
            categoryBadge.style.display = 'inline-block';
        } else if (categoryBadge) {
            categoryBadge.style.display = 'none';
        }

        // Set metadata
        const metadata = modal.querySelector('#projectDetailMetadata');
        if (metadata) {
            let metaHTML = '';
            if (project.client) {
                metaHTML += `<div class="meta-item"><strong>Client:</strong> ${project.client}</div>`;
            }
            if (project.completedDate) {
                const date = new Date(project.completedDate);
                metaHTML += `<div class="meta-item"><strong>Completed:</strong> ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>`;
            }
            if (project.stats?.views) {
                metaHTML += `<div class="meta-item"><strong>Views:</strong> ${project.stats.views}</div>`;
            }
            metadata.innerHTML = metaHTML;
        }

        // Set technologies
        const techContainer = modal.querySelector('#projectDetailTechnologies');
        if (techContainer) {
            if (project.technologies && project.technologies.length > 0) {
                techContainer.innerHTML = project.technologies.map(tech => {
                    const color = this.techColors[tech] || this.techColors['Default'];
                    return `<span class="tech-badge-large" style="background: ${color.bg}; border-color: ${color.border}; color: ${color.text}">${tech}</span>`;
                }).join('');
                techContainer.style.display = 'flex';
            } else {
                techContainer.style.display = 'none';
            }
        }

        // Set image gallery
        const gallery = modal.querySelector('#projectImageGallery');
        if (gallery && project.images && project.images.length > 0) {
            gallery.innerHTML = project.images.map((img, index) => `
                <div class="gallery-image" data-index="${index}">
                    <img src="${img.url}" alt="${img.caption || project.title}" loading="lazy">
                    ${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}
                </div>
            `).join('');
            gallery.style.display = 'grid';

            // Add click handlers for lightbox
            gallery.querySelectorAll('.gallery-image img').forEach((img, index) => {
                img.addEventListener('click', () => this.openImageLightbox(project.images, index));
            });
        } else if (gallery) {
            gallery.style.display = 'none';
        }

        // Set action buttons
        const liveButton = modal.querySelector('#projectLiveButton');
        const codeButton = modal.querySelector('#projectCodeButton');

        if (liveButton) {
            if (project.projectUrl) {
                liveButton.href = project.projectUrl;
                liveButton.style.display = 'inline-flex';
            } else {
                liveButton.style.display = 'none';
            }
        }

        if (codeButton) {
            if (project.githubUrl) {
                codeButton.href = project.githubUrl;
                codeButton.style.display = 'inline-flex';
            } else {
                codeButton.style.display = 'none';
            }
        }

        // Update navigation arrows
        this.updateNavigationArrows();

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    // Update navigation arrows in detail modal
    updateNavigationArrows() {
        const modal = document.getElementById('projectDetailModal');
        if (!modal) return;

        const prevBtn = modal.querySelector('#projectPrevBtn');
        const nextBtn = modal.querySelector('#projectNextBtn');

        if (prevBtn) {
            prevBtn.disabled = this.state.currentProjectIndex <= 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.state.currentProjectIndex >= this.state.filteredProjects.length - 1;
        }
    },

    // Navigate to previous/next project
    navigateProject(direction) {
        const newIndex = this.state.currentProjectIndex + direction;

        if (newIndex >= 0 && newIndex < this.state.filteredProjects.length) {
            const nextProject = this.state.filteredProjects[newIndex];
            this.openProjectDetail(nextProject._id);
        }
    },

    // Close project detail modal
    closeProjectDetail() {
        const modal = document.getElementById('projectDetailModal');
        if (!modal) return;

        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.state.currentProject = null;
        this.state.currentProjectIndex = -1;
    },

    // Open image lightbox
    openImageLightbox(images, startIndex) {
        const lightbox = document.getElementById('projectLightbox');
        if (!lightbox) return;

        this.state.lightboxImages = images;
        this.state.lightboxIndex = startIndex;

        this.updateLightboxImage();
        lightbox.classList.add('active');
    },

    // Update lightbox image
    updateLightboxImage() {
        const lightbox = document.getElementById('projectLightbox');
        if (!lightbox) return;

        const image = lightbox.querySelector('#lightboxImage');
        const caption = lightbox.querySelector('#lightboxCaption');
        const counter = lightbox.querySelector('#lightboxCounter');

        const currentImage = this.state.lightboxImages[this.state.lightboxIndex];

        if (image) image.src = currentImage.url;
        if (caption) caption.textContent = currentImage.caption || '';
        if (counter) {
            counter.textContent = `${this.state.lightboxIndex + 1} / ${this.state.lightboxImages.length}`;
        }
    },

    // Navigate lightbox
    navigateLightbox(direction) {
        this.state.lightboxIndex += direction;

        if (this.state.lightboxIndex < 0) {
            this.state.lightboxIndex = this.state.lightboxImages.length - 1;
        } else if (this.state.lightboxIndex >= this.state.lightboxImages.length) {
            this.state.lightboxIndex = 0;
        }

        this.updateLightboxImage();
    },

    // Close lightbox
    closeLightbox() {
        const lightbox = document.getElementById('projectLightbox');
        if (!lightbox) return;

        lightbox.classList.remove('active');
        this.state.lightboxImages = [];
        this.state.lightboxIndex = 0;
    },

    // Track project view
    async trackView(projectId) {
        try {
            await fetch(`${this.API_URL}/projects/${projectId}/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    },

    // Filter by category
    filterByCategory(category) {
        this.state.filters.category = category;
        this.applyFilters();
    },

    // Filter by technology
    filterByTechnology(technology) {
        this.state.filters.technology = technology;
        this.applyFilters();
    },

    // Search projects
    searchProjects(query) {
        this.state.filters.search = query;
        this.applyFilters();
    },

    // Apply all filters
    applyFilters() {
        let filtered = [...this.state.projects];

        // Category filter
        if (this.state.filters.category && this.state.filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === this.state.filters.category);
        }

        // Technology filter
        if (this.state.filters.technology) {
            filtered = filtered.filter(p =>
                p.technologies && p.technologies.includes(this.state.filters.technology)
            );
        }

        // Search filter
        if (this.state.filters.search) {
            const query = this.state.filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(query) ||
                (p.shortDescription && p.shortDescription.toLowerCase().includes(query)) ||
                (p.longDescription && p.longDescription.toLowerCase().includes(query))
            );
        }

        this.state.filteredProjects = filtered;
        this.renderProjects();
    },

    // Setup category filter buttons
    setupCategoryFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-filter');

                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Apply filter
                this.filterByCategory(category);
            });
        });
    },

    // Setup event listeners
    setupEventListeners() {
        // Project detail modal
        const modal = document.getElementById('projectDetailModal');
        if (modal) {
            const closeBtn = modal.querySelector('.modal-close');
            const backdrop = modal.querySelector('.modal-backdrop');
            const prevBtn = modal.querySelector('#projectPrevBtn');
            const nextBtn = modal.querySelector('#projectNextBtn');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeProjectDetail());
            }

            if (backdrop) {
                backdrop.addEventListener('click', () => this.closeProjectDetail());
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.navigateProject(-1));
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.navigateProject(1));
            }
        }

        // Lightbox
        const lightbox = document.getElementById('projectLightbox');
        if (lightbox) {
            const closeBtn = lightbox.querySelector('.modal-close');
            const backdrop = lightbox.querySelector('.modal-backdrop');
            const prevBtn = lightbox.querySelector('.lightbox-prev');
            const nextBtn = lightbox.querySelector('.lightbox-next');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeLightbox());
            }

            if (backdrop) {
                backdrop.addEventListener('click', () => this.closeLightbox());
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.navigateLightbox(-1));
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.navigateLightbox(1));
            }
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const detailModal = document.getElementById('projectDetailModal');
            const lightboxModal = document.getElementById('projectLightbox');

            if (lightboxModal && lightboxModal.classList.contains('active')) {
                if (e.key === 'Escape') this.closeLightbox();
                if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
                if (e.key === 'ArrowRight') this.navigateLightbox(1);
            } else if (detailModal && detailModal.classList.contains('active')) {
                if (e.key === 'Escape') this.closeProjectDetail();
                if (e.key === 'ArrowLeft') this.navigateProject(-1);
                if (e.key === 'ArrowRight') this.navigateProject(1);
            }
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProjectShowcase.init());
} else {
    ProjectShowcase.init();
}
