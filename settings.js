// Settings management for Browser History Organizer
class SettingsManager {
    constructor() {
        this.groups = [];
        this.currentEditingGroup = null;
        this.draggedElement = null;
        
        // Default groups configuration - Generic examples
        this.defaultGroups = [
            {
                id: 'development',
                name: 'Development',
                icon: '💻',
                patterns: ['github.com', 'gitlab.com', 'bitbucket.org'],
                enabled: true,
                order: 0
            },
            {
                id: 'documentation',
                name: 'Documentation',
                icon: '📚',
                patterns: ['confluence.atlassian.com', 'notion.so', 'gitbook.com'],
                enabled: true,
                order: 1
            },
            {
                id: 'cloud-services',
                name: 'Cloud Services',
                icon: '☁️',
                patterns: ['aws.amazon.com', 'console.cloud.google.com', 'portal.azure.com'],
                enabled: true,
                order: 2
            },
            {
                id: 'productivity',
                name: 'Productivity',
                icon: '⚡',
                patterns: ['slack.com', 'discord.com', 'teams.microsoft.com'],
                enabled: true,
                order: 3
            },
            {
                id: 'google-workspace',
                name: 'Google Workspace',
                icon: '🔵',
                patterns: ['docs.google.com', 'sheets.google.com', 'slides.google.com'],
                enabled: true,
                order: 4
            },
            {
                id: 'project-management',
                name: 'Project Management',
                icon: '📋',
                patterns: ['trello.com', 'asana.com', 'jira.atlassian.com'],
                enabled: true,
                order: 5
            },
            {
                id: 'design',
                name: 'Design',
                icon: '🎨',
                patterns: ['figma.com', 'sketch.com', 'canva.com'],
                enabled: true,
                order: 6
            },
            {
                id: 'learning',
                name: 'Learning',
                icon: '🎓',
                patterns: ['stackoverflow.com', 'developer.mozilla.org', 'w3schools.com'],
                enabled: true,
                order: 7
            },
            {
                id: 'social-media',
                name: 'Social Media',
                icon: '📱',
                patterns: ['twitter.com', 'linkedin.com', 'reddit.com'],
                enabled: true,
                order: 8
            },
            {
                id: 'entertainment',
                name: 'Entertainment',
                icon: '🎬',
                patterns: ['youtube.com', 'netflix.com', 'spotify.com'],
                enabled: true,
                order: 9
            },
            {
                id: 'news',
                name: 'News',
                icon: '📰',
                patterns: ['news.ycombinator.com', 'techcrunch.com', 'medium.com'],
                enabled: true,
                order: 10
            }
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.bindEvents();
        this.renderGroups();
    }
    
    bindEvents() {
        // Main action buttons
        document.getElementById('addGroupBtn').addEventListener('click', () => this.showAddGroupModal());
        document.getElementById('resetDefaultsBtn').addEventListener('click', () => this.resetToDefaults());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelChanges());
        
        // Import/Export
        document.getElementById('exportBtn').addEventListener('click', () => this.exportSettings());
        document.getElementById('importBtn').addEventListener('click', () => this.importSettings());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleImportFile(e));
        
        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('saveGroupBtn').addEventListener('click', () => this.saveGroup());
        document.getElementById('cancelGroupBtn').addEventListener('click', () => this.hideModal());
        
        // Click outside modal to close
        document.getElementById('groupModal').addEventListener('click', (e) => {
            if (e.target.id === 'groupModal') {
                this.hideModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
        
        // Event delegation for dynamically created buttons
        document.getElementById('groupsList').addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            const groupId = button.dataset.groupId;
            
            switch (action) {
                case 'add-group':
                    this.showAddGroupModal();
                    break;
                case 'toggle-group':
                    this.toggleGroup(groupId);
                    break;
                case 'edit-group':
                    this.editGroup(groupId);
                    break;
                case 'delete-group':
                    this.deleteGroup(groupId);
                    break;
            }
        });
        
        // Icon dropdown and custom input handling
        document.getElementById('iconDropdown').addEventListener('change', (e) => {
            this.handleIconSelection(e.target.value);
        });
        
        document.getElementById('groupIcon').addEventListener('input', (e) => {
            this.updateIconPreview(e.target.value);
        });
    }
    
