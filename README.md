# Browser History Organizer

A powerful Chrome extension that intelligently organizes your browsing history by grouping websites into categories with advanced features like custom tags, visit frequency tracking, and smart sorting. Features a clean, modern interface with comprehensive website management capabilities.

## Features

- 📊 **Smart Grouping**: Automatically categorizes websites into logical groups
- ⚙️ **Configurable Groups**: Add, edit, delete, and reorder website groups
- 🔍 **Search Functionality**: Quickly find websites within selected groups
- ⏰ **Recent Visits**: View recently visited sites with timestamps
- 🎨 **Modern UI**: Clean, responsive design with smooth interactions
- 🔄 **Real-time Updates**: Refresh history data on demand
- 🎯 **Drag & Drop**: Reorder groups with intuitive drag and drop
- 💾 **Import/Export**: Backup and restore your settings
- 🔧 **Advanced Settings**: Full control over group patterns and icons
- ⭐ **Advanced Favorites**: Star websites with custom tags and names
- 🏷️ **Custom Tags**: Right-click to add personalized names to any website
- 🔥 **Visit Frequency Tracking**: Visual indicators for most visited sites
- 📈 **Smart Sorting**: Toggle between frequency-based and time-based sorting
- 🎭 **Animated Badges**: Dynamic visual feedback for site usage patterns

## Website Categories

The extension automatically groups websites into these categories:

- **💻 Development**: GitHub, GitLab, Stack Overflow - Code repositories and development tools
- **📚 Documentation**: MDN, React Docs, Vue.js - Technical documentation and guides
- **⚡ Productivity**: Trello, Asana, Slack - Communication and project management tools
- **🔵 Google Workspace**: Docs, Sheets, Drive - Google productivity suite
- **🎨 Design**: Figma, Adobe, Canva - Design and creative tools
- **🎓 Learning**: Udemy, Coursera, Khan Academy - Educational platforms and courses
- **📱 Social Media**: Twitter, LinkedIn, Reddit - Social networking platforms
- **🎬 Entertainment**: YouTube, Netflix, Spotify - Streaming and media platforms
- **☁️ Cloud Services**: AWS, Google Cloud, Azure - Cloud platforms and services
- **🔗 Others**: All other websites not matching specific patterns

## Installation

1. **Download or Clone**: Get the extension files
2. **Open Chrome Extensions**: Go to `chrome://extensions/` in your browser
3. **Enable Developer Mode**: Toggle the "Developer mode" switch in the top right
4. **Load Unpacked**: Click "Load unpacked" and select the extension folder
5. **Pin Extension**: Click the extensions icon and pin "Browser History Organizer"

## Usage

### Basic Operations
1. **Click the Extension Icon**: Open the Browser History Organizer popup
2. **Browse Categories**: See your website groups in the left panel
3. **Select a Group**: Click on any group to view recent visits
4. **Open Sites**: Click on any site in the right panel to open it
5. **Search**: Use the search box to filter websites in selected group
6. **Refresh**: Click the refresh icon to update history data
7. **Configure Groups**: Click the settings icon to customize groups

### Advanced Features
8. **Star Favorites**: Click the ⭐ star icon to add websites to favorites
9. **Custom Tags**: Right-click any website to add a custom name/tag
10. **View Toggles**: Switch between Recent and Favorites views
11. **Sort Control**: Toggle between 🔥 Frequency and ⏰ Time sorting
12. **Visit Tracking**: See animated badges (🔥⚡📈) for frequently visited sites
13. **Tag Management**: Edit, delete, or modify custom tags via right-click menu

## Configuring Groups

### Access Settings
- Click the ⚙️ settings icon in the popup header
- Or right-click the extension icon → Options

### Managing Groups
- **Add New Group**: Click "➕ Add New Group" to create custom categories
- **Edit Group**: Click the ✏️ edit button to modify name, icon, or patterns
- **Reorder Groups**: Drag and drop groups to change their order
- **Enable/Disable**: Click the 🟢/🔴 toggle to show/hide groups
- **Delete Group**: Click the 🗑️ delete button to remove groups

### Website Patterns
When adding or editing groups, specify website patterns:
- Use domain names like `github.com` to match all GitHub subdomains
- Add multiple patterns, one per line
- Examples: `github.com`, `docs.google.com`, `stackoverflow.com`

### Import/Export Settings
- **Export**: Save your configuration as a JSON file
- **Import**: Restore settings from a backup file
- **Reset**: Return to default group configuration

## Advanced Features

