// Photo Album Gallery System
// Advanced gallery with zoom, fullscreen, keyboard, and touch navigation

(function() {
    let currentAlbum = null;
    let currentPhotos = [];
    let currentIndex = 0;
    let isFullscreen = false;
    let zoomLevel = 1;
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let translateX = 0;
    let translateY = 0;

    // Gallery HTML (injected on first use)
    function createGalleryHTML() {
        const html = `
            <div id="albumGalleryModal" class="album-gallery-modal" style="display: none;">
                <div class="gallery-backdrop"></div>
                <div class="gallery-container">
                    <div class="gallery-header">
                        <div class="gallery-info">
                            <h2 id="galleryAlbumTitle"></h2>
                            <p id="galleryPhotoCounter"></p>
                        </div>
                        <div class="gallery-controls">
                            <button id="galleryZoomIn" class="gallery-btn" title="Zoom In">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button id="galleryZoomOut" class="gallery-btn" title="Zoom Out">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                            </button>
                            <button id="galleryFullscreen" class="gallery-btn" title="Fullscreen">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                            </button>
                            <button id="galleryClose" class="gallery-btn" title="Close">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="gallery-main">
                        <button id="galleryPrev" class="gallery-nav-btn gallery-prev">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <div class="gallery-viewport">
                            <img id="galleryImage" src="" alt="" draggable="false">
                            <div id="galleryLoading" class="gallery-loading">
                                <div class="spinner"></div>
                            </div>
                        </div>
                        <button id="galleryNext" class="gallery-nav-btn gallery-next">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                    </div>
                    <div class="gallery-thumbnails" id="galleryThumbnails"></div>
                    <div class="gallery-caption">
                        <h3 id="galleryPhotoTitle"></h3>
                        <p id="galleryPhotoDescription"></p>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        addGalleryStyles();
        attachGalleryEvents();
    }

    function addGalleryStyles() {
        if (document.getElementById('albumGalleryStyles')) return;
        const style = document.createElement('style');
        style.id = 'albumGalleryStyles';
        style.textContent = `
.album-gallery-modal{position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;display:flex;align-items:center;justify-content:center}
.gallery-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.95);backdrop-filter:blur(10px)}
.gallery-container{position:relative;width:100%;height:100%;display:flex;flex-direction:column;z-index:1}
.gallery-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:rgba(0,0,0,0.3)}
.gallery-info h2{margin:0;color:#fff;font-size:1.25rem}
.gallery-info p{margin:0.25rem 0 0;color:#999;font-size:0.875rem}
.gallery-controls{display:flex;gap:0.5rem}
.gallery-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#fff;cursor:pointer;padding:0.5rem;transition:all 0.2s;width:40px;height:40px;display:flex;align-items:center;justify-content:center}
.gallery-btn:hover{background:rgba(255,255,255,0.2)}
.gallery-btn svg{width:20px;height:20px}
.gallery-main{flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.gallery-viewport{flex:1;display:flex;align-items:center;justify-content:center;height:100%;position:relative;overflow:hidden;cursor:move}
.gallery-viewport.zoomed{cursor:grab}
.gallery-viewport.dragging{cursor:grabbing}
#galleryImage{max-width:90%;max-height:90%;object-fit:contain;transition:transform 0.2s;user-select:none}
.gallery-loading{position:absolute;display:flex;align-items:center;justify-content:center}
.spinner{width:50px;height:50px;border:4px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.gallery-nav-btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:50%;color:#fff;cursor:pointer;width:60px;height:60px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;z-index:2}
.gallery-nav-btn:hover{background:rgba(0,0,0,0.8);transform:translateY(-50%) scale(1.1)}
.gallery-prev{left:2rem}
.gallery-next{right:2rem}
.gallery-nav-btn svg{width:30px;height:30px}
.gallery-thumbnails{display:flex;gap:0.5rem;padding:1rem 2rem;overflow-x:auto;background:rgba(0,0,0,0.3)}
.gallery-thumbnail{width:80px;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;opacity:0.5;transition:all 0.2s;border:2px solid transparent}
.gallery-thumbnail:hover{opacity:0.8;transform:scale(1.05)}
.gallery-thumbnail.active{opacity:1;border-color:#6366f1}
.gallery-caption{padding:1rem 2rem;background:rgba(0,0,0,0.3);color:#fff}
.gallery-caption h3{margin:0 0 0.5rem;font-size:1rem}
.gallery-caption p{margin:0;color:#999;font-size:0.875rem}
.gallery-thumbnails::-webkit-scrollbar{height:6px}
.gallery-thumbnails::-webkit-scrollbar-track{background:rgba(255,255,255,0.1)}
.gallery-thumbnails::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.3);border-radius:3px}
@media (max-width:768px){
.gallery-header{padding:0.75rem 1rem}
.gallery-info h2{font-size:1rem}
.gallery-nav-btn{width:45px;height:45px}
.gallery-prev{left:1rem}
.gallery-next{right:1rem}
.gallery-thumbnails{padding:0.75rem 1rem}
.gallery-thumbnail{width:60px;height:60px}
}
        `;
        document.head.appendChild(style);
    }

    function attachGalleryEvents() {
        const modal = document.getElementById('albumGalleryModal');
        const backdrop = modal.querySelector('.gallery-backdrop');
        const closeBtn = document.getElementById('galleryClose');
        const prevBtn = document.getElementById('galleryPrev');
        const nextBtn = document.getElementById('galleryNext');
        const zoomInBtn = document.getElementById('galleryZoomIn');
        const zoomOutBtn = document.getElementById('galleryZoomOut');
        const fullscreenBtn = document.getElementById('galleryFullscreen');
        const viewport = modal.querySelector('.gallery-viewport');
        const image = document.getElementById('galleryImage');

        backdrop.addEventListener('click', closeGallery);
        closeBtn.addEventListener('click', closeGallery);
        prevBtn.addEventListener('click', () => navigate(-1));
        nextBtn.addEventListener('click', () => navigate(1));
        zoomInBtn.addEventListener('click', () => zoom(0.2));
        zoomOutBtn.addEventListener('click', () => zoom(-0.2));
        fullscreenBtn.addEventListener('click', toggleFullscreen);

        // Keyboard
        document.addEventListener('keydown', handleKeyboard);

        // Touch/Swipe
        viewport.addEventListener('touchstart', handleTouchStart, {passive: true});
        viewport.addEventListener('touchmove', handleTouchMove, {passive: true});
        viewport.addEventListener('touchend', handleTouchEnd);

        // Mouse drag for zoomed images
        viewport.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Double-click to zoom
        image.addEventListener('dblclick', () => {
            if (zoomLevel > 1) resetZoom();
            else zoom(1);
        });

        // Prevent context menu
        image.addEventListener('contextmenu', e => e.preventDefault());
    }

    function handleKeyboard(e) {
        const modal = document.getElementById('albumGalleryModal');
        if (modal.style.display === 'none') return;

        switch(e.key) {
            case 'Escape': closeGallery(); break;
            case 'ArrowLeft': navigate(-1); break;
            case 'ArrowRight': navigate(1); break;
            case 'f': case 'F': toggleFullscreen(); break;
            case '+': case '=': zoom(0.2); break;
            case '-': case '_': zoom(-0.2); break;
            case '0': resetZoom(); break;
        }
    }

    function handleTouchStart(e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }

    function handleTouchMove(e) {
        if (!touchStartX || !touchStartY || e.touches.length !== 1) return;
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) navigate(1); else navigate(-1);
            touchStartX = 0;
            touchStartY = 0;
        }
    }

    function handleTouchEnd() {
        touchStartX = 0;
        touchStartY = 0;
    }

    function handleMouseDown(e) {
        if (zoomLevel <= 1) return;
        isDragging = true;
        dragStartX = e.clientX - translateX;
        dragStartY = e.clientY - translateY;
        document.querySelector('.gallery-viewport').classList.add('dragging');
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        translateX = e.clientX - dragStartX;
        translateY = e.clientY - dragStartY;
        applyTransform();
    }

    function handleMouseUp() {
        isDragging = false;
        document.querySelector('.gallery-viewport').classList.remove('dragging');
    }

    function applyTransform() {
        const image = document.getElementById('galleryImage');
        image.style.transform = `scale(${zoomLevel}) translate(${translateX/zoomLevel}px, ${translateY/zoomLevel}px)`;
    }

    function zoom(delta) {
        zoomLevel = Math.max(1, Math.min(4, zoomLevel + delta));
        if (zoomLevel === 1) {
            translateX = 0;
            translateY = 0;
        }
        applyTransform();
        document.querySelector('.gallery-viewport').classList.toggle('zoomed', zoomLevel > 1);
    }

    function resetZoom() {
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
        document.querySelector('.gallery-viewport').classList.remove('zoomed');
    }

    function navigate(direction) {
        currentIndex = (currentIndex + direction + currentPhotos.length) % currentPhotos.length;
        displayPhoto();
    }

    function displayPhoto() {
        const photo = currentPhotos[currentIndex];
        const image = document.getElementById('galleryImage');
        const loading = document.getElementById('galleryLoading');
        const title = document.getElementById('galleryPhotoTitle');
        const description = document.getElementById('galleryPhotoDescription');
        const counter = document.getElementById('galleryPhotoCounter');

        loading.style.display = 'flex';
        resetZoom();

        const imgUrl = (photo.fileSizes && photo.fileSizes.full && photo.fileSizes.full.path) || photo.optimized || photo.url;

        const img = new Image();
        img.onload = () => {
            image.src = imgUrl;
            loading.style.display = 'none';
        };
        img.src = imgUrl;

        title.textContent = photo.caption || photo.alt || '';
        description.textContent = photo.description || '';
        counter.textContent = `${currentIndex + 1} / ${currentPhotos.length}`;

        updateThumbnails();
    }

    function updateThumbnails() {
        const thumbs = document.querySelectorAll('.gallery-thumbnail');
        thumbs.forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === currentIndex);
            if (idx === currentIndex) {
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });
    }

    function renderThumbnails() {
        const container = document.getElementById('galleryThumbnails');
        container.innerHTML = currentPhotos.map((photo, idx) => {
            const thumbUrl = (photo.fileSizes && photo.fileSizes.thumbnail && photo.fileSizes.thumbnail.path) || photo.thumbnail || photo.url;
            return `<img src="${thumbUrl}" alt="" class="gallery-thumbnail ${idx === currentIndex ? 'active' : ''}" data-index="${idx}">`;
        }).join('');

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('gallery-thumbnail')) {
                currentIndex = parseInt(e.target.dataset.index);
                displayPhoto();
            }
        });
    }

    function toggleFullscreen() {
        const modal = document.getElementById('albumGalleryModal');
        if (!document.fullscreenElement) {
            modal.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen();
        }
    }

    function closeGallery() {
        const modal = document.getElementById('albumGalleryModal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        resetZoom();
        if (document.fullscreenElement) document.exitFullscreen();
    }

    async function openAlbumModal(album) {
        if (!document.getElementById('albumGalleryModal')) {
            createGalleryHTML();
        }

        currentAlbum = album;
        document.getElementById('galleryAlbumTitle').textContent = album.title || 'Photo Album';

        try {
            const response = await fetch(`/api/albums/${album._id}`);
            const data = await response.json();
            if (data.success && data.data.media) {
                currentPhotos = data.data.media.filter(m => m.type === 'image');
                if (currentPhotos.length === 0) {
                    alert('No photos in this album');
                    return;
                }
                currentIndex = 0;
                renderThumbnails();
                displayPhoto();

                const modal = document.getElementById('albumGalleryModal');
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        } catch (error) {
            console.error('Error loading album:', error);
            alert('Failed to load album photos');
        }
    }

    window.openAlbumModal = openAlbumModal;
})();