    async loadSettings() {
        try {
            // Check if chrome.storage is available
            if (!chrome.storage || !chrome.storage.sync) {
                console.warn('Chrome storage API not available, using defaults');
                this.groups = [...this.defaultGroups];
                return;
            }
            
            const result = await chrome.storage.sync.get(['historyGroups']);
            if (result.historyGroups && result.historyGroups.length > 0) {
                this.groups = result.historyGroups;
            } else {
                // First time setup - use defaults
                this.groups = [...this.defaultGroups];
                await this.saveSettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.groups = [...this.defaultGroups];
        }
    }
    
    async saveSettings() {
        try {
            // Check if chrome.storage is available
            if (!chrome.storage || !chrome.storage.sync) {
                this.showToast('Storage not available. Settings cannot be saved.', 'error');
                return;
            }
            
            await chrome.storage.sync.set({ historyGroups: this.groups });
            this.showToast('Settings saved successfully!', 'success');
            
            // Notify popup to refresh if it's open
            if (chrome.runtime && chrome.runtime.sendMessage) {
                try {
                    chrome.runtime.sendMessage({ action: 'settingsUpdated' });
                } catch (e) {
                    // Popup might not be open, ignore error
                    console.log('Could not notify popup of settings update:', e.message);
                }
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings. Please try again.', 'error');
        }
    }
    
    renderGroups() {
        const container = document.getElementById('groupsList');
        
        if (this.groups.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📂</div>
                    <p>No website groups configured</p>
                    <button class="btn btn-primary" data-action="add-group">
                        <span class="icon">+</span>
                        Add Your First Group
                    </button>
                </div>
            `;
            return;
        }
        
        // Sort groups by order
        const sortedGroups = [...this.groups].sort((a, b) => a.order - b.order);
        
        container.innerHTML = sortedGroups.map((group, index) => `
            <div class="group-item" draggable="true" data-group-id="${group.id}">
                <div class="drag-handle">⋮⋮</div>
                <div class="group-header">
                    <div class="group-info">
                        <div class="group-icon">${group.icon}</div>
                        <div>
                            <div class="group-name">${this.escapeHtml(group.name)}</div>
                            <div class="group-patterns">
                                <span class="pattern-count">${group.patterns.length} patterns</span>
                                ${group.patterns.slice(0, 3).map(p => this.escapeHtml(p)).join(', ')}
                                ${group.patterns.length > 3 ? '...' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="group-actions">
                        <button class="btn btn-secondary" data-action="toggle-group" data-group-id="${group.id}" title="${group.enabled ? 'Disable group' : 'Enable group'}">
                            ${group.enabled ? '🟢' : '🔴'}
                        </button>
                        <button class="btn btn-secondary" data-action="edit-group" data-group-id="${group.id}" title="Edit group">
                            ✏️
                        </button>
                        <button class="btn btn-danger" data-action="delete-group" data-group-id="${group.id}" title="Delete group">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add drag and drop event listeners
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const groupItems = document.querySelectorAll('.group-item');
        
        groupItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedElement = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedElement = null;
                // Remove drag-over class from all items
                groupItems.forEach(el => el.classList.remove('drag-over'));
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (this.draggedElement && this.draggedElement !== item) {
                    item.classList.add('drag-over');
                }
            });
            
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                if (this.draggedElement && this.draggedElement !== item) {
                    this.reorderGroups(this.draggedElement, item);
                }
            });
        });
    }
    
    reorderGroups(draggedItem, targetItem) {
        const draggedId = draggedItem.dataset.groupId;
        const targetId = targetItem.dataset.groupId;
        
        const draggedIndex = this.groups.findIndex(g => g.id === draggedId);
        const targetIndex = this.groups.findIndex(g => g.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Remove dragged item
        const [draggedGroup] = this.groups.splice(draggedIndex, 1);
        
        // Insert at new position
        this.groups.splice(targetIndex, 0, draggedGroup);
        
        // Update order values
        this.groups.forEach((group, index) => {
            group.order = index;
        });
        
        this.renderGroups();
        this.showToast('Groups reordered. Don\'t forget to save!', 'success');
    }
    
    showAddGroupModal() {
        this.currentEditingGroup = null;
        document.getElementById('modalTitle').textContent = 'Add New Group';
        document.getElementById('groupName').value = '';
        document.getElementById('iconDropdown').value = '';
        document.getElementById('groupIcon').value = '';
        document.getElementById('groupIcon').style.display = 'none';
        document.getElementById('groupPatterns').value = '';
        this.updateIconPreview('🎯'); // Default icon
        this.showModal();
    }
    
    editGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        this.currentEditingGroup = group;
        document.getElementById('modalTitle').textContent = 'Edit Group';
        document.getElementById('groupName').value = group.name;
        
        // Check if icon exists in dropdown
        const dropdown = document.getElementById('iconDropdown');
        const iconExists = Array.from(dropdown.options).some(option => option.value === group.icon);
        
        if (iconExists) {
            dropdown.value = group.icon;
            document.getElementById('groupIcon').style.display = 'none';
        } else {
            dropdown.value = 'custom';
            document.getElementById('groupIcon').value = group.icon;
            document.getElementById('groupIcon').style.display = 'block';
        }
        
        this.updateIconPreview(group.icon);
        document.getElementById('groupPatterns').value = group.patterns.join('\\n');
        this.showModal();
    }
    
    saveGroup() {
        const name = document.getElementById('groupName').value.trim();
        const dropdown = document.getElementById('iconDropdown');
        const customIcon = document.getElementById('groupIcon').value.trim();
        const patternsText = document.getElementById('groupPatterns').value.trim();
        
        // Determine which icon to use
        let icon = '';
        if (dropdown.value === 'custom') {
            icon = customIcon;
        } else if (dropdown.value) {
            icon = dropdown.value;
        }
        
        if (!name || !icon || !patternsText) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        const patterns = patternsText.split('\\n')
            .map(p => p.trim())
            .filter(p => p.length > 0);
        
        if (patterns.length === 0) {
            this.showToast('Please enter at least one website pattern', 'error');
            return;
        }
        
        if (this.currentEditingGroup) {
            // Edit existing group
            this.currentEditingGroup.name = name;
            this.currentEditingGroup.icon = icon;
            this.currentEditingGroup.patterns = patterns;
        } else {
            // Add new group
            const newGroup = {
                id: 'custom_' + Date.now(),
                name: name,
                icon: icon,
                patterns: patterns,
                enabled: true,
                order: this.groups.length
            };
            this.groups.push(newGroup);
        }
        
        this.renderGroups();
        this.hideModal();
        this.showToast('Group saved successfully!', 'success');
    }
    
    toggleGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.enabled = !group.enabled;
            this.renderGroups();
            this.showToast(`Group ${group.enabled ? 'enabled' : 'disabled'}`, 'success');
        }
    }
    
    deleteGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        if (confirm(`Are you sure you want to delete the "${group.name}" group?`)) {
            this.groups = this.groups.filter(g => g.id !== groupId);
            this.renderGroups();
            this.showToast('Group deleted successfully', 'success');
        }
    }
    
    async resetToDefaults() {
        if (confirm('This will reset all groups to default settings. Are you sure?')) {
            this.groups = [...this.defaultGroups];
            this.renderGroups();
            this.showToast('Groups reset to defaults', 'success');
        }
    }
    
    exportSettings() {
        const settings = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            groups: this.groups
        };
        
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `history-organizer-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('Settings exported successfully!', 'success');
    }
    
    importSettings() {
        document.getElementById('importFile').click();
    }
    
    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                if (!settings.groups || !Array.isArray(settings.groups)) {
                    throw new Error('Invalid settings file format');
                }
                
                // Validate groups structure
                const validGroups = settings.groups.filter(group => 
                    group.id && group.name && group.icon && 
                    Array.isArray(group.patterns) && group.patterns.length > 0
                );
                
                if (validGroups.length === 0) {
                    throw new Error('No valid groups found in settings file');
                }
                
                if (confirm(`Import ${validGroups.length} groups? This will replace your current configuration.`)) {
                    this.groups = validGroups.map((group, index) => ({
                        ...group,
                        order: index,
                        enabled: group.enabled !== false
                    }));
                    
                    this.renderGroups();
                    this.showToast('Settings imported successfully!', 'success');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Error importing settings. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }
    
    cancelChanges() {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            this.loadSettings().then(() => {
                this.renderGroups();
                this.showToast('Changes cancelled', 'success');
            });
        }
    }
    
    showModal() {
        const modal = document.getElementById('groupModal');
        modal.classList.add('show');
        document.getElementById('groupName').focus();
    }
    
    hideModal() {
        const modal = document.getElementById('groupModal');
        modal.classList.remove('show');
        this.currentEditingGroup = null;
    }
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const messageEl = document.getElementById('toastMessage');
        
        messageEl.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    handleIconSelection(value) {
        const customInput = document.getElementById('groupIcon');
        const preview = document.getElementById('iconPreview');
        
        if (value === 'custom') {
            // Show custom input
            customInput.style.display = 'block';
            customInput.focus();
            this.updateIconPreview(customInput.value || '🎯');
        } else if (value) {
            // Use dropdown selection
            customInput.style.display = 'none';
            customInput.value = '';
            this.updateIconPreview(value);
        } else {
            // No selection
            customInput.style.display = 'none';
            customInput.value = '';
            this.updateIconPreview('🎯');
        }
        
        // Add active state to preview
        preview.classList.add('active');
        setTimeout(() => preview.classList.remove('active'), 300);
    }
    
    updateIconPreview(icon) {
        const previewIcon = document.getElementById('selectedIcon');
        previewIcon.textContent = icon || '🎯';
        
        // Add animation
        previewIcon.style.transform = 'scale(0.8)';
        setTimeout(() => {
            previewIcon.style.transform = 'scale(1)';
        }, 100);
    }
}

// Initialize settings manager when DOM is loaded
let settingsManager;
document.addEventListener('DOMContentLoaded', () => {
    settingsManager = new SettingsManager();
});