### 🏷️ Custom Tags & Names
- **Right-click any website** to open the custom tag modal
- **Add personalized names** like "Work Dashboard" or "Main Project"
- **Visual indicators** show tagged items with 🏷️ badge
- **Edit or delete tags** anytime via the same right-click menu
- **Automatic favorites** - tagged items are automatically added to favorites

### 🔥 Visit Frequency Tracking
The extension uses advanced Set data structures to track and visualize your browsing patterns:

- **🔥 Hot Sites** (10+ visits) - Red fire badge with glow animation
- **⚡ Active Sites** (5-9 visits) - Yellow lightning with sparkle effect
- **📈 Regular Sites** (2-4 visits) - Green growth indicator
- **🏆 Top 20% Sites** - Automatically identified and prioritized
- **Visit Counter** - Purple gradient badge showing total visit count

### 📊 Smart Sorting System
- **🔥 Frequency Sort** (Default): Most visited sites appear first
- **⏰ Time Sort**: Traditional chronological ordering
- **Instant Toggle**: Click sort buttons to switch modes
- **Persistent Preference**: Your choice is remembered per session

### ⭐ Enhanced Favorites
- **Star any website** for quick access
- **Custom naming** with personalized tags
- **Dedicated view** - toggle between Recent and Favorites
- **Smart organization** - favorites inherit current sorting mode
- **Cross-group favorites** - starred sites appear regardless of category

## Permissions

The extension requires the following permissions:

- **History**: To read and organize your browsing history
- **Active Tab**: To open selected websites in new tabs
- **Storage**: To save your custom group configurations, favorites, and tags
- **Context Menus**: To enable right-click custom tagging functionality

## Privacy

- All data processing happens locally in your browser
- No data is sent to external servers
- History data is only used for organization and display

## Development

### File Structure

```
ChromeHistoryOrganizer/
├── manifest.json          # Extension configuration
├── popup.html             # Main popup interface
├── popup.js               # Main JavaScript functionality
├── settings.html          # Settings page interface
├── settings.js            # Settings management logic
├── settings.css           # Settings page styling
├── styles.css             # Main popup styling and layout
├── icons/                 # Extension icons (16px, 32px, 48px, 128px)
├── README.md              # Documentation
```

### Key Components

- **HistoryOrganizer Class**: Main application logic in popup.js
- **SettingsManager Class**: Settings management in settings.js
- **Default Groups**: Pre-configured website categories for common services
- **History API Integration**: Chrome history access and organization
- **Dynamic UI Rendering**: Real-time interface updates
- **Drag & Drop**: Group reordering functionality
- **Import/Export**: Settings backup and restore
- **Advanced Favorites System**: Star, tag, and organize websites
- **Visit Frequency Tracker**: Set-based data structures for usage analytics
- **Custom Tag System**: Right-click context menu for personalized naming
- **Smart Sorting Engine**: Dual-mode sorting with frequency and time options
- **Animated UI Components**: Dynamic badges and visual feedback system

## Customization

To add new website categories, you have two options:

### Option 1: Using Settings UI (Recommended)
1. Click the ⚙️ settings icon in the popup
2. Click "➕ Add New Group"
3. Fill in the group name, select an icon, and add domain patterns
4. Save your changes

### Option 2: Modifying Code
1. Open `settings.js`
2. Find the `defaultGroups` array in the constructor
3. Add new group objects with id, name, icon, patterns, enabled, and order

Example:
```javascript
{
    id: 'my-category',
    name: 'My Category',
    icon: '🔧',
    patterns: ['example.com', 'mydomain.com'],
    enabled: true,
    order: 12
}
```

### Data Structures

The extension uses efficient Set and Map data structures for optimal performance:

```javascript
// Visit frequency tracking
this.visitFrequency = new Map();      // URL → visit count
this.topVisitedUrls = new Set();      // Set of most visited URLs
this.recentVisitDates = new Map();    // URL → Set of unique dates

// Favorites and tagging
this.favorites = new Set();           // Set of favorite URLs
this.favoriteTags = new Map();        // URL → custom tag name
```

### Storage Schema

```javascript
// Chrome Storage Sync Data
{
    "siteForceFavorites": ["url1", "url2", ...],           // Array of favorite URLs
    "siteForceFavoriteTags": {"url": "custom name", ...},   // URL to tag mapping
    "siteForceVisitFrequency": {"url": 42, ...},           // URL to visit count
    "siteForceTopVisited": ["url1", "url2", ...],          // Top 20% visited URLs
    "browserHistoryOrganizerSettings": {...}                // Group configurations
}
```

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers (Edge, Brave, etc.)

## License

MIT License - Feel free to modify and distribute. See [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension
5. Submit a pull request

## Support

For issues or feature requests, please create an issue in the repository.
