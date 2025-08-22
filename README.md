# Browser History Organizer

A powerful Chrome extension that organizes your browsing history by grouping websites into categories like GitHub, Confluence, Basecamp, and more. Features a clean, modern interface with a left panel showing website groups and a right panel displaying recently visited sites.

## Features

- 📊 **Smart Grouping**: Automatically categorizes websites into logical groups
- ⚙️ **Configurable Groups**: Add, edit, delete, and reorder website groups
- 🔍 **Search Functionality**: Quickly find website groups
- ⏰ **Recent Visits**: View recently visited sites with timestamps
- 🎨 **Modern UI**: Clean, responsive design with smooth interactions
- 🔄 **Real-time Updates**: Refresh history data on demand
- 🎯 **Drag & Drop**: Reorder groups with intuitive drag and drop
- 💾 **Import/Export**: Backup and restore your settings
- 🔧 **Advanced Settings**: Full control over group patterns and icons
- ⭐ **Favorites System**: Star websites for quick access with Recent/Favorites toggle

## Website Categories

The extension automatically groups websites into these categories:

- **💻 Development**: GitHub, GitLab, Bitbucket - Code repositories and development tools
- **📚 Documentation**: Confluence, Notion, GitBook - Documentation and knowledge bases  
- **☁️ Cloud Services**: AWS, Google Cloud, Azure - Cloud platforms and services
- **⚡ Productivity**: Slack, Discord, Teams - Communication and collaboration tools
- **🔵 Google Workspace**: Docs, Sheets, Slides - Google productivity suite
- **📋 Project Management**: Trello, Asana, Jira - Project tracking and management
- **🎨 Design**: Figma, Sketch, Canva - Design and prototyping tools
- **🎓 Learning**: Stack Overflow, MDN, W3Schools - Learning resources and documentation
- **📱 Social Media**: Twitter, LinkedIn, Reddit - Social networking platforms
- **🎬 Entertainment**: YouTube, Netflix, Spotify - Streaming and media platforms
- **📰 News**: Hacker News, TechCrunch, Medium - News and blog platforms
- **🔗 Others**: All other websites not matching specific patterns

## Installation

1. **Download or Clone**: Get the extension files
2. **Open Chrome Extensions**: Go to `chrome://extensions/` in your browser
3. **Enable Developer Mode**: Toggle the "Developer mode" switch in the top right
4. **Load Unpacked**: Click "Load unpacked" and select the extension folder
5. **Pin Extension**: Click the extensions icon and pin "Browser History Organizer"

## Usage

1. **Click the Extension Icon**: Open the Browser History Organizer popup
2. **Browse Categories**: See your website groups in the left panel
3. **Select a Group**: Click on any group to view recent visits
4. **Open Sites**: Click on any site in the right panel to open it
5. **Search**: Use the search box to filter websites in selected group
6. **Favorites**: Click the star icon to favorite websites, use Recent/Favorites toggle
7. **Refresh**: Click the refresh icon to update history data
8. **Configure Groups**: Click the settings icon to customize groups

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

## Permissions

The extension requires the following permissions:

- **History**: To read and organize your browsing history
- **Active Tab**: To open selected websites in new tabs
- **Storage**: To save your custom group configurations

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
- **Favorites System**: Star and organize frequently visited sites

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
    patterns: ['example.com', 'mycompany.com'],
    enabled: true,
    order: 12
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
