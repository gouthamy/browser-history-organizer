/**
 * Browser History Organizer - Configuration Constants
 * 
 * This file contains all configurable constants for the open-source extension.
 * Feel free to customize the default groups and settings for your needs.
 */

// =============================================================================
// 🌍 DEFAULT WEBSITE GROUPS
// =============================================================================

const DEFAULT_GROUPS = [
    {
        id: 'development',
        name: 'Development',
        icon: '💻',
        patterns: [
            'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
            'codepen.io', 'codesandbox.io', 'replit.com', 'glitch.com'
        ],
        enabled: true,
        order: 0
    },
    {
        id: 'documentation',
        name: 'Documentation',
        icon: '📚',
        patterns: [
            'developer.mozilla.org', 'docs.microsoft.com', 'docs.python.org',
            'nodejs.org/docs', 'reactjs.org', 'vuejs.org', 'angular.io'
        ],
        enabled: true,
        order: 1
    },
    {
        id: 'productivity',
        name: 'Productivity',
        icon: '⚡',
        patterns: [
            'trello.com', 'asana.com', 'notion.so', 'monday.com',
            'slack.com', 'discord.com', 'teams.microsoft.com'
        ],
        enabled: true,
        order: 2
    },
    {
        id: 'google-workspace',
        name: 'Google Workspace',
        icon: '🔵',
        patterns: [
            'docs.google.com', 'drive.google.com', 'sheets.google.com',
            'slides.google.com', 'calendar.google.com', 'gmail.com'
        ],
        enabled: true,
        order: 3
    },
    {
        id: 'design',
        name: 'Design',
        icon: '🎨',
        patterns: [
            'figma.com', 'sketch.com', 'adobe.com', 'canva.com',
            'dribbble.com', 'behance.net', 'unsplash.com'
        ],
        enabled: true,
        order: 4
    },
    {
        id: 'learning',
        name: 'Learning',
        icon: '🎓',
        patterns: [
            'udemy.com', 'coursera.org', 'khanacademy.org', 'edx.org',
            'pluralsight.com', 'lynda.com', 'youtube.com/watch'
        ],
        enabled: true,
        order: 5
    },
    {
        id: 'social-media',
        name: 'Social Media',
        icon: '📱',
        patterns: [
            'twitter.com', 'linkedin.com', 'facebook.com', 'instagram.com',
            'reddit.com', 'medium.com', 'dev.to'
        ],
        enabled: true,
        order: 6
    },
    {
        id: 'entertainment',
        name: 'Entertainment',
        icon: '🎬',
        patterns: [
            'youtube.com', 'netflix.com', 'spotify.com', 'twitch.tv',
            'hulu.com', 'disney.com', 'amazon.com/prime'
        ],
        enabled: true,
        order: 7
    },
    {
        id: 'cloud-services',
        name: 'Cloud Services',
        icon: '☁️',
        patterns: [
            'aws.amazon.com', 'console.cloud.google.com', 'portal.azure.com',
            'digitalocean.com', 'heroku.com', 'netlify.com', 'vercel.com'
        ],
        enabled: true,
        order: 8
    },
    {
        id: 'others',
        name: 'Others',
        icon: '🔗',
        patterns: ['*'],
        enabled: true,
        order: 999
    }
];

// =============================================================================
// 🎯 EXTENSION CONFIGURATION
// =============================================================================

// Default frequency thresholds for visit tracking
const DEFAULT_FREQUENCY_THRESHOLDS = {
    high: 10,    // 10+ visits = high frequency (🔥)
    medium: 5,   // 5-9 visits = medium frequency (⚡)
    low: 2       // 2-4 visits = low frequency (💫)
};

// Default dock settings
const DEFAULT_DOCK_SETTINGS = {
    enabled: true,           // Enable docking feature
    side: 'right',          // Dock on right side
    width: 1000              // Default width 1000px
};

// =============================================================================
// 📊 CONSTANTS & UTILITIES
// =============================================================================

// Storage keys for Chrome storage
const STORAGE_KEYS = {
    websiteGroups: 'browserHistoryOrganizer_websiteGroups',
    favorites: 'browserHistoryOrganizer_favorites',
    favoriteTags: 'browserHistoryOrganizer_favoriteTags',
    visitFrequency: 'browserHistoryOrganizer_visitFrequency',
    topVisitedUrls: 'browserHistoryOrganizer_topVisitedUrls',
    recentVisitDates: 'browserHistoryOrganizer_recentVisitDates',
    dockSettings: 'browserHistoryOrganizer_dockSettings'
};

// Icon options for groups
const ICON_OPTIONS = [
    '💻', '📚', '⚡', '🔵', '🎨', '🎓', '📱', '🎬', '☁️', '🔗',
    '🚀', '⭐', '🔥', '💡', '🎯', '📊', '🔧', '📝', '🌐', '📦',
    '🏠', '🛒', '💰', '📈', '🎮', '🎵', '📷', '🍕', '✈️', '🏥'
];

// Main configuration object
const CONFIG = {
    groups: DEFAULT_GROUPS,
    frequencyThresholds: DEFAULT_FREQUENCY_THRESHOLDS,
    dockSettings: DEFAULT_DOCK_SETTINGS,
    iconOptions: ICON_OPTIONS,
    storageKeys: STORAGE_KEYS
};

// =============================================================================
// 🌟 GLOBAL EXPORT
// =============================================================================

// Make configuration available globally for the extension
window.BrowserHistoryOrganizerConfig = {
    ...CONFIG,
    // Utility functions
    getDefaultGroups: () => DEFAULT_GROUPS,
    getStorageKeys: () => STORAGE_KEYS,
    getIconOptions: () => ICON_OPTIONS
};

console.log('✅ Browser History Organizer configuration loaded');