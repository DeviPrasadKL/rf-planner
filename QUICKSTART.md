# Quick Start Guide - RF Link Planner

## 🚀 Get Started in 5 Minutes

### 1. Install & Run Locally

```bash
cd rf-planner
npm install
npm run dev
```

Open your browser to `http://localhost:5173`

### 2. Using the App

**Add a Tower**
- Click anywhere on the map
- A tower appears with 5.0 GHz frequency
- Edit the name and frequency if needed

**Create a Link**
1. Click the first tower (it turns red when selected)
2. Click a second tower with the same frequency
3. A blue line appears connecting them
4. Distance automatically displays on the map

**View Fresnel Zone**
- Click on any link to see the first Fresnel zone
- An ellipse shows the critical area around the link
- Click again to hide it

**Edit Tower**
- Right-click any tower, OR
- Use the Edit button in the sidebar
- Change the name and frequency (GHz)

**Delete Tower or Link**
- Use the X button in the sidebar
- Links connected to deleted towers are also removed

### 3. Deploy to Vercel

**Option A: Simple Git Integration (Recommended)**

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Initial RF Link Planner"
   git push origin main
   ```

2. Go to https://vercel.com/new
3. Click "Import Git Repository"
4. Select your repo
5. Click "Deploy"
6. ✅ Done! Your site is live

**Option B: Vercel CLI**

```bash
npm i -g vercel
vercel
```

Then follow the prompts.

### 4. Key RF Concepts

**Frequency (GHz)**
- Must match between towers to create link
- Affects Fresnel zone size
- Common values: 2.4, 5, 24, 28 GHz

**Fresnel Zone**
- Ellipse around the link
- Represents the critical propagation area
- Obstructions here affect signal quality
- Aim for 100% clearance

**Distance**
- Shown in kilometers
- Calculated using great-circle formula
- Affects Fresnel zone size

### 5. Tips & Tricks

✓ Use real tower coordinates for accuracy
✓ Check link distances before creating links
✓ Keep Fresnel zones clear of obstructions
✓ Organize towers by frequency band
✓ Save your plans by exporting (future feature)

### 6. Keyboard Shortcuts (Coming Soon)

```
Click Map        → Add tower
Click Tower      → Select for linking
Right-Click      → Edit tower
Click Link       → Show Fresnel zone
X Button         → Delete item
```

### 7. Help & Support

- Click the **? Help** button in the top-right
- Check **DESIGN.md** for technical details
- Review **DEPLOYMENT.md** for hosting options
- Check browser console for error messages

### 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Check internet, clear cache |
| Can't link towers | Ensure frequencies match exactly |
| Slow performance | Reduce number of towers |
| Elevation API fails | Works without it, check rate limit |

### 9. Project Structure

```
rf-planner/
├── src/
│   ├── App.jsx              # Main UI
│   ├── components/
│   │   └── MapView.jsx     # RF Planning logic
│   └── index.tsx           # Entry
├── index.css               # Styles
├── package.json           # Dependencies
├── DESIGN.md              # Technical docs
└── DEPLOYMENT.md          # Hosting guide
```

### 10. What's Included

✓ Interactive map (Leaflet)
✓ Tower placement and editing
✓ Link creation with constraints
✓ Fresnel zone calculation
✓ Distance measurement
✓ Responsive design
✓ Free hosting ready

### 11. Next Steps

1. **Add towers** on the map
2. **Create links** between same-frequency towers
3. **View Fresnel zones** for each link
4. **Deploy to web** for team sharing
5. **Export plans** (coming soon)

### 12. Common Use Cases

**Microwave Links**
- Distance: 1-50 km
- Frequency: 5-24 GHz
- Typical clearance: 60% of Fresnel zone

**Point-to-Point WiFi**
- Distance: 0.5-20 km
- Frequency: 2.4 or 5 GHz
- Ensure Fresnel zone clear

**Long-Distance Links**
- Distance: 50-100+ km
- Frequency: 10-80 GHz
- Requires high towers

---

**Happy Planning! 🎯**

For questions, see README.md or DESIGN.md
