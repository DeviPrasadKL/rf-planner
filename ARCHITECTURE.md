# RF Link Planner - Architecture & Flow Diagrams

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         React Application                            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    App.jsx (Main)                           │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │ Header: Title, Help Panel, GitHub Link              │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │ Help Panel (Collapsible)                             │  │   │
│  │  │ - Getting Started Guide                              │  │   │
│  │  │ - Key Concepts                                       │  │   │
│  │  │ - Tips                                               │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │           MapView.jsx (Main Logic)                   │  │   │
│  │  │                                                      │  │   │
│  │  │  ┌─────────────────┐    ┌──────────────────┐        │  │   │
│  │  │  │  Leaflet Map    │    │  React Sidebar   │        │  │   │
│  │  │  │                 │    │                  │        │  │   │
│  │  │  │ • OSM Tiles     │    │ • Tower List     │        │  │   │
│  │  │  │ • Markers       │    │ • Link List      │        │  │   │
│  │  │  │ • Polylines     │    │ • Edit Form      │        │  │   │
│  │  │  │ • SVG Overlay   │    │ • Fresnel Info   │        │  │   │
│  │  │  │ • Legend        │    │ • Statistics     │        │  │   │
│  │  │  └─────────────────┘    └──────────────────┘        │  │   │
│  │  │                                                      │  │   │
│  │  │  State Management:                                   │  │   │
│  │  │  • towers[] - Tower data                             │  │   │
│  │  │  • links[] - Link connections                        │  │   │
│  │  │  • selectedTowerId - Current selection               │  │   │
│  │  │  • selectedLinkId - Current link                     │  │   │
│  │  │  • fresnelEllipse - Computed zone                    │  │   │
│  │  │  • editingFreq/Name - Edit mode                      │  │   │
│  │  │                                                      │  │   │
│  │  │  Core Functions:                                     │  │   │
│  │  │  • handleMapClick() - Add tower                      │  │   │
│  │  │  • handleTowerClick() - Select for linking           │  │   │
│  │  │  • handleLinkClick() - Show Fresnel                  │  │   │
│  │  │  • openEditTower() - Edit mode                       │  │   │
│  │  │  • saveFreq() - Update tower                         │  │   │
│  │  │  • removeTower/Link() - Delete items                 │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        External APIs                                │
├─────────────────────────────────────────────────────────────────────┤
│ • OpenStreetMap Tiles  (map rendering)                             │
│ • Open-Elevation API   (elevation data sampling)                   │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Interaction                  Component State                  Computed Output
═════════════════════════════════════════════════════════════════════════════════════

Click Map ──────────► handleMapClick() ──────► towers[] + 1 ──────► Marker Added
                                              ▼
                                         Render Map

Right-Click ──────── openEditTower() ──────► selectedTowerId ──────► Edit Form
Tower             (+ editingFreq)             Shown

Edit & Save ──────── saveFreq() ────────► towers[id] updated ──────► Tower
                                                                    Updated

Click Tower A ──────► setSelectedTowerId() ─► selectedTowerId=A ──► Tower
(Select)                                                            Highlighted

Click Tower B ──────► handleTowerClick() ──► links[] + 1 ──────► Link Line
(Same Freq)         (if freq matches)       (if no duplicate)    Created

Click Link ──────────► handleLinkClick() ──► computeEllipse() ──► Fresnel
                      (async)               fresnelEllipse{}      Zone
                      ▼                         ▼                Displayed
                 Fetch Elevation          renderEllipse()
                 Calculate r
                 Generate Points

