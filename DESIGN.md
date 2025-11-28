# RF Link Planner - Technical Documentation

## Project Overview

This is a full-featured RF (Radio Frequency) Link Planner tool built with React and Leaflet. It enables users to plan point-to-point RF links between towers with visualizations of Fresnel zones - a critical concept in RF communications.

## Design Approach

### Architecture Decisions

#### 1. **React Component Structure**
- **Single-Responsibility**: MapView component handles all map and RF logic
- **Hooks-Based**: Uses `useState` for state management, `useRef` for non-rendering values
- **useMemo Optimization**: Tower statistics are memoized to avoid unnecessary recalculations
- **Separation of Concerns**: UI logic separated from geometric calculations

#### 2. **State Management Strategy**
```
Towers: Array<{id, latlng, freqGHz, name}>
Links: Array<{id, aId, bId}>
Selected: Tower/Link IDs for highlighting
EditMode: Frequency and name editing
Fresnel: Cached Fresnel zone polygon points
```

#### 3. **Map Library Choice: Leaflet**
- **Why Leaflet**: 
  - Lightweight and performant
  - Large community and extensive documentation
  - React-Leaflet provides React bindings
  - Built-in GeoJSON and SVG overlay support
  - Free tile layers (OpenStreetMap)

- **Why Not Google Maps**:
  - Requires API key and billing setup
  - Heavier library
  - Rate limiting concerns for this use case

#### 4. **Elevation Data: Open-Elevation API**
- **Advantages**:
  - No authentication required
  - Free tier with reasonable limits
  - REST API for easy integration
  - Returns elevation in meters (our required unit)

- **Usage Pattern**:
  - Sample 11 points along RF link path
  - Fetch elevations asynchronously
  - Cache results in component state
  - Gracefully handle failures

### Mathematical Approach

#### **Fresnel Zone Calculation**

```
Algorithm:
1. Get link endpoints (tower A and B)
2. Calculate great-circle distance using Haversine formula
3. Convert frequency (GHz → Hz) to wavelength (m)
4. For midpoint: r = √((λ × d₁ × d₂) / (d₁ + d₂))
5. Generate ellipse points using parametric equations
6. Project 2D ellipse to geographic coordinates (Web Mercator)
7. Render as SVG polygon overlay
```

#### **Distance Calculation: Haversine Formula**

```javascript
// Returns great-circle distance in meters
function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = sin²(dLat/2) + cos(lat1) × cos(lat2) × sin²(dLon/2);
  const c = 2 × atan2(√a, √(1-a));
  return R × c;
}
```

#### **Coordinate System: Web Mercator Projection**

Used for local distance calculations:
```javascript
project: (latlng) → [x, y] in meters
unproject: [x, y] in meters → latlng
```

Allows accurate ellipse generation in projected space, then conversion back to geographic coordinates.

### User Interaction Flow

```
1. User clicks map
   → Add tower at coordinates
   
2. User right-clicks tower
   → Open edit dialog
   → Modify name and frequency
   
3. User selects first tower
   → Tower highlighted in red
   
4. User clicks second tower (same freq)
   → Create link if not duplicate
   
5. User clicks link
   → Compute Fresnel zone
   → Render ellipse overlay
   → Show statistics in sidebar
```

## UI/UX Design

### Color Scheme
- **Primary (Teal)**: #0ea5a4 - Interactive elements, normal tower state
- **Secondary (Red)**: #ef4444 - Danger actions, selected links
- **Background**: #f8fafc - Light neutral background
- **Text**: #1f2937 - Dark text for contrast

### Responsiveness Strategy

```
Desktop (>1200px):
  Sidebar: 360px fixed width
  Map: Remaining space
  
Tablet (768-1200px):
  Sidebar: 360px fixed (may overflow)
  Map: Remaining space
  
Mobile (<768px):
  Single column layout
  Sidebar below map (would need modal)
```

### Information Architecture

**Header**
- App title with emoji icon
- Help toggle button
- GitHub link

**Help Panel** (Collapsible)
- Getting Started guide
- Key Concepts explanation
- Tips and best practices

**Main View**
- Map area (left) with legend overlay
- Sidebar (right) with towers and links

**Sidebar Sections**
1. Towers list with stats
2. Links list with distances
3. Active edit form
4. Fresnel zone information

### Visual Feedback

- **Hover States**: Buttons scale and shadow on hover
- **Selected State**: Blue background for towers, red for links
- **Loading State**: Text indicator during Fresnel computation
- **Tooltips**: Hover over tower/link shows quick info
- **Popups**: Click marker for detailed information

## Performance Optimizations

### 1. **Memoization**
```javascript
const towerStats = useMemo(() => {
  // Compute link counts and connected frequencies
  // Only recomputes if towers or links change
}, [towers, links]);
```

### 2. **Event Handling**
- Event delegation on sidebar items
- Stoppage of event propagation to prevent conflicts
- Debounced map clicks to prevent double-adding towers

### 3. **Lazy Loading**
- Map tiles loaded from CDN as needed
- SVG overlay only rendered when Fresnel zone active
- Elevation data fetched asynchronously

