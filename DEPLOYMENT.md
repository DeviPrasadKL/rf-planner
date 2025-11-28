# RF Link Planner - Deployment Guide

## Overview
This is a web-based RF (Radio Frequency) Link Planner tool that allows users to plan point-to-point RF links between towers on a map with Fresnel zone visualization.

## Features
- **Interactive Map**: Click to add towers
- **Frequency Configuration**: Set GHz for each tower
- **Point-to-Point Links**: Connect towers with matching frequencies
- **Fresnel Zone Visualization**: View the first Fresnel zone as an ellipse when clicking links
- **Tower Management**: Edit, rename, and delete towers
- **Link Analytics**: View distance and frequency information
- **Real-time Distance Calculation**: Great-circle distance between towers
- **Responsive Design**: Works on desktop and tablet

## Tech Stack
- **Frontend Framework**: React 19
- **Map Library**: Leaflet + react-leaflet 5
- **Build Tool**: Vite 7
- **HTTP Client**: Axios
- **Elevation Data**: Open-Elevation API (free, no key required)

## Local Development

### Prerequisites
- Node.js 16+ (LTS recommended)
- npm or yarn

### Setup

1. **Clone or navigate to the project**
```bash
cd /Users/prasad/Documents/coding/rf-planner
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

The application will start at `http://localhost:5173` (or the next available port).

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint checks

## Deployment to Vercel

### Option 1: Direct Vercel Deployment (Recommended)

1. **Create a Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub, GitLab, or email

2. **Connect Your Repository**
   - Push your code to GitHub
   - Import the repository in Vercel dashboard
   - Select the project root directory

3. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your project
   - Your live URL will be provided

### Option 2: Manual Vercel CLI Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Build the project**
```bash
npm run build
```

3. **Deploy**
```bash
vercel
```

4. **Follow the prompts** to set up your project on Vercel

### Option 3: GitHub Pages (Alternative)

1. **Update vite.config.js** if deploying to GitHub Pages:
```js
export default {
  base: '/rf-planner/',  // Replace 'rf-planner' with your repo name
  // ... rest of config
}
```

2. **Build and deploy**
```bash
npm run build
git add dist -f
git commit -m "Deploy to GitHub Pages"
git push origin main
```

3. **Enable GitHub Pages** in repository settings

## Other Free Hosting Options

### Netlify
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

### Railway.app
```bash
railway login
railway init
railway up
```

### Render.com
1. Connect GitHub repo
2. Create new web service
3. Set build: `npm run build`
4. Set start: `npm run preview`

## Performance Considerations

- **Lazy Loading**: Map tiles are loaded from OSM CDN
- **Elevation API**: Requests are cached in component state
- **Icon Optimization**: Custom SVG icons instead of image files
- **Responsive Design**: Sidebar collapses on small screens

## Troubleshooting

### Port Already in Use
```bash
# Use a different port
npm run dev -- --port 3000
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Map Not Loading
- Check internet connection (needs OSM tiles)
- Clear browser cache
- Check browser console for errors

### Elevation API Failing
- The app gracefully handles elevation API failures
- Fresnel zones will still compute without elevation data
- The public Open-Elevation API has rate limits

## Project Structure

```
rf-planner/
├── src/
│   ├── App.jsx              # Main app component
│   ├── App.css              # Global styles
│   ├── components/
│   │   └── MapView.jsx      # Map and RF planning logic
│   └── index.tsx            # Entry point
├── public/
│   ├── index.html
│   └── manifest.json
├── index.css                # Additional global styles
├── vite.config.js
├── package.json
└── tsconfig.json
```

## API Usage

### Open-Elevation API (Free)
- **Endpoint**: `https://api.open-elevation.com/api/v1/lookup`
- **Rate Limit**: ~1000 requests/day
- **No Auth**: Public API, no key needed
- **Used for**: Sampling elevation data along RF links

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Environment Variables

No environment variables required for basic functionality. 
Optional future additions:
- `VITE_MAP_PROVIDER` - Switch map providers
- `VITE_API_KEY` - If using paid elevation API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to your fork
5. Create a Pull Request

## License

MIT - Feel free to use this project for personal and commercial purposes.

## Support

For issues or questions:
1. Check the Help panel in the app (? Help button)
2. Review the code comments in MapView.jsx
3. Check browser console for errors

## Future Enhancements

- [ ] Export RF link plans as PDF/JSON
- [ ] Import existing tower configurations
- [ ] More realistic terrain obstruction analysis
- [ ] Multi-hop link planning
- [ ] Path loss calculations
- [ ] Weather/foliage effects
- [ ] Dark mode theme
- [ ] Collaborative planning (real-time sync)

---

**Last Updated**: November 28, 2025
**Version**: 1.0.0