Delete Tower ──────► removeTower() ──────► towers[] - 1 ───────► Map
                     (cascade delete)     links[] updated       Updated
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component State                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  towers: Array<{                                               │
│    id: number,           ◄─────────────────────────────────┐   │
│    latlng: [lat, lon],                                      │   │
│    freqGHz: number,                                         │   │
│    name: string                                             │   │
│  }>                                                         │   │
│                                                             │   │
│  links: Array<{                                            │   │
│    id: number,           ◄────────────────────────────┐    │   │
│    aId: towerId,                                      │    │   │
│    bId: towerId                                       │    │   │
│  }>                                                   │    │   │
│                                                       │    │   │
│  selectedTowerId: number | null  ◄───────────┐      │    │   │
│  selectedLinkId: number | null   ◄────┐      │      │    │   │
│  editingFreq: string             ◄─┐  │      │      │    │   │
│  editingName: string             ◄─┤  │      │      │    │   │
│  fresnelEllipse: {...} | null    ◄─┤  │      │      │    │   │
│  loadingEllipse: boolean         ◄─┤  │      │      │    │   │
│  showLinkDistance: boolean       ◄─┤  │      │      │    │   │
│                                    │  │      │      │    │   │
│  Refs (Non-rendering):            │  │      │      │    │   │
│  nextTowerId: useRef(1)           │  │      │      │    │   │
│  nextLinkId: useRef(1)            │  │      │      │    │   │
│                                    │  │      │      │    │   │
│  Computed (useMemo):              │  │      │      │    │   │
│  towerStats: {                    │  │      │      │    │   │
│    [id]: { linkCount, connectedFreqs }       │    │   │
│  }                                            │    │   │
│                                              │    │   │
└──────────────────────────────────────────────┼────┼───┼───────┘
                                               │    │   │
                    ┌──────────────────────────┘    │   │
                    │   ┌──────────────────────────┘   │
                    │   │   ┌──────────────────────────┘
                    │   │   │
                    ▼   ▼   ▼
            ┌────────────────────────┐
            │  UI Rendering         │
            ├────────────────────────┤
            │ • Markers with colors │
            │ • Polylines           │
            │ • Tooltips            │
            │ • Sidebar items       │
            │ • Edit forms          │
            │ • Ellipse overlay     │
            └────────────────────────┘
```

## Fresnel Zone Calculation Flow

```
Click Link
    ▼
handleLinkClick(link)
    ▼
Get Tower A & B coordinates
    ▼
Calculate Distance (Haversine)
    ├─► dist = haversine(latlngA, latlngB)
    │
Calculate Wavelength
    ├─► fHz = freq * 1e9           (Convert GHz to Hz)
    ├─► λ = c / fHz                (c = 3e8 m/s)
    │
Calculate Fresnel Radius
    ├─► d1 = dist / 2              (Half distance)
    ├─► d2 = dist / 2
    ├─► r = √((λ × d1 × d2) / (d1 + d2))
    │
Fetch Elevation (Optional)
    ├─► API Call: axios.post(open-elevation)
    ├─► Sample 11 points along link
    ├─► Get elevation data
    │
Generate Ellipse Points
    ├─► Convert to Web Mercator [x, y]
    ├─► Generate parametric ellipse points
    ├─► Rotate and translate
    ├─► Convert back to [lat, lon]
    │
Create SVG Overlay
    ├─► SVG polygon with points
    ├─► Set color and style
    ├─► Render on map
    │
Display Fresnel Info
    ├─► Show radius (meters)
    ├─► Show distance (km)
    └─► Show clear/hide button
```

## Component Hierarchy

```
App
├── Header
│   ├── Title
│   ├── Help Button
│   └── GitHub Link
│
├── Help Panel (Conditional)
│   ├── Getting Started
│   ├── Key Concepts
│   └── Tips
│
└── Container
    └── MapView
        ├── MapContainer (Leaflet)
        │   ├── TileLayer (OSM)
        │   ├── ClickableMap (Custom Hook)
        │   ├── Markers
        │   │   ├── Marker (Tower)
        │   │   ├── Tooltip
        │   │   └── Popup
        │   ├── Polylines
        │   │   ├── Polyline (Link)
        │   │   └── CircleMarker (Distance)
        │   ├── SVGOverlay (Fresnel)
        │   └── Legend (Overlay)
        │
        └── Sidebar
            ├── Tower List
            │   └── Tower Item (each)
            ├── Link List
            │   └── Link Item (each)
            ├── Edit Form (Conditional)
            │   ├── Name Input
            │   ├── Frequency Input
            │   └── Save/Cancel
            └── Fresnel Info (Conditional)
                ├── Radius Display
                ├── Distance Display
                └── Clear Button
```

## Event Handling Flow

```
User Event          Event Handler           State Update          Re-render
═══════════════════════════════════════════════════════════════════════════════