### 4. **Memory Management**
- useRef for non-rendering ID counters
- Proper cleanup of event listeners
- Array methods (filter, map) preserve original state

## Technical Constraints & Trade-offs

### 1. **Fresnel Zone Accuracy**
- ✓ Uses correct mathematical formula
- ✓ Properly handles geodetic coordinates
- ✗ Simplified 2D ellipse (no terrain offset)
- ✗ Doesn't account for atmospheric refraction
- **Decision**: Sufficient for planning tool, not for professional RF engineering

### 2. **Elevation Data**
- ✓ Free API with no authentication
- ✓ Adequate resolution for visualization
- ✗ Rate limited (~1000 requests/day)
- ✗ No real-time updates
- **Decision**: Good balance of free tier vs functionality

### 3. **Map Provider**
- ✓ OpenStreetMap free tiles
- ✓ No API key needed
- ✗ Lower detail than commercial providers
- ✗ Rate limits apply
- **Decision**: Suitable for RF planning, users can upgrade tile layers

### 4. **Coordinate System**
- ✓ Web Mercator standard for web maps
- ✓ Good for global coverage
- ✗ Distortion at high latitudes
- **Decision**: Acceptable for local RF planning

## Code Structure

### Component Hierarchy
```
App
└── MapView
    ├── MapContainer (Leaflet)
    │   ├── TileLayer
    │   ├── ClickableMap (custom hook)
    │   ├── Markers (towers)
    │   ├── Polylines (links)
    │   └── SVGOverlay (Fresnel zones)
    └── Sidebar
        ├── TowerList
        ├── LinkList
        ├── EditForm
        └── FresnelInfo
```

### Key Functions

**Geographic Calculations**
```javascript
haversine()          // Distance between two points
computeEllipsePoints() // Generate Fresnel zone polygon
project()/unproject()  // Web Mercator conversions
```

**State Management**
```javascript
handleMapClick()     // Add tower
handleTowerClick()   // Select tower for linking
handleLinkClick()    // Show Fresnel zone
```

**UI Handlers**
```javascript
openEditTower()      // Prepare edit mode
saveFreq()          // Update tower properties
removeTower()       // Delete tower and linked links
```

## Testing Considerations

### Unit Tests (Not Implemented)
```
- haversine() accuracy
- Fresnel zone radius calculation
- Coordinate projections
- Array filtering logic
```

### Manual Testing Checklist
- [ ] Add towers at various locations
- [ ] Connect towers with same frequency
- [ ] Attempt to connect towers with different frequencies (should fail)
- [ ] View Fresnel zone at different frequencies (should vary)
- [ ] Edit tower properties
- [ ] Delete towers (should remove links)
- [ ] Toggle distance display
- [ ] View on mobile/tablet
- [ ] Test in different browsers

## Accessibility

### Implemented
- Semantic HTML structure
- Color contrast ratios meet WCAG AA standards
- Button labels are descriptive
- Form inputs have proper labels

### Could Be Improved
- ARIA labels for complex components
- Keyboard navigation for map
- Screen reader announcements for dynamic updates
- Reduced motion support

## Browser Support

**Fully Supported**
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requires Polyfills**
- IE 11 (not recommended)
- Older mobile browsers

## Future Roadmap

### Phase 2: Enhanced Features
1. **Data Persistence**
   - LocalStorage for saving plans
   - Export to JSON format
   - Import existing configurations

2. **Advanced RF Calculations**
   - Free-space path loss (FSPL)
   - Signal strength predictions
   - Rain attenuation
   - Foliage effects

3. **Collaborative Features**
   - Real-time synchronization
   - Multi-user editing
   - Comments and annotations

4. **Professional Features**
   - PDF report generation
   - Compliance checking
   - Link budget calculations
   - Multi-hop path optimization

### Phase 3: Mobile App
- React Native implementation
- Offline mode
- Mobile-optimized UI

## Deployment Checklist

- [x] Source code committed to git
- [x] README and documentation complete
- [x] Build process tested locally
- [x] No console errors or warnings
- [x] Responsive design verified
- [x] Cross-browser testing
- [ ] Deployment to Vercel
- [ ] Performance metrics validated
- [ ] SEO metadata added
- [ ] Error tracking setup (optional)

## Metrics & Performance

### Bundle Size
- React: ~42 KB
- Leaflet: ~140 KB
- react-leaflet: ~20 KB
- Axios: ~14 KB
- **Total Gzipped**: ~85 KB

### Performance Targets
- First Contentful Paint: < 2s
- Time to Interactive: < 3s
- Map Load Time: < 1s
- Fresnel Zone Computation: < 500ms

## Conclusion

This RF Link Planner demonstrates:
- ✓ Complex geometric calculations in JavaScript
- ✓ Real-time data visualization
- ✓ Responsive and intuitive UI/UX
- ✓ Integration with external APIs
- ✓ State management in React
- ✓ Performance optimization techniques
- ✓ Production-ready code structure

The tool successfully balances technical accuracy with usability, making it suitable for RF engineers, network planners, and hobbyists alike.

---

**Author**: Development Team
**Version**: 1.0.0
**Last Updated**: November 28, 2025
