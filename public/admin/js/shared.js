/**
 * Shared Constants and Utilities for Admin Dashboard
 * This file must be loaded BEFORE other admin JavaScript files
 */

// API Configuration - Shared across all admin pages
const API_BASE = window.location.origin;

// Shared state namespace to avoid global variable conflicts
window.AdminShared = {
    // Common pagination state
    pagination: {
        currentPage: 1,
        itemsPerPage: 24
    },

    // Common filter state
    filters: {
        search: '',
        type: '',
        category: '',
        visibility: '',
        featured: false,
        album: '',
        sort: 'newest'
    },

    // Common edit mode tracking
    editMode: {
        isActive: false,
        currentId: null
    },

    // Reset pagination
    resetPagination() {
        this.pagination.currentPage = 1;
    },

    // Reset filters
    resetFilters() {
        this.filters = {
            search: '',
            type: '',
            category: '',
            visibility: '',
            featured: false,
            album: '',
            sort: 'newest'
        };
    },

    // Reset edit mode
    resetEditMode() {
        this.editMode.isActive = false;
        this.editMode.currentId = null;
    }
};

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE, AdminShared: window.AdminShared };
}
