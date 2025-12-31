/**
 * Unified Portfolio System with Advanced Filtering
 * Combines albums, videos, and projects with multi-select filters, tag cloud, and search
 */

const PortfolioManager = (() => {
    // State management
    let state = {
        items: [],
        filteredItems: [],
        currentPage: 1,
        itemsPerPage: 12,
        filters: {
            type: 'all', // all, albums, videos, projects
            categories: [], // Multi-select categories
            tags: [], // Multi-select tags
            featured: null, // null, true, false
            search: ''
        },
        sortBy: 'latest', // latest, featured, views, oldest, a-z
        viewMode: 'grid', // grid, list
        loading: false,
        hasMore: true,
        categories: new Set(),
        tags: new Set(),
        tagCounts: new Map(),
        recentSearches: []
    };

    // DOM elements
    const elements = {};

    // API base URL
    const API_URL = window.location.origin + '/api';

    // Initialize the portfolio manager
    function init() {
        cacheElements();
        attachEventListeners();
        loadPortfolio();
    }

    // Cache DOM elements
    function cacheElements() {
        elements.typeFilters = document.querySelectorAll('[data-type-filter]');
        elements.categoryFiltersContainer = document.getElementById('categoryFiltersContainer');
        elements.tagCloudContainer = document.getElementById('tagCloudContainer');
        elements.activeFiltersContainer = document.getElementById('activeFiltersContainer');
        elements.featuredToggle = document.getElementById('portfolioFeaturedToggle');
        elements.searchInput = document.getElementById('portfolioSearch');
        elements.clearSearchBtn = document.getElementById('clearSearchBtn');
        elements.searchSuggestions = document.getElementById('searchSuggestions');
        elements.sortSelect = document.getElementById('portfolioSort');
        elements.viewToggleGrid = document.getElementById('viewToggleGrid');
        elements.viewToggleList = document.getElementById('viewToggleList');
        elements.portfolioGrid = document.getElementById('portfolioGrid');
        elements.loadMoreBtn = document.getElementById('portfolioLoadMore');
        elements.loadingIndicator = document.getElementById('portfolioLoading');
        elements.emptyState = document.getElementById('portfolioEmpty');
        elements.resultCount = document.getElementById('resultCount');
        elements.filterSidebar = document.getElementById('filterSidebar');
        elements.filterToggleBtn = document.getElementById('filterToggleBtn');
    }

    // Attach event listeners
    function attachEventListeners() {
        // Type filters
        elements.typeFilters?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.typeFilter;
                setTypeFilter(type);
            });
        });

        // Featured toggle
        elements.featuredToggle?.addEventListener('change', (e) => {
            state.filters.featured = e.target.checked ? true : null;
            applyFilters();
        });

        // Search with debounce and highlighting
        let searchTimeout;
        elements.searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const value = e.target.value.trim();

            // Show/hide clear button
            if (elements.clearSearchBtn) {
                elements.clearSearchBtn.style.display = value ? 'block' : 'none';
            }

            searchTimeout = setTimeout(() => {
                state.filters.search = value.toLowerCase();
                if (value) {
                    saveRecentSearch(value);
                }
                applyFilters();
            }, 300);
        });

        // Search focus - show suggestions
        elements.searchInput?.addEventListener('focus', () => {
            updateSearchSuggestions();
        });

        // Clear search
        elements.clearSearchBtn?.addEventListener('click', () => {
            if (elements.searchInput) {
                elements.searchInput.value = '';
                state.filters.search = '';
                elements.clearSearchBtn.style.display = 'none';
                applyFilters();
            }
        });

        // Sort
        elements.sortSelect?.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            sortPortfolio();
            displayPortfolio();
        });

        // View toggle
        elements.viewToggleGrid?.addEventListener('click', () => setViewMode('grid'));
        elements.viewToggleList?.addEventListener('click', () => setViewMode('list'));

        // Load more
        elements.loadMoreBtn?.addEventListener('click', loadMore);

        // Mobile filter toggle
        elements.filterToggleBtn?.addEventListener('click', () => {
            elements.filterSidebar?.classList.toggle('active');
        });

        // Event delegation for dynamic elements
        document.addEventListener('click', handleDynamicClicks);

        // Load recent searches from localStorage
        loadRecentSearches();
    }

    // Handle clicks on dynamic elements
    function handleDynamicClicks(e) {
        // Category filter pills
        if (e.target.closest('.category-filter-pill')) {
            const pill = e.target.closest('.category-filter-pill');
            const category = pill.dataset.category;
            toggleCategoryFilter(category);
        }

        // Tag pills in cloud
        if (e.target.closest('.tag-pill')) {
            const pill = e.target.closest('.tag-pill');
            const tag = pill.dataset.tag;
            toggleTagFilter(tag);
        }

        // Active filter chips remove button
        if (e.target.closest('.remove-filter-chip')) {
            const chip = e.target.closest('.active-filter-chip');
            const type = chip.dataset.filterType;
            const value = chip.dataset.filterValue;
            removeActiveFilter(type, value);
        }

        // Clear all filters button
        if (e.target.closest('.clear-all-filters')) {
            clearAllFilters();
        }

        // Recent search items
        if (e.target.closest('.recent-search-item')) {
            const search = e.target.closest('.recent-search-item').dataset.search;
            if (elements.searchInput) {
                elements.searchInput.value = search;
                state.filters.search = search.toLowerCase();
                applyFilters();
            }
        }

        // Clear recent searches
        if (e.target.closest('.clear-recent-searches')) {
            state.recentSearches = [];
            localStorage.removeItem('portfolio_recent_searches');
            updateSearchSuggestions();
        }
    }

    // Toggle category filter (multi-select)
    function toggleCategoryFilter(category) {
        const index = state.filters.categories.indexOf(category);
        if (index > -1) {
            state.filters.categories.splice(index, 1);
        } else {
            state.filters.categories.push(category);
        }
        applyFilters();
        renderCategoryFilters();
        renderActiveFilters();
    }

    // Toggle tag filter (multi-select)
    function toggleTagFilter(tag) {
        const index = state.filters.tags.indexOf(tag);
        if (index > -1) {
            state.filters.tags.splice(index, 1);
        } else {
            state.filters.tags.push(tag);
        }
        applyFilters();
        renderTagCloud();
        renderActiveFilters();
    }

    // Remove active filter
    function removeActiveFilter(type, value) {
        switch(type) {
            case 'category':
                const catIndex = state.filters.categories.indexOf(value);
                if (catIndex > -1) state.filters.categories.splice(catIndex, 1);
                break;
            case 'tag':
                const tagIndex = state.filters.tags.indexOf(value);
                if (tagIndex > -1) state.filters.tags.splice(tagIndex, 1);
                break;
            case 'featured':
                state.filters.featured = null;
                if (elements.featuredToggle) elements.featuredToggle.checked = false;
                break;
            case 'search':
                state.filters.search = '';
                if (elements.searchInput) {
                    elements.searchInput.value = '';
                    elements.clearSearchBtn.style.display = 'none';
                }
                break;
        }
        applyFilters();
        renderCategoryFilters();
        renderTagCloud();
        renderActiveFilters();
    }

    // Clear all filters
    function clearAllFilters() {
        state.filters = {
            type: 'all',
            categories: [],
            tags: [],
            featured: null,
            search: ''
        };

        if (elements.searchInput) elements.searchInput.value = '';
        if (elements.clearSearchBtn) elements.clearSearchBtn.style.display = 'none';
        if (elements.featuredToggle) elements.featuredToggle.checked = false;

        applyFilters();
        renderCategoryFilters();
        renderTagCloud();
        renderActiveFilters();
    }

    // Set type filter
    function setTypeFilter(type) {
        state.filters.type = type;

        // Update active button
        elements.typeFilters?.forEach(btn => {
            if (btn.dataset.typeFilter === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        applyFilters();
    }

    // Save recent search
    function saveRecentSearch(search) {
        if (!search || search.length < 2) return;

        // Remove duplicates
        state.recentSearches = state.recentSearches.filter(s => s !== search);
        // Add to front
        state.recentSearches.unshift(search);
        // Limit to 5 recent searches
        state.recentSearches = state.recentSearches.slice(0, 5);

        // Save to localStorage
        try {
            localStorage.setItem('portfolio_recent_searches', JSON.stringify(state.recentSearches));
        } catch (error) {
            console.debug('Failed to save recent searches:', error);
        }
    }

    // Load recent searches
    function loadRecentSearches() {
        try {
            const saved = localStorage.getItem('portfolio_recent_searches');
            if (saved) {
                state.recentSearches = JSON.parse(saved);
            }
        } catch (error) {
            console.debug('Failed to load recent searches:', error);
        }
    }

    // Update search suggestions
    function updateSearchSuggestions() {
        if (!elements.searchSuggestions || state.recentSearches.length === 0) return;

        elements.searchSuggestions.innerHTML = `
            <div class="recent-searches">
                <div class="recent-searches-header">
                    <span>Recent Searches</span>
                    <button class="clear-recent-searches">Clear</button>
                </div>
                <div class="recent-searches-list">
                    ${state.recentSearches.map(search => `
                        <button class="recent-search-item" data-search="${search}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            ${search}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        elements.searchSuggestions.style.display = 'block';
    }

    // Set view mode
    function setViewMode(mode) {
        state.viewMode = mode;

        elements.portfolioGrid?.classList.remove('grid-view', 'list-view');
        elements.portfolioGrid?.classList.add(`${mode}-view`);

        if (mode === 'grid') {
            elements.viewToggleGrid?.classList.add('active');
            elements.viewToggleList?.classList.remove('active');
        } else {
            elements.viewToggleGrid?.classList.remove('active');
            elements.viewToggleList?.classList.add('active');
        }
    }

    // Fetch portfolio data from all sources
    async function loadPortfolio() {
        if (state.loading) return;

        state.loading = true;
        showLoading(true);

        try {
            // Fetch data from all endpoints in parallel
            const [albumsRes, videosRes, projectsRes] = await Promise.all([
                fetch(`${API_URL}/albums`).catch(err => ({ ok: false })),
                fetch(`${API_URL}/videos`).catch(err => ({ ok: false })),
                fetch(`${API_URL}/projects`).catch(err => ({ ok: false }))
            ]);

            const items = [];

            // Process albums
            if (albumsRes.ok) {
                const albumsData = await albumsRes.json();
                if (albumsData.success && albumsData.data) {
                    albumsData.data.forEach(album => {
                        items.push(normalizeAlbum(album));
                    });
                }
            }

            // Process videos
            if (videosRes.ok) {
                const videosData = await videosRes.json();
                if (videosData.success && videosData.data) {
                    videosData.data.forEach(video => {
                        items.push(normalizeVideo(video));
                    });
                }
            }

            // Process projects
            if (projectsRes.ok) {
                const projectsData = await projectsRes.json();
                if (projectsData.success && projectsData.data) {
                    projectsData.data.forEach(project => {
                        items.push(normalizeProject(project));
                    });
                }
            }

            state.items = items;
            extractFilters();
            applyFilters();
            sortPortfolio();
            displayPortfolio();
        } catch (error) {
            console.error('Error loading portfolio:', error);
            showError('Failed to load portfolio items');
        } finally {
            state.loading = false;
            showLoading(false);
        }
    }

    // Normalize album data to unified format
    function normalizeAlbum(album) {
        return {
            id: album._id,
            type: 'album',
            title: album.title,
            description: album.description || '',
            thumbnail: album.coverImage || '/placeholder-album.jpg',
            category: album.category || 'Photography',
            tags: album.tags || [],
            featured: album.featured || false,
            views: album.stats?.views || 0,
            createdAt: new Date(album.createdAt),
            metadata: {
                photoCount: album.stats?.totalMedia || 0
            },
            data: album
        };
    }

    // Normalize video data to unified format
    function normalizeVideo(video) {
        return {
            id: video._id,
            type: 'video',
            title: video.title,
            description: video.description || '',
            thumbnail: video.thumbnail || `/placeholder-video.jpg`,
            category: video.category || 'Videography',
            tags: video.tags || [],
            featured: video.featured || false,
            views: video.views || 0,
            createdAt: new Date(video.createdAt || video.uploadDate),
            metadata: {
                duration: video.duration || '0:00',
                videoType: video.type || 'html5'
            },
            data: video
        };
    }

    // Normalize project data to unified format
    function normalizeProject(project) {
        return {
            id: project._id,
            type: 'project',
            title: project.title,
            description: project.shortDescription || project.longDescription || '',
            thumbnail: project.thumbnail || (project.images && project.images[0]?.url) || '/placeholder-project.jpg',
            category: project.category || 'Web Development',
            tags: project.technologies || [],
            featured: project.featured || false,
            views: project.stats?.views || 0,
            createdAt: new Date(project.createdAt || project.completedDate),
            metadata: {
                technologies: project.technologies || []
            },
            data: project
        };
    }

    // Extract unique categories and tags for filters
    function extractFilters() {
        state.categories.clear();
        state.tags.clear();
        state.tagCounts.clear();

        // Count categories and tags
        state.items.forEach(item => {
            if (item.category) state.categories.add(item.category);

            item.tags.forEach(tag => {
                state.tags.add(tag);
                state.tagCounts.set(tag, (state.tagCounts.get(tag) || 0) + 1);
            });
        });

        renderCategoryFilters();
        renderTagCloud();
        renderActiveFilters();
    }

    // Render category filter pills with counts
    function renderCategoryFilters() {
        if (!elements.categoryFiltersContainer) return;

        // Count items per category
        const categoryCounts = new Map();
        state.items.forEach(item => {
            if (item.category) {
                categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
            }
        });

        const html = Array.from(state.categories).sort().map(category => {
            const count = categoryCounts.get(category) || 0;
            const isActive = state.filters.categories.includes(category);

            return `
                <button class="category-filter-pill ${isActive ? 'active' : ''}"
                        data-category="${category}">
                    ${category}
                    <span class="filter-count">(${count})</span>
                </button>
            `;
        }).join('');

        elements.categoryFiltersContainer.innerHTML = html;
    }

    // Render tag cloud with size variations based on frequency
    function renderTagCloud() {
        if (!elements.tagCloudContainer) return;

        // Sort tags by frequency
        const sortedTags = Array.from(state.tags).sort((a, b) => {
            return (state.tagCounts.get(b) || 0) - (state.tagCounts.get(a) || 0);
        }).slice(0, 30); // Top 30 tags

        // Calculate font size ranges
        const counts = sortedTags.map(tag => state.tagCounts.get(tag) || 0);
        const maxCount = Math.max(...counts, 1);
        const minCount = Math.min(...counts, 1);

        const html = sortedTags.map(tag => {
            const count = state.tagCounts.get(tag) || 0;
            const sizeRatio = (count - minCount) / (maxCount - minCount || 1);
            const fontSize = 0.85 + (sizeRatio * 0.6); // 0.85rem to 1.45rem
            const isActive = state.filters.tags.includes(tag);

            return `
                <button class="tag-pill ${isActive ? 'active' : ''}"
                        data-tag="${tag}"
                        style="font-size: ${fontSize}rem">
                    ${tag}
                    <span class="tag-count">${count}</span>
                </button>
            `;
        }).join('');

        elements.tagCloudContainer.innerHTML = html;
    }

    // Render active filters display
    function renderActiveFilters() {
        if (!elements.activeFiltersContainer) return;

        const activeFilters = [];

        // Category filters
        state.filters.categories.forEach(cat => {
            activeFilters.push({
                type: 'category',
                value: cat,
                label: cat
            });
        });

        // Tag filters
        state.filters.tags.forEach(tag => {
            activeFilters.push({
                type: 'tag',
                value: tag,
                label: tag
            });
        });

        // Featured filter
        if (state.filters.featured !== null) {
            activeFilters.push({
                type: 'featured',
                value: 'featured',
                label: 'Featured'
            });
        }

        // Search filter
        if (state.filters.search) {
            activeFilters.push({
                type: 'search',
                value: state.filters.search,
                label: `Search: "${state.filters.search}"`
            });
        }

        if (activeFilters.length === 0) {
            elements.activeFiltersContainer.innerHTML = '';
            elements.activeFiltersContainer.style.display = 'none';
            return;
        }

        elements.activeFiltersContainer.style.display = 'flex';
        elements.activeFiltersContainer.innerHTML = `
            <div class="active-filters-label">Active Filters:</div>
            ${activeFilters.map(filter => `
                <div class="active-filter-chip" data-filter-type="${filter.type}" data-filter-value="${filter.value}">
                    <span>${filter.label}</span>
                    <button class="remove-filter-chip" aria-label="Remove ${filter.label}">×</button>
                </div>
            `).join('')}
            <button class="clear-all-filters">Clear All</button>
        `;
    }

    // Apply all filters
    function applyFilters() {
        state.filteredItems = state.items.filter(item => {
            // Type filter
            if (state.filters.type !== 'all' && item.type !== state.filters.type) {
                return false;
            }

            // Multi-select category filter (OR logic - match any selected category)
            if (state.filters.categories.length > 0) {
                if (!state.filters.categories.includes(item.category)) {
                    return false;
                }
            }

            // Multi-select tag filter (AND logic - must have all selected tags)
            if (state.filters.tags.length > 0) {
                const hasAllTags = state.filters.tags.every(tag => item.tags.includes(tag));
                if (!hasAllTags) {
                    return false;
                }
            }

            // Featured filter
            if (state.filters.featured !== null && !item.featured) {
                return false;
            }

            // Search filter with highlighting
            if (state.filters.search) {
                const searchLower = state.filters.search;
                const searchableText = [
                    item.title,
                    item.description,
                    item.category,
                    ...item.tags
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchLower)) {
                    return false;
                }
            }

            return true;
        });

        state.currentPage = 1;
        sortPortfolio();
        displayPortfolio();
        updateResultCount();
    }

    // Update result count display
    function updateResultCount() {
        if (!elements.resultCount) return;

        const total = state.filteredItems.length;
        const showing = Math.min(state.currentPage * state.itemsPerPage, total);

        if (total === state.items.length) {
            elements.resultCount.textContent = `Showing all ${total} items`;
        } else {
            elements.resultCount.textContent = `Showing ${showing} of ${total} items (${state.items.length} total)`;
        }
    }

    // Sort portfolio items
    function sortPortfolio() {
        const sorted = [...state.filteredItems];

        switch (state.sortBy) {
            case 'latest':
                sorted.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'oldest':
                sorted.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'featured':
                sorted.sort((a, b) => {
                    if (a.featured === b.featured) {
                        return b.createdAt - a.createdAt;
                    }
                    return b.featured ? 1 : -1;
                });
                break;
            case 'views':
                sorted.sort((a, b) => b.views - a.views);
                break;
            case 'a-z':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'z-a':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
        }

        state.filteredItems = sorted;
    }

    // Display portfolio items
    function displayPortfolio() {
        if (!elements.portfolioGrid) return;

        const startIndex = 0;
        const endIndex = state.currentPage * state.itemsPerPage;
        const itemsToShow = state.filteredItems.slice(startIndex, endIndex);

        if (itemsToShow.length === 0) {
            showEmptyState(true);
            elements.portfolioGrid.innerHTML = '';
            updateLoadMore();
            return;
        }

        showEmptyState(false);
        elements.portfolioGrid.innerHTML = '';

        itemsToShow.forEach((item, index) => {
            const card = createPortfolioCard(item);
            elements.portfolioGrid.appendChild(card);

            // Staggered fade-in animation
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });

        updateLoadMore();
    }

    // Create portfolio card based on type
    function createPortfolioCard(item) {
        const card = document.createElement('div');
        card.className = `portfolio-card portfolio-card-${item.type}`;
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.4s ease';

        // Type indicator
        const typeIndicator = getTypeIndicator(item.type);

        // Featured badge
        const featuredBadge = item.featured
            ? '<span class="portfolio-badge featured-badge">Featured</span>'
            : '';

        // Type-specific badges
        let typeBadge = '';
        if (item.type === 'album') {
            typeBadge = `<span class="portfolio-badge count-badge">${item.metadata.photoCount} Photos</span>`;
        } else if (item.type === 'video') {
            typeBadge = `<span class="portfolio-badge duration-badge">${item.metadata.duration}</span>`;
        }

        card.innerHTML = `
            <div class="portfolio-thumbnail">
                <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
                <div class="portfolio-overlay">
                    ${typeIndicator}
                    <button class="portfolio-view-btn">
                        ${getViewButtonText(item.type)}
                    </button>
                </div>
                ${typeBadge}
                ${featuredBadge}
            </div>
            <div class="portfolio-info">
                <div class="portfolio-meta">
                    <span class="portfolio-type-badge ${item.type}">${item.type}</span>
                    <span class="portfolio-category">${item.category}</span>
                </div>
                <h3 class="portfolio-title">${item.title}</h3>
                <p class="portfolio-description">${truncateText(item.description, 120)}</p>
                <div class="portfolio-footer">
                    <div class="portfolio-tags">
                        ${item.tags.slice(0, 3).map(tag => `<span class="portfolio-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="portfolio-stats">
                        <span class="portfolio-views">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            ${formatViews(item.views)}
                        </span>
                    </div>
                </div>
            </div>
        `;

        // Add click handler
        card.addEventListener('click', () => openPortfolioItem(item));

        return card;
    }

    // Get type indicator icon
    function getTypeIndicator(type) {
        const icons = {
            album: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2"/>
            </svg>`,
            video: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <polygon points="5 3 19 12 5 21" fill="currentColor"/>
            </svg>`,
            project: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <polyline points="16 18 22 12 16 6" stroke="currentColor" stroke-width="2"/>
                <polyline points="8 6 2 12 8 18" stroke="currentColor" stroke-width="2"/>
            </svg>`
        };
        return `<div class="portfolio-type-icon">${icons[type] || ''}</div>`;
    }

    // Get view button text based on type
    function getViewButtonText(type) {
        const texts = {
            album: 'View Photos',
            video: 'Watch Video',
            project: 'View Project'
        };
        return texts[type] || 'View Details';
    }

    // Open portfolio item (delegate to existing modals)
    function openPortfolioItem(item) {
        // Track view
        trackView(item);

        switch (item.type) {
            case 'album':
                if (window.openAlbumModal) {
                    window.openAlbumModal(item.data);
                }
                break;
            case 'video':
                if (window.openVideoModal) {
                    window.openVideoModal(item.data);
                }
                break;
            case 'project':
                if (window.openProjectModal) {
                    window.openProjectModal(item.data);
                }
                break;
        }
    }

    // Track view count
    async function trackView(item) {
        try {
            const endpoints = {
                album: `/albums/${item.id}/view`,
                video: `/videos/${item.id}/view`,
                project: `/projects/${item.id}/view`
            };

            const endpoint = endpoints[item.type];
            if (endpoint) {
                await fetch(`${API_URL}${endpoint}`, { method: 'POST' });
                item.views += 1;
            }
        } catch (error) {
            // Silent fail for analytics
            console.debug('View tracking failed:', error);
        }
    }

    // Load more items
    function loadMore() {
        state.currentPage += 1;
        displayPortfolio();
    }

    // Update load more button visibility
    function updateLoadMore() {
        if (!elements.loadMoreBtn) return;

        const totalShown = state.currentPage * state.itemsPerPage;
        state.hasMore = totalShown < state.filteredItems.length;

        if (state.hasMore) {
            elements.loadMoreBtn.style.display = 'block';
            const remaining = state.filteredItems.length - totalShown;
            elements.loadMoreBtn.textContent = `Load More (${remaining} remaining)`;
        } else {
            elements.loadMoreBtn.style.display = 'none';
        }
    }

    // Utility functions
    function truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    function formatViews(views) {
        if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'k';
        }
        return views.toString();
    }

    function showLoading(show) {
        if (elements.loadingIndicator) {
            elements.loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }

    function showEmptyState(show) {
        if (elements.emptyState) {
            elements.emptyState.style.display = show ? 'block' : 'none';
        }
    }

    function showError(message) {
        console.error(message);
        if (elements.portfolioGrid) {
            elements.portfolioGrid.innerHTML = `
                <div class="portfolio-error">
                    <p>${message}</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    // Public API
    return {
        init,
        reload: loadPortfolio,
        getState: () => ({ ...state })
    };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PortfolioManager.init());
} else {
    PortfolioManager.init();
}

// Export for use in other scripts
window.PortfolioManager = PortfolioManager;
