# Smart Planner - 스마트 플래너

A mobile-optimized Korean calendar and planning application with AI-powered schedule creation.

## Features

- 📅 **Interactive Calendar**: Month view with date selection and timeline view
- �� **AI Schedule Creation**: ChatGPT-powered natural language schedule input
- ✅ **Todo Management**: Interactive todo cards with priority levels
- 📱 **Mobile Optimized**: Responsive design following Korean design system
- 🎨 **Design System**: Comprehensive Korean typography and color system
- ⚡ **Fast & Lightweight**: Pure HTML, CSS, and JavaScript

## Quick Start

1. Clone the repository
2. Set up your OpenAI API key in `config.js`
3. Open `index.html` in a web browser

## Configuration

### API Key Setup

For local development, edit `config.js`:
```javascript
window.OPENAI_API_KEY = 'your-actual-api-key-here';
```

For Render deployment, set the environment variable:
- Go to your Render dashboard
- Navigate to Environment tab
- Add: `OPENAI_API_KEY` = `your-api-key`

## Deployment to Render

1. Connect your GitHub repository to Render
2. Choose "Static Site" as service type
3. Set build command: `echo "Static site - no build required"`
4. Set publish directory: `.` (root)
5. Add environment variable `OPENAI_API_KEY`

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Fonts**: Pretendard (Korean-optimized)
- **AI Integration**: OpenAI GPT-3.5-turbo
- **Design**: Korean Design System compliant
- **Deployment**: Render Static Sites

## Browser Support

- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+

## License

MIT License - see LICENSE file for details
