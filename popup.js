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
        this.currentView = 'recent'; // 'recent' or 'favorites'
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadSettings();
        await this.loadFavorites();
        await this.loadHistory();
        this.renderWebsiteGroups();
        
        // Listen for settings updates
        if (chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message) => {
                if (message.action === 'settingsUpdated') {
                    this.refreshHistory();
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
    }
    
    async loadSettings() {
        try {
            // Check if chrome.storage is available
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available, using defaults');
                this.loadDefaultSettings();
                return;
            }
            
            const result = await chrome.storage.sync.get(['historyGroups']);
            const groups = result.historyGroups || [];
            
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
        this.categoryPatterns = {
            'Development': ['github.com', 'gitlab.com', 'bitbucket.org'],
            'Documentation': ['confluence.atlassian.com', 'notion.so', 'gitbook.com'],
            'Cloud Services': ['aws.amazon.com', 'console.cloud.google.com', 'portal.azure.com'],
            'Productivity': ['slack.com', 'discord.com', 'teams.microsoft.com'],
            'Google Workspace': ['docs.google.com', 'sheets.google.com', 'slides.google.com'],
            'Project Management': ['trello.com', 'asana.com', 'jira.atlassian.com'],
            'Design': ['figma.com', 'sketch.com', 'canva.com'],
            'Learning': ['stackoverflow.com', 'developer.mozilla.org', 'w3schools.com'],
            'Social Media': ['twitter.com', 'linkedin.com', 'reddit.com'],
            'Entertainment': ['youtube.com', 'netflix.com', 'spotify.com'],
            'News': ['news.ycombinator.com', 'techcrunch.com', 'medium.com'],
            'Others': ['']
        };
        
        this.categoryIcons = {
            'Development': '💻',
            'Documentation': '📚',
            'Cloud Services': '☁️',
            'Productivity': '⚡',
            'Google Workspace': '🔵',
            'Project Management': '📋',
            'Design': '🎨',
            'Learning': '🎓',
            'Social Media': '📱',
            'Entertainment': '🎬',
            'News': '📰',
            'Others': '🔗'
        };
        
        this.categoryOrder = Object.keys(this.categoryPatterns);
    }
    
    async loadFavorites() {
        try {
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available for favorites');
                return;
            }
            
            const result = await chrome.storage.sync.get(['siteForceFavorites']);
            if (result.siteForceFavorites && Array.isArray(result.siteForceFavorites)) {
                this.favorites = new Set(result.siteForceFavorites);
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
                siteForceFavorites: Array.from(this.favorites) 
            });
        } catch (error) {
            console.error('Error saving favorites:', error);
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
        const viewToggle = document.getElementById('viewToggle');
        searchBox.style.display = 'block';
        viewToggle.style.display = 'flex';
        
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
        const recentItems = group.items.slice(0, 50);
        
        recentItems.forEach(item => {
            const visitElement = this.createVisitElement(item);
            visitsContainer.appendChild(visitElement);
        });
    }
    
    createVisitElement(item) {
        const element = document.createElement('div');
        element.className = 'visit-item';
        
        const url = new URL(item.url);
        const domain = url.hostname;
        const timeAgo = this.getTimeAgo(item.lastVisitTime);
        
        const title = item.title || 'Untitled';
        
        const isFavorited = this.favorites.has(item.url);
        
        element.innerHTML = `
            <img class="favicon" src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" 
                 onerror="this.style.display='none'" alt="">
            <div class="details">
                <div class="title" title="${this.escapeHtml(title)}">${this.escapeHtml(title)}</div>
                <div class="url-container">
                    <div class="url" title="${this.escapeHtml(item.url)}">${this.escapeHtml(item.url)}</div>
                </div>
            </div>
            <div class="time">${timeAgo}</div>
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
        
        // Ensure URL is scrollable if content overflows
        setTimeout(() => {
            const urlElement = element.querySelector('.url');
            if (urlElement && urlElement.scrollWidth > urlElement.clientWidth) {
                urlElement.classList.add('scrollable');
            }
        }, 100);
        
        return element;
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
            document.getElementById('viewToggle').style.display = 'none';
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
}

// Initialize the extension when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new HistoryOrganizer();
});