mapClick
├─► handleMapClick(latlng)
│   └─► setTowers([...towers, newTower])
│       └─► MapView re-renders
│           └─► New marker appears

towerClick
├─► handleTowerClick(tower)
│   ├─► First click: setSelectedTowerId(tower.id)
│   ├─► Second click (different tower, same freq):
│   │   └─► setLinks([...links, newLink])
│   │       └─► Polyline appears
│   └─► MapView re-renders

rightClick (tower)
├─► openEditTower(tower)
│   ├─► setSelectedTowerId(tower.id)
│   ├─► setEditingFreq(tower.freqGHz)
│   └─► setEditingName(tower.name)
│       └─► Edit form appears

linkClick
├─► handleLinkClick(link)
│   ├─► computeEllipse() [async]
│   ├─► fetchElevation() [async]
│   └─► setFresnelEllipse({...})
│       └─► SVG overlay appears

editSave
├─► saveFreq()
│   ├─► setTowers(updated array)
│   ├─► setSelectedTowerId(null)
│   └─► setEditingFreq("")
│       └─► Edit form hidden

deleteClick
├─► removeTower(id) or removeLink(id)
│   ├─► setTowers/setLinks (filtered)
│   └─► MapView re-renders
│       └─► Tower/Link removed
```

## Performance Optimization Strategy

```
Rendering Optimization
└─► useMemo(towerStats)
    ├─► Recompute only when towers/links change
    └─► Provides link count and frequency info

    Benefits:
    ├─► Prevents unnecessary calculations
    ├─► Sidebar updates only when needed
    └─► Smoother performance with many towers

Event Optimization
└─► Event delegation on sidebar items
    ├─► Click handlers on parent container
    └─► Prevents multiple listener creation

    Benefits:
    ├─► Reduced memory usage
    ├─► Faster component mounting
    └─► Better performance with many items

API Optimization
└─► Async elevation fetching
    ├─► Doesn't block main thread
    ├─► Graceful error handling
    └─► Optional feature (not critical)

    Benefits:
    ├─► Responsive UI during fetch
    ├─► Works without elevation data
    └─► No performance degradation

Rendering Optimization
└─► Conditional rendering
    ├─► Edit form only shown when needed
    ├─► Fresnel info only on link selection
    └─► Help panel collapsible

    Benefits:
    ├─► Smaller DOM tree
    ├─► Faster re-renders
    └─► Better performance overall
```

## Deployment Architecture

```
Development            Build Process          Deployment
═══════════════════════════════════════════════════════════════════

Source Code
├─ src/App.jsx
├─ src/MapView.jsx       ──► npm run build ──► dist/
├─ index.css                ├─ Minify        ├─ index.html
├─ package.json            ├─ Optimize      ├─ assets/
└─ index.html              └─ Bundle        └─ [hashed].js/css

Git Repository
└─ push to main ──────────► GitHub Actions ──► Vercel/Netlify
                           ├─ Run tests        ├─ Deploy dist/
                           ├─ Build check      ├─ Enable CDN
                           └─ Auto deploy      └─ SSL setup

Live Website
└─ https://rf-planner.vercel.app
   ├─ Cached globally
   ├─ Auto-scaling
   └─ Instant deployment
```

## API Integration Flow

```
Open-Elevation API
═════════════════════════════════════════════════════════════════

1. Prepare Request
   ├─► Sample 11 points along link
   ├─► Format as: { latitude, longitude }
   └─► Create request array

2. Send Request
   ├─► POST to api.open-elevation.com
   ├─► Payload: { locations: [...] }
   └─► axios.post() call

3. Handle Response
   ├─► Success: resp.data.results[]
   │   └─► Extract elevation values
   │
   └─► Error: catch block
       ├─► Log warning
       ├─► Continue without elevation
       └─► Ellipse still renders

4. Update State
   ├─► Cache results
   ├─► Update UI
   └─► Display Fresnel zone

Rate Limit: ~1000 requests/day
Fallback: App works fine without it
```

---

## Summary

This architecture demonstrates:
- ✅ Clean component structure
- ✅ Efficient state management
- ✅ Proper separation of concerns
- ✅ Performance optimization
- ✅ Scalable design
- ✅ Production-ready patterns

The system is robust, maintainable, and ready for enhancement.
