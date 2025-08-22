// Website grouping and history management
class HistoryOrganizer {
    constructor() {
        this.websiteGroups = new Map();
        this.selectedGroup = null;
        this.currentGroupData = null;
        this.allHistory = [];
        
        // Load website categories from settings
        this.categoryPatterns = {};
        this.categoryIcons = {};
        this.categoryOrder = [];
        
        // Favorites functionality
        this.favorites = new Set(); // Store favorite URLs
        this.favoriteTags = new Map(); // Store custom names/tags for favorites
        this.currentView = 'recent'; // 'recent' or 'favorites'
        
        // Visit frequency tracking using Set data structures
        this.visitFrequency = new Map(); // URL -> visit count
        this.topVisitedUrls = new Set(); // Set of most visited URLs
        this.recentVisitDates = new Map(); // URL -> Set of unique visit dates
        this.currentSortMode = 'frequency'; // 'frequency' or 'time'
        // Load configuration
        const config = window.BrowserHistoryOrganizerConfig;
        this.frequencyThresholds = config.frequencyThresholds;
        this.STORAGE_KEYS = config.storageKeys;
        
        // Storage management
        this.lastCleanupTime = 0;
        this.CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
        
        // Docking functionality
        this.isDocked = false;
        this.dockedWindow = null;
        this.dockSettings = config.dockSettings;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadSettings();
        await this.loadFavorites();
        await this.loadVisitFrequency(); // Load visit frequency data
        await this.loadDockSettings(); // Load dock preferences
        await this.performAggressiveCleanup(); // One-time aggressive cleanup
        await this.checkAndCleanupIfNeeded(); // Periodic cleanup
        await this.loadHistory();
        this.renderWebsiteGroups();
        
        // Listen for settings updates
        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message) => {
                if (message.action === 'settingsUpdated') {
                    console.log('Settings updated, reloading...');
                    this.loadSettings().then(() => {
                        this.refreshHistory();
                    });
                }
            });
        }
        
        // Listen for storage changes to update dock settings and groups
        if (chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'sync') {
                    if (changes[window.BrowserHistoryOrganizerConfig.storageKeys.dockSettings]) {
                        this.loadDockSettings();
                    }
                    if (changes[window.BrowserHistoryOrganizerConfig.storageKeys.websiteGroups]) {
                        console.log('Website groups changed in storage, reloading...');
                        this.loadSettings().then(() => {
                            this.refreshHistory();
                        });
                    }
                }
            });
        }
    }
    
    bindEvents() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshHistory();
        });
        
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            if (chrome.runtime && chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                console.warn('Cannot open options page - runtime API not available');
            }
        });
        
        // Search functionality for filtering within selected group
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterVisitItems(e.target.value);
        });
        
        // View toggle buttons
        document.getElementById('recentBtn').addEventListener('click', () => {
            this.switchView('recent');
        });
        
        document.getElementById('favoritesBtn').addEventListener('click', () => {
            this.switchView('favorites');
        });
        
        // Sort toggle buttons
        document.getElementById('frequencySort').addEventListener('click', () => {
            this.setSortMode('frequency');
        });
        
        document.getElementById('timeSort').addEventListener('click', () => {
            this.setSortMode('time');
        });
        
        // Dock button
        document.getElementById('dockBtn').addEventListener('click', () => {
            this.toggleDock();
        });
    }
    
    async loadSettings() {
        try {
            // Check if chrome.storage is available
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available, using defaults');
                this.loadDefaultSettings();
                return;
            }
            
            const result = await chrome.storage.sync.get([this.STORAGE_KEYS.websiteGroups]);
            const groups = result[this.STORAGE_KEYS.websiteGroups] || [];
            
            console.log('Loading groups in popup:', groups);
            
            // Convert groups to the format expected by the organizer
            this.categoryPatterns = {};
            this.categoryIcons = {};
            this.categoryOrder = [];
            
            groups
                .filter(group => group.enabled !== false)
                .sort((a, b) => a.order - b.order)
                .forEach(group => {
                    this.categoryPatterns[group.name] = group.patterns;
                    this.categoryIcons[group.name] = group.icon;
                    this.categoryOrder.push(group.name);
                });
            
            // Add "Others" category if not present
            if (!this.categoryPatterns['Others']) {
                this.categoryPatterns['Others'] = [];
                this.categoryIcons['Others'] = '🔗';
                this.categoryOrder.push('Others');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Fallback to default groups if settings fail to load
            this.loadDefaultSettings();
        }
        
        // If no groups were loaded, use defaults
        if (this.categoryOrder.length === 0) {
            this.loadDefaultSettings();
        }
    }
    
    loadDefaultSettings() {
        // Load from configuration preset
        const config = window.BrowserHistoryOrganizerConfig;
        
        this.categoryPatterns = {};
        this.categoryIcons = {};
        this.categoryOrder = [];
        
        // Convert groups array to legacy format for compatibility
        config.groups.forEach(group => {
            this.categoryPatterns[group.name] = group.patterns;
            this.categoryIcons[group.name] = group.icon;
            this.categoryOrder.push(group.name);
        });
    }
    
    async loadFavorites() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available for favorites');
                return;
            }
            
            const result = await chrome.storage.sync.get([this.STORAGE_KEYS.favorites, this.STORAGE_KEYS.favoriteTags]);
            if (result[this.STORAGE_KEYS.favorites] && Array.isArray(result[this.STORAGE_KEYS.favorites])) {
                this.favorites = new Set(result[this.STORAGE_KEYS.favorites]);
            }
            if (result[this.STORAGE_KEYS.favoriteTags] && typeof result[this.STORAGE_KEYS.favoriteTags] === 'object') {
                this.favoriteTags = new Map(Object.entries(result[this.STORAGE_KEYS.favoriteTags]));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }
    
    async saveFavorites() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available for favorites');
                return;
            }
            
            await chrome.storage.sync.set({ 
                [this.STORAGE_KEYS.favorites]: Array.from(this.favorites),
                [this.STORAGE_KEYS.favoriteTags]: Object.fromEntries(this.favoriteTags)
            });
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }
    
    async loadVisitFrequency() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available for visit frequency');
                return;
            }
            
            const result = await chrome.storage.sync.get([this.STORAGE_KEYS.visitFrequency, this.STORAGE_KEYS.topVisitedUrls]);
            
            if (result[this.STORAGE_KEYS.visitFrequency] && typeof result[this.STORAGE_KEYS.visitFrequency] === 'object') {
                this.visitFrequency = new Map(Object.entries(result[this.STORAGE_KEYS.visitFrequency]));
            }
            
            if (result[this.STORAGE_KEYS.topVisitedUrls] && Array.isArray(result[this.STORAGE_KEYS.topVisitedUrls])) {
                this.topVisitedUrls = new Set(result[this.STORAGE_KEYS.topVisitedUrls]);
            }
        } catch (error) {
            console.error('Error loading visit frequency:', error);
        }
    }
    
    async saveVisitFrequency() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available for visit frequency');
                return;
            }
            
            // Optimize storage by limiting data size (more aggressive)
            const optimizedFrequency = this.optimizeFrequencyData();
            const topVisited = Array.from(this.topVisitedUrls).slice(0, 30); // Limit to top 30
            
            await chrome.storage.sync.set({
                [this.STORAGE_KEYS.visitFrequency]: optimizedFrequency,
                [this.STORAGE_KEYS.topVisitedUrls]: topVisited
            });
        } catch (error) {
            if (error.message && error.message.includes('quota')) {
                console.warn('Storage quota exceeded, cleaning up old data...');
                await this.cleanupOldData();
                // Retry with reduced data
                try {
                    const minimalFrequency = this.getMinimalFrequencyData();
                    await chrome.storage.sync.set({
                        [this.STORAGE_KEYS.visitFrequency]: minimalFrequency,
                        [this.STORAGE_KEYS.topVisitedUrls]: Array.from(this.topVisitedUrls).slice(0, 10)
                    });
                } catch (retryError) {
                    console.error('Failed to save even minimal visit frequency data:', retryError);
                }
            } else {
                console.error('Error saving visit frequency:', error);
            }
        }
    }
    
    optimizeFrequencyData() {
        // Keep only URLs with visit count >= 3 and limit to top 50 (more aggressive)
        const filteredEntries = Array.from(this.visitFrequency.entries())
            .filter(([url, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50);
        
        return Object.fromEntries(filteredEntries);
    }
    
    getMinimalFrequencyData() {
        // Keep only top 15 most visited URLs (emergency fallback)
        const topEntries = Array.from(this.visitFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
        
        return Object.fromEntries(topEntries);
    }
    
    async cleanupOldData() {
        try {
            // Remove URLs with very low visit counts (more aggressive)
            for (const [url, count] of this.visitFrequency.entries()) {
                if (count < 3) {
                    this.visitFrequency.delete(url);
                    this.topVisitedUrls.delete(url);
                }
            }
            
            // Keep only top 30 URLs (more aggressive)
            const sortedEntries = Array.from(this.visitFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 30);
            
            this.visitFrequency = new Map(sortedEntries);
            this.topVisitedUrls = new Set(sortedEntries.map(([url]) => url));
            
            console.log('Cleaned up visit frequency data, kept top 30 URLs');
        } catch (error) {
            console.error('Error cleaning up data:', error);
        }
    }
    
    async performAggressiveCleanup() {
        try {
            // One-time aggressive cleanup to fix existing quota issues
            console.log('Performing aggressive cleanup to prevent quota issues...');
            
            // Keep only top 25 URLs with 3+ visits
            const aggressiveEntries = Array.from(this.visitFrequency.entries())
                .filter(([url, count]) => count >= 3)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 25);
            
            this.visitFrequency = new Map(aggressiveEntries);
            this.topVisitedUrls = new Set(aggressiveEntries.map(([url]) => url));
            
            // Save immediately with minimal data
            await this.saveVisitFrequency();
            
            console.log('Aggressive cleanup completed, kept top 25 URLs');
        } catch (error) {
            console.error('Error during aggressive cleanup:', error);
        }
    }
    
    async checkAndCleanupIfNeeded() {
        try {
            const now = Date.now();
            
            // Load last cleanup time from storage
            const result = await chrome.storage.sync.get(['lastCleanupTime']);
            const lastCleanup = result.lastCleanupTime || 0;
            
            // Check if cleanup is needed (once per day)
            if (now - lastCleanup > this.CLEANUP_INTERVAL) {
                console.log('Performing periodic data cleanup...');
                await this.cleanupOldData();
                await this.saveVisitFrequency();
                
                // Save cleanup timestamp
                await chrome.storage.sync.set({ lastCleanupTime: now });
                console.log('Periodic cleanup completed');
            }
        } catch (error) {
            console.error('Error during periodic cleanup check:', error);
        }
    }
    
    async loadDockSettings() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available for dock settings');
                return;
            }
            
            const result = await chrome.storage.sync.get([this.STORAGE_KEYS.dockSettings]);
            console.log('Loading dock settings from storage:', result);
            
            if (result[this.STORAGE_KEYS.dockSettings] && typeof result[this.STORAGE_KEYS.dockSettings] === 'object') {
                this.dockSettings = { ...this.dockSettings, ...result[this.STORAGE_KEYS.dockSettings] };
                console.log('Updated dock settings:', this.dockSettings);
            } else {
                console.log('No dock settings found in storage, using defaults:', this.dockSettings);
            }
            
            // Update dock button state based on enabled status
            this.updateDockButtonEnabled();
            
            // Auto-dock functionality removed - users can manually dock using the dock button
        } catch (error) {
            console.error('Error loading dock settings:', error);
        }
    }
    
    async saveDockSettings() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available for dock settings');
                return;
            }
            
            await chrome.storage.sync.set({
                [this.STORAGE_KEYS.dockSettings]: this.dockSettings
            });
        } catch (error) {
            console.error('Error saving dock settings:', error);
        }
    }
    
    async toggleFavorite(url) {
        if (this.favorites.has(url)) {
            this.favorites.delete(url);
        } else {
            this.favorites.add(url);
        }
        await this.saveFavorites();
        
        // Update UI if we're viewing favorites
        if (this.currentView === 'favorites') {
            this.switchView('favorites');
        }
    }
    
    async loadHistory() {
        try {
            // Get history from the last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            this.allHistory = await new Promise((resolve) => {
                chrome.history.search({
                    text: '',
                    startTime: thirtyDaysAgo,
                    maxResults: 2000
                }, resolve);
            });
            
            this.calculateVisitFrequency(this.allHistory);
            this.organizeHistory();
        } catch (error) {
            console.error('Error loading history:', error);
            this.showError('Failed to load history. Please check permissions.');
        }
    }
    
    organizeHistory() {
        this.websiteGroups.clear();
        
        // Initialize categories based on order
        this.categoryOrder.forEach(category => {
            this.websiteGroups.set(category, {
                name: category,
                items: [],
                totalVisits: 0,
                lastVisit: 0
            });
        });
        
        // Categorize history items
        this.allHistory.forEach(item => {
            if (!item.url) return;
            
            const url = new URL(item.url);
            const domain = url.hostname.toLowerCase();
            
            let categorized = false;
            
            // Check each category pattern
            for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
                if (patterns.some(pattern => domain.includes(pattern.toLowerCase()))) {
                    const group = this.websiteGroups.get(category);
                    group.items.push(item);
                    group.totalVisits += item.visitCount || 1;
                    group.lastVisit = Math.max(group.lastVisit, item.lastVisitTime || 0);
                    categorized = true;
                    break;
                }
            }
            
            // If not categorized, add to Others
            if (!categorized) {
                const othersGroup = this.websiteGroups.get('Others');
                othersGroup.items.push(item);
                othersGroup.totalVisits += item.visitCount || 1;
                othersGroup.lastVisit = Math.max(othersGroup.lastVisit, item.lastVisitTime || 0);
            }
        });
        
        // Remove empty groups
        for (const [key, group] of this.websiteGroups) {
            if (group.items.length === 0) {
                this.websiteGroups.delete(key);
            }
        }
        
        // Sort items within each group by last visit time
        this.websiteGroups.forEach(group => {
            group.items.sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0));
        });
    }
    
    renderWebsiteGroups() {
        const container = document.getElementById('websiteGroups');
        container.innerHTML = '';
        
        if (this.websiteGroups.size === 0) {
            container.innerHTML = '<div class="loading">No history found</div>';
            return;
        }
        
        // Sort groups by configured order
        const sortedGroups = this.categoryOrder
            .map(categoryName => [categoryName, this.websiteGroups.get(categoryName)])
            .filter(([, group]) => group && group.items.length > 0);
        
        sortedGroups.forEach(([key, group]) => {
            const groupElement = this.createWebsiteGroupElement(key, group);
            container.appendChild(groupElement);
        });
    }
    
    createWebsiteGroupElement(key, group) {
        const element = document.createElement('div');
        element.className = 'website-group';
        element.dataset.group = key;
        
        const favicon = this.getFaviconForCategory(key);
        const recentVisits = group.items.length;
        const totalVisits = group.totalVisits;
        
        element.innerHTML = `
            <div class="favicon">${favicon}</div>
            <div class="info">
                <div class="name">${group.name}</div>
                <div class="count">${recentVisits} sites • ${totalVisits} visits</div>
            </div>
        `;
        
        element.addEventListener('click', () => {
            this.selectWebsiteGroup(key, group, element);
        });
        
        return element;
    }
    
    getFaviconForCategory(category) {
        return this.categoryIcons[category] || '🌐';
    }
    
    selectWebsiteGroup(key, group, element) {
        // Remove active class from all groups
        document.querySelectorAll('.website-group').forEach(el => {
            el.classList.remove('active');
        });
        
        // Add active class to selected group
        element.classList.add('active');
        
        this.selectedGroup = key;
        this.currentGroupData = group; // Store for search filtering
        this.currentView = 'recent'; // Reset to recent view
        this.renderRecentVisits(group);
        
        // Show search box and toggle buttons when a group is selected
        const searchBox = document.getElementById('searchBoxRight');
        const panelControls = document.getElementById('panelControls');
        searchBox.style.display = 'block';
        panelControls.style.display = 'flex';
        
        // Reset toggle buttons
        document.getElementById('recentBtn').classList.add('active');
        document.getElementById('favoritesBtn').classList.remove('active');
        
        // Clear any previous search
        document.getElementById('searchInput').value = '';
    }
    
    renderRecentVisits(group, isFiltered = false) {
        const titleElement = document.getElementById('selectedGroupTitle');
        const countElement = document.getElementById('visitCount');
        const visitsContainer = document.getElementById('recentVisits');
        
        titleElement.textContent = group.name;
        const countText = isFiltered ? 
            `${group.items.length} filtered results` : 
            `${group.items.length} recent visits`;
        countElement.textContent = countText;
        
        visitsContainer.innerHTML = '';
        
        if (group.items.length === 0) {
            const emptyMessage = isFiltered ? 
                'No websites match your search' : 
                'No recent visits found';
            visitsContainer.innerHTML = `
                <div class="empty-state">
                    <p>${emptyMessage}</p>
                    ${isFiltered ? '<small>Try adjusting your search terms</small>' : ''}
                </div>
            `;
            return;
        }
        
        // Show up to 50 most recent visits
        // Sort items based on current sort mode
        const sortedItems = group.items.sort((a, b) => {
            if (this.currentSortMode === 'frequency') {
                const aFreq = this.visitFrequency.get(a.url) || 0;
                const bFreq = this.visitFrequency.get(b.url) || 0;
                const aIsTop = this.topVisitedUrls.has(a.url);
                const bIsTop = this.topVisitedUrls.has(b.url);
                
                // First priority: top visited sites
                if (aIsTop && !bIsTop) return -1;
                if (!aIsTop && bIsTop) return 1;
                
                // Second priority: visit frequency
                if (aFreq !== bFreq) return bFreq - aFreq;
                
                // Third priority: recency
                return b.lastVisitTime - a.lastVisitTime;
            } else {
                // Sort by recency only
                return b.lastVisitTime - a.lastVisitTime;
            }
        });
        
        const recentItems = sortedItems.slice(0, 50);
        
        recentItems.forEach(item => {
            const visitElement = this.createVisitElement(item);
            visitsContainer.appendChild(visitElement);
        });
    }
    
    createVisitElement(item) {
        const element = document.createElement('div');
        element.className = 'visit-item';
        element.dataset.url = item.url;
        
        const url = new URL(item.url);
        const domain = url.hostname;
        const timeAgo = this.getTimeAgo(item.lastVisitTime);
        
        const title = item.title || 'Untitled';
        const isFavorited = this.favorites.has(item.url);
        const customTag = this.favoriteTags.get(item.url);
        const frequencyBadge = this.getFrequencyBadge(item.url);
        
        // Use custom tag if available, otherwise use original title
        const displayTitle = customTag || title;
        
        element.innerHTML = `
            <img class="favicon" src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" 
                 onerror="this.style.display='none'" alt="">
            <div class="details">
                <div class="title ${customTag ? 'custom-tag' : ''}" title="${this.escapeHtml(displayTitle)}">
                    ${this.escapeHtml(displayTitle)}
                    ${customTag ? '<span class="tag-badge">🏷️</span>' : ''}
                    ${frequencyBadge.show ? `<span class="frequency-badge ${frequencyBadge.level}" style="color: ${frequencyBadge.color}" title="${frequencyBadge.label}: ${frequencyBadge.count} visits">${frequencyBadge.emoji}</span>` : ''}
                </div>
                <div class="url-container">
                    <div class="url" title="${this.escapeHtml(item.url)}">${this.escapeHtml(item.url)}</div>
                </div>
            </div>
            <div class="visit-stats">
                <div class="time">${timeAgo}</div>
                ${frequencyBadge.show ? `<div class="visit-count" title="${frequencyBadge.count} total visits">${frequencyBadge.count}</div>` : ''}
            </div>
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                ${isFavorited ? '★' : '☆'}
            </button>
        `;
        
        // Add click handler for main element (excluding favorite button)
        element.addEventListener('click', (e) => {
            // Check if the click is on the favorite button or its content
            if (e.target.classList.contains('favorite-btn') || 
                e.target.closest('.favorite-btn')) {
                return; // Don't open URL if clicking favorite button
            }
            chrome.tabs.create({ url: item.url });
        });
        
        // Add favorite button handler
        const favoriteBtn = element.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(item.url);
            // Update button appearance
            const isFavorited = this.favorites.has(item.url);
            favoriteBtn.className = `favorite-btn ${isFavorited ? 'favorited' : ''}`;
            favoriteBtn.textContent = isFavorited ? '★' : '☆';
            favoriteBtn.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
        });
        
        // Add context menu handler
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showFavoriteTagModal(item.url, item.title);
        });
        
        // Ensure URL is scrollable if content overflows
        setTimeout(() => {
            const urlElement = element.querySelector('.url');
            if (urlElement && urlElement.scrollWidth > urlElement.clientWidth) {
                urlElement.classList.add('scrollable');
            }
        }, 100);
        
        return element;
    }
    
    showFavoriteTagModal(url, originalTitle) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('tagModal');
        if (!modal) {
            modal = this.createTagModal();
            document.body.appendChild(modal);
        }
        
        const currentTag = this.favoriteTags.get(url) || '';
        const titleInput = modal.querySelector('#tagInput');
        const urlDisplay = modal.querySelector('#tagUrl');
        const saveBtn = modal.querySelector('#saveTagBtn');
        const deleteBtn = modal.querySelector('#deleteTagBtn');
        const addFavBtn = modal.querySelector('#addFavoriteBtn');
        
        titleInput.value = currentTag;
        urlDisplay.textContent = url;
        
        // Show/hide buttons based on current state
        const isFavorited = this.favorites.has(url);
        const hasCustomTag = this.favoriteTags.has(url);
        
        addFavBtn.style.display = isFavorited ? 'none' : 'block';
        deleteBtn.style.display = hasCustomTag ? 'block' : 'none';
        
        // Set up event listeners
        saveBtn.onclick = () => this.saveTag(url, titleInput.value.trim());
        deleteBtn.onclick = () => this.deleteTag(url);
        addFavBtn.onclick = () => this.addToFavorites(url, titleInput.value.trim());
        
        modal.style.display = 'block';
        titleInput.focus();
        titleInput.select();
    }
    
    createTagModal() {
        const modal = document.createElement('div');
        modal.id = 'tagModal';
        modal.className = 'tag-modal';
        modal.innerHTML = `
            <div class="tag-modal-content">
                <h3>🏷️ Customize Favorite</h3>
                <div class="tag-form">
                    <label for="tagInput">Custom Name:</label>
                    <input type="text" id="tagInput" placeholder="Enter custom name for this favorite...">
                    <div class="tag-url">
                        <small>URL: <span id="tagUrl"></span></small>
                    </div>
                    <div class="tag-actions">
                        <button id="saveTagBtn" class="btn btn-primary">💾 Save Tag</button>
                        <button id="addFavoriteBtn" class="btn btn-success">⭐ Add to Favorites</button>
                        <button id="deleteTagBtn" class="btn btn-danger">🗑️ Delete Tag</button>
                        <button id="cancelTagBtn" class="btn btn-outline">✕ Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add cancel functionality
        modal.querySelector('#cancelTagBtn').onclick = () => {
            modal.style.display = 'none';
        };
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        return modal;
    }
    
    async saveTag(url, customName) {
        if (customName) {
            this.favoriteTags.set(url, customName);
            if (!this.favorites.has(url)) {
                this.favorites.add(url);
            }
        } else {
            this.favoriteTags.delete(url);
        }
        
        await this.saveFavorites();
        this.refreshCurrentView();
        document.getElementById('tagModal').style.display = 'none';
    }
    
    async deleteTag(url) {
        this.favoriteTags.delete(url);
        await this.saveFavorites();
        this.refreshCurrentView();
        document.getElementById('tagModal').style.display = 'none';
    }
    
    async addToFavorites(url, customName) {
        this.favorites.add(url);
        if (customName) {
            this.favoriteTags.set(url, customName);
        }
        await this.saveFavorites();
        this.refreshCurrentView();
        document.getElementById('tagModal').style.display = 'none';
    }
    
    refreshCurrentView() {
        if (this.currentView === 'favorites') {
            this.renderFavorites();
        } else if (this.currentGroupData) {
            this.renderRecentVisits(this.currentGroupData);
        }
    }
    
    showToast(message, type = 'info') {
        // Create toast if it doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        // Set message and type
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    setSortMode(mode) {
        this.currentSortMode = mode;
        
        // Update button states
        document.getElementById('frequencySort').classList.toggle('active', mode === 'frequency');
        document.getElementById('timeSort').classList.toggle('active', mode === 'time');
        
        // Refresh current view with new sorting
        this.refreshCurrentView();
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    truncateUrl(url) {
        // Show full URL but in a more readable format
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname + urlObj.search + urlObj.hash;
            return urlObj.hostname + path;
        } catch {
            return url;
        }
    }
    
    filterVisitItems(searchTerm) {
        if (!this.currentGroupData) return;
        
        const term = searchTerm.toLowerCase();
        const filteredItems = this.currentGroupData.items.filter(item => {
            const title = (item.title || '').toLowerCase();
            const url = (item.url || '').toLowerCase();
            return term === '' || title.includes(term) || url.includes(term);
        });
        
        // Create a temporary group object with filtered items
        const filteredGroup = {
            ...this.currentGroupData,
            items: filteredItems
        };
        
        this.renderRecentVisits(filteredGroup, true); // Pass flag to indicate filtered view
    }
    
    switchView(viewType) {
        this.currentView = viewType;
        
        // Update button states
        document.getElementById('recentBtn').classList.toggle('active', viewType === 'recent');
        document.getElementById('favoritesBtn').classList.toggle('active', viewType === 'favorites');
        
        if (viewType === 'favorites') {
            this.renderFavorites();
        } else {
            // Show recent visits for current group
            if (this.currentGroupData) {
                this.renderRecentVisits(this.currentGroupData);
            }
        }
    }
    
    renderFavorites() {
        const titleElement = document.getElementById('selectedGroupTitle');
        const countElement = document.getElementById('visitCount');
        const container = document.getElementById('recentVisits');
        
        titleElement.textContent = '⭐ Favorites';
        
        if (this.favorites.size === 0) {
            countElement.textContent = '';
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⭐</div>
                    <p>No favorites yet</p>
                    <small>Click the star icon next to any website to add it to favorites</small>
                </div>
            `;
            return;
        }
        
        // Get favorite items from current group
        const favoriteItems = this.currentGroupData ? 
            this.currentGroupData.items.filter(item => this.favorites.has(item.url)) : [];
        
        countElement.textContent = `${favoriteItems.length} favorite${favoriteItems.length !== 1 ? 's' : ''}`;
        
        if (favoriteItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⭐</div>
                    <p>No favorites in this group</p>
                    <small>Click the star icon next to any website to add it to favorites</small>
                </div>
            `;
            return;
        }
        
        // Clear container and add elements with proper event listeners
        container.innerHTML = '';
        favoriteItems.forEach(item => {
            const element = this.createVisitElement(item);
            container.appendChild(element);
        });
    }
    
    async refreshHistory() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.style.opacity = '0.5';
        refreshBtn.style.pointerEvents = 'none';
        
        try {
            await this.loadSettings();
            await this.loadHistory();
            this.renderWebsiteGroups();
            
            // Clear selection
            this.selectedGroup = null;
            this.currentGroupData = null;
            document.getElementById('selectedGroupTitle').textContent = 'Select a website group';
            document.getElementById('visitCount').textContent = '';
            document.getElementById('searchBoxRight').style.display = 'none';
            document.getElementById('panelControls').style.display = 'none';
            document.getElementById('recentVisits').innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    <p>Click on a website group to view recent visits</p>
                </div>
            `;
        } catch (error) {
            console.error('Error refreshing history:', error);
        } finally {
            refreshBtn.style.opacity = '1';
            refreshBtn.style.pointerEvents = 'auto';
        }
    }
    
    showError(message) {
        const container = document.getElementById('websiteGroups');
        container.innerHTML = `
            <div class="loading" style="color: #ef4444;">
                ${message}
            </div>
        `;
    }
    
    calculateVisitFrequency(historyItems) {
        // Clear existing frequency data
        this.visitFrequency.clear();
        this.recentVisitDates.clear();
        
        // Track visit counts and dates using Set data structures
        historyItems.forEach(item => {
            const url = item.url;
            const visitCount = item.visitCount || 1;
            const visitDate = new Date(item.lastVisitTime).toDateString();
            
            // Update visit frequency
            this.visitFrequency.set(url, (this.visitFrequency.get(url) || 0) + visitCount);
            
            // Track unique visit dates using Set
            if (!this.recentVisitDates.has(url)) {
                this.recentVisitDates.set(url, new Set());
            }
            this.recentVisitDates.get(url).add(visitDate);
        });
        
        // Update top visited URLs set (top 20% or minimum 10 sites)
        let sortedByFrequency = Array.from(this.visitFrequency.entries())
            .sort((a, b) => b[1] - a[1]);
        
        // Limit data growth - if we have too many entries, keep only top ones (more aggressive)
        if (sortedByFrequency.length > 75) {
            const limitedEntries = sortedByFrequency.slice(0, 50);
            this.visitFrequency = new Map(limitedEntries);
            sortedByFrequency = limitedEntries;
            console.log('Limited visit frequency data to top 50 entries');
        }
        
        const topCount = Math.max(10, Math.floor(sortedByFrequency.length * 0.2));
        this.topVisitedUrls.clear();
        
        sortedByFrequency.slice(0, topCount).forEach(([url]) => {
            this.topVisitedUrls.add(url);
        });
        
        // Save frequency data
        this.saveVisitFrequency();
    }
    
    getVisitFrequencyLevel(url) {
        const count = this.visitFrequency.get(url) || 0;
        if (count >= this.frequencyThresholds.high) return 'high';
        if (count >= this.frequencyThresholds.medium) return 'medium';
        if (count >= this.frequencyThresholds.low) return 'low';
        return 'rare';
    }
    
    getFrequencyBadge(url) {
        const level = this.getVisitFrequencyLevel(url);
        const count = this.visitFrequency.get(url) || 0;
        const isTopVisited = this.topVisitedUrls.has(url);
        
        const badges = {
            high: { emoji: '🔥', label: 'Hot', color: '#ef4444' },
            medium: { emoji: '⚡', label: 'Active', color: '#f59e0b' },
            low: { emoji: '📈', label: 'Regular', color: '#10b981' },
            rare: { emoji: '', label: '', color: '' }
        };
        
        const badge = badges[level];
        
        return {
            ...badge,
            count,
            isTopVisited,
            show: level !== 'rare' || isTopVisited
        };
    }
    
    async toggleDock() {
        // Check if docking is enabled
        if (!this.dockSettings.enabled) {
            console.warn('Docking is disabled in settings');
            this.showToast('❌ Docking is disabled. Enable it in settings first.', 'error');
            return;
        }
        
        if (this.isDocked) {
            this.undockWindow();
        } else {
            await this.createDockedWindow();
        }
    }
    
    async createDockedWindow() {
        try {
            // Reload dock settings to get the latest values
            await this.loadDockSettings();
            
            // Get display info for positioning
            const displays = await new Promise((resolve) => {
                if (chrome.system && chrome.system.display) {
                    chrome.system.display.getInfo(resolve);
                } else {
                    resolve([{ bounds: { width: 1920, height: 1080 } }]);
                }
            });
            
            const primaryDisplay = displays[0];
            const screenWidth = primaryDisplay.bounds.width;
            const screenHeight = primaryDisplay.bounds.height;
            
            // Calculate position based on dock side
            const dockWidth = this.dockSettings.width || 400;
            const dockHeight = Math.min(800, screenHeight - 100);
            
            console.log('Creating docked window with settings:', this.dockSettings);
            console.log('Dock width:', dockWidth, 'Dock height:', dockHeight);
            
            let left, top;
            if (this.dockSettings.side === 'right') {
                left = screenWidth - dockWidth - 20;
            } else {
                left = 20;
            }
            top = Math.max(50, (screenHeight - dockHeight) / 2);
            
            // Create the docked window
            const dockedWindow = await new Promise((resolve) => {
                chrome.windows.create({
                    url: chrome.runtime.getURL('popup.html?docked=true'),
                    type: 'popup',
                    width: dockWidth,
                    height: dockHeight,
                    left: Math.round(left),
                    top: Math.round(top),
                    focused: true
                }, resolve);
            });
            
            this.dockedWindow = dockedWindow;
            this.isDocked = true;
            
            // Update dock button appearance
            this.updateDockButton();
            
            // Close the original popup
            if (window.close) {
                window.close();
            }
            
        } catch (error) {
            console.error('Error creating docked window:', error);
        }
    }
    
    undockWindow() {
        if (this.dockedWindow) {
            chrome.windows.remove(this.dockedWindow.id);
            this.dockedWindow = null;
        }
        this.isDocked = false;
        this.updateDockButton();
    }
    
    updateDockButton() {
        const dockBtn = document.getElementById('dockBtn');
        if (dockBtn) {
            if (this.isDocked) {
                dockBtn.title = 'Undock Window';
                dockBtn.classList.add('docked');
                dockBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <path d="M9 3v18"></path>
                        <path d="M15 9l-3-3-3 3"></path>
                    </svg>
                `;
            } else {
                dockBtn.title = 'Dock Window';
                dockBtn.classList.remove('docked');
                dockBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                `;
            }
        }
    }
    
    updateDockButtonEnabled() {
        const dockBtn = document.getElementById('dockBtn');
        if (dockBtn) {
            if (this.dockSettings.enabled) {
                dockBtn.classList.remove('disabled');
                dockBtn.title = 'Dock Window';
                dockBtn.style.opacity = '1';
                dockBtn.style.cursor = 'pointer';
            } else {
                dockBtn.classList.add('disabled');
                dockBtn.title = 'Docking is disabled. Enable it in settings.';
                dockBtn.style.opacity = '0.5';
                dockBtn.style.cursor = 'not-allowed';
            }
        }
    }
    
    // isDockedWindow function removed - auto-start functionality no longer needed
    
    // Check if running in docked mode
    checkDockedMode() {
        // If this is a popup window (not the extension popup), consider it docked
        if (window.location.search.includes('docked') || 
            (window.outerWidth < 500 && window.outerHeight > 600)) {
            this.isDocked = true;
            this.updateDockButton();
            
            // Make the container fit the docked window
            const container = document.querySelector('.container');
            if (container) {
                container.style.width = '100%';
                container.style.height = '100vh';
                container.style.borderRadius = '0';
                container.style.boxShadow = 'none';
            }
        }
    }
}

// Initialize the extension when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    const organizer = new HistoryOrganizer();
    organizer.checkDockedMode();
});
