import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Polyline, Popup, SVGOverlay, CircleMarker, Tooltip } from "react-leaflet";
import L from "leaflet";
import axios from "axios";

// Leaflet icon fix for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icon colors based on selection state and frequency
const createTowerIcon = (isSelected, frequency) => {
  const color = isSelected ? "#ef4444" : "#0ea5a4";
  const hueCategory = Math.floor((frequency % 10) * 255 / 10);
  return L.divIcon({
    html: `<div style="background:${color}; width:12px; height:12px; border-radius:50%; border:3px solid white; box-shadow:0 0 0 2px ${isSelected ? '#dc2626' : '#087a7b'}; font-size:0;"></div>`,
    className: 'custom-tower-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const DEFAULT_CENTER = [28.6139, 77.2090]; // New Delhi center (example)

function ClickableMap({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

// Utility: haversine distance in meters
function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple function to compute ellipse polygon points for visualization
function computeEllipsePoints(p1, p2, maxRadius, segments = 64) {
  // p1,p2 in latlng. We'll compute line midpoint and orientation then draw ellipse in projected meters
  // We'll use simple linear interpolation in lat/lon after approximating local meters <-> degrees
  // Convert to WebMercator meters for simpler math
  const project = (latlng) => {
    const R = 6378137;
    const x = R * (latlng[1] * Math.PI / 180);
    const y = R * Math.log(Math.tan(Math.PI / 4 + (latlng[0] * Math.PI / 180) / 2));
    return [x, y];
  };
  const unproject = (xy) => {
    const R = 6378137;
    const lon = (xy[0] / R) * 180 / Math.PI;
    const lat = (2 * Math.atan(Math.exp(xy[1] / R)) - Math.PI / 2) * 180 / Math.PI;
    return [lat, lon];
  };

  const A = project(p1), B = project(p2);
  const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const dx = B[0] - A[0], dy = B[1] - A[1];
  const angle = Math.atan2(dy, dx);
  const a = Math.sqrt(dx * dx + dy * dy) / 2; // semi-major in meters (half distance)
  const b = maxRadius; // semi-minor in meters (use fresnel radius)
  // generate ellipse points in local XY then rotate/translate
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const theta = 2 * Math.PI * (i / segments);
    const x = a * Math.cos(theta);
    const y = b * Math.sin(theta);
    // rotate by angle
    const xr = x * Math.cos(angle) - y * Math.sin(angle);
    const yr = x * Math.sin(angle) + y * Math.cos(angle);
    const world = [mid[0] + xr, mid[1] + yr];
    pts.push(unproject(world));
  }
  return pts;
}

export default function MapView() {
  const [towers, setTowers] = useState([]); // {id, latlng, freqGHz, name}
  const [links, setLinks] = useState([]); // {id, aId, bId}
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [editingFreq, setEditingFreq] = useState("");
  const [editingName, setEditingName] = useState("");
  const [fresnelEllipse, setFresnelEllipse] = useState(null);
  const [showLinkDistance, setShowLinkDistance] = useState(true);
  const [loadingEllipse, setLoadingEllipse] = useState(false);
  const nextTowerId = useRef(1);
  const nextLinkId = useRef(1);

  // Compute tower stats
  const towerStats = useMemo(() => {
    const stats = {};
    towers.forEach(t => {
      stats[t.id] = {
        linkCount: links.filter(l => l.aId === t.id || l.bId === t.id).length,
        connectedFreqs: new Set(
          links
            .filter(l => l.aId === t.id || l.bId === t.id)
            .map(l => (l.aId === t.id ? towers.find(x => x.id === l.bId) : towers.find(x => x.id === l.aId)))
            .filter(t => t)
            .map(t => t.freqGHz)
        )
      };
    });
    return stats;
  }, [towers, links]);

  // add tower on map click
  function handleMapClick(latlng) {
    const newTower = {
      id: nextTowerId.current++,
      latlng: [latlng.lat, latlng.lng],
      freqGHz: 5.0,
      name: `Tower ${nextTowerId.current - 1}`
    };
    setTowers(t => [...t, newTower]);
  }

  // select tower to start link creation or edit
  function handleTowerClick(tower, event) {
    event.originalEvent.preventDefault();
    if (selectedTowerId === null) {
      setSelectedTowerId(tower.id);
    } else if (selectedTowerId === tower.id) {
      // deselect
      setSelectedTowerId(null);
    } else {
      // attempt to create link between selectedTowerId and tower.id
      const a = towers.find(x => x.id === selectedTowerId);
      const b = tower;
      if (!a || !b) { setSelectedTowerId(null); return; }
      if (a.freqGHz !== b.freqGHz) {
        alert("Cannot connect towers with different frequencies. Please set both towers to same frequency (GHz).");
        setSelectedTowerId(null);
        return;
      }
      // prevent duplicate links
      const exists = links.find(l => (l.aId === a.id && l.bId === b.id) || (l.aId === b.id && l.bId === a.id));
      if (exists) {
        setSelectedTowerId(null);
        return;
      }
      setLinks(L => [...L, { id: nextLinkId.current++, aId: a.id, bId: b.id }]);
      setSelectedTowerId(null);
    }
  }

  // edit tower frequency and name
  function openEditTower(tower) {
    setEditingFreq(String(tower.freqGHz));
    setEditingName(tower.name || `Tower ${tower.id}`);
    setSelectedTowerId(tower.id);
  }
  function saveFreq() {
    setTowers(ts => ts.map(t => t.id === selectedTowerId ? ({ ...t, freqGHz: parseFloat(editingFreq) || t.freqGHz, name: editingName }) : t));
    setSelectedTowerId(null);
    setEditingFreq("");
    setEditingName("");
  }

  // remove tower or link
  function removeTower(id) {
    setTowers(ts => ts.filter(t => t.id !== id));
    setLinks(ls => ls.filter(l => l.aId !== id && l.bId !== id));
  }
  function removeLink(id) {
    setLinks(ls => ls.filter(l => l.id !== id));
    setFresnelEllipse(null);
    setSelectedLinkId(null);
  }

  // show fresnel ellipse for link
  async function handleLinkClick(link, e) {
    // find towers
    const a = towers.find(t => t.id === link.aId);
    const b = towers.find(t => t.id === link.bId);
    if (!a || !b) return;

    setSelectedLinkId(link.id);
    setLoadingEllipse(true);

    // 1) sample mid-point and approximate d1,d2 for first fresnel radius at midpoint
    const latlngA = a.latlng;
    const latlngB = b.latlng;
    const dist = haversine(latlngA, latlngB); // meters
    // choose midpoint as point
    const mid = [(latlngA[0] + latlngB[0]) / 2, (latlngA[1] + latlngB[1]) / 2];

    // 2) Get frequency in Hz
    const fHz = (a.freqGHz || b.freqGHz) * 1e9;
    const c = 3e8;
    const lambda = c / fHz;

    // d1 and d2 relative to midpoint
    const d1 = dist / 2;
    const d2 = dist / 2;
    const r = Math.sqrt((lambda * d1 * d2) / (d1 + d2)); // meters

    // Optionally fetch elevations along path (simplified): use open-elevation batch for a few points
    try {
      const samples = 11;
      const latlons = [];
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1);
        latlons.push({ latitude: latlngA[0] + (latlngB[0] - latlngA[0]) * t, longitude: latlngA[1] + (latlngB[1] - latlngA[1]) * t });
      }
      // Use open-elevation (public) - no API key. If fails, ignore.
      const resp = await axios.post("https://api.open-elevation.com/api/v1/lookup", { locations: latlons });
      // resp.data.results is an array of elevations
      // we won't use them for ellipse shape in this simplified version, but we fetch to show a demonstration
      // (In a more advanced version we'd offset ellipse by terrain)
    } catch (err) {
      // ignore
      // console.warn("Elevation fetch failed", err);
    }

    // compute ellipse points for drawing (use r as semi-minor)
    const pts = computeEllipsePoints(latlngA, latlngB, r, 120);
    setFresnelEllipse({ points: pts, radiusMeters: r, distMeters: dist });
    setLoadingEllipse(false);
  }

  return (
    <>
      <div className="app-layout">
        <div className="map-area">
          <MapContainer center={DEFAULT_CENTER} zoom={6} className="leaflet-container">
            <TileLayer
              attribution='© OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickableMap onMapClick={handleMapClick} />

            {towers.map(t =>
              <Marker
                key={t.id}
                position={t.latlng}
                icon={createTowerIcon(selectedTowerId === t.id, t.freqGHz)}
                eventHandlers={{
                  click: (e) => handleTowerClick(t, e),
                  contextmenu: () => openEditTower(t)
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  <strong>{t.name}</strong> • {t.freqGHz} GHz<br />
                  <span style={{ fontSize: '11px' }}>Links: {towerStats[t.id]?.linkCount || 0}</span>
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: 200, fontSize: '13px' }}>
                    <div><strong>{t.name}</strong> (#{t.id})</div>
                    <div className="small">📍 {t.latlng[0].toFixed(4)}, {t.latlng[1].toFixed(4)}</div>
                    <div className="small">📡 Frequency: {t.freqGHz} GHz</div>
                    <div className="small">🔗 Connected: {towerStats[t.id]?.linkCount || 0} link(s)</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      <button className="button" style={{ flex: 1 }} onClick={() => { setSelectedTowerId(t.id); setEditingFreq(String(t.freqGHz)); setEditingName(t.name); }}>Edit</button>
                      <button className="button-danger" onClick={() => removeTower(t.id)}>Remove</button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {links.map(l => {
              const a = towers.find(t => t.id === l.aId);
              const b = towers.find(t => t.id === l.bId);
              if (!a || !b) return null;
              const mid = [(a.latlng[0] + b.latlng[0]) / 2, (a.latlng[1] + b.latlng[1]) / 2];
              const dist = haversine(a.latlng, b.latlng);
              const distKm = (dist / 1000).toFixed(2);
              return (
                <React.Fragment key={l.id}>
                  <Polyline
                    positions={[a.latlng, b.latlng]}
                    eventHandlers={{ click: () => handleLinkClick(l) }}
                    pathOptions={{
                      color: selectedLinkId === l.id ? '#ef4444' : '#3b82f6',
                      weight: selectedLinkId === l.id ? 3 : 2,
                      opacity: 0.8
                    }}
                  />
                  {showLinkDistance && (
                    <CircleMarker
                      center={mid}
                      radius={4}
                      pathOptions={{ color: 'transparent' }}
                      eventHandlers={{ click: () => handleLinkClick(l) }}
                    >
                      <Tooltip permanent direction="center" opacity={0.95}>
                        <span style={{ fontSize: '11px', fontWeight: 500 }}>{distKm} km</span>
                      </Tooltip>
                    </CircleMarker>
                  )}
                </React.Fragment>
              );
            })}

            {fresnelEllipse && (
              <SVGOverlay
                bounds={getLocalBoundsAroundPoints(fresnelEllipse.points)}
                onClick={() => { setFresnelEllipse(null); setSelectedLinkId(null); }}
              >
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" pointerEvents="none">
                  <g pointerEvents="auto">
                    <polygon
                      points={fresnelEllipse.points.map(p => p[1] + "," + p[0]).join(" ")}
                      style={{
                        fill: "rgba(239, 68, 68, 0.12)",
                        stroke: "rgba(239, 68, 68, 0.6)",
                        strokeWidth: 2
                      }}
                      onClick={() => { setFresnelEllipse(null); setSelectedLinkId(null); }}
                    />
                  </g>
                </svg>
              </SVGOverlay>
            )}
          </MapContainer>

          <div className="legend">
            <div style={{ fontWeight: 600, marginBottom: 6 }}>ℹ️ Legend</div>
            <div className="small">✓ Click map — add tower</div>
            <div className="small">✓ Click tower — select, then click another to link</div>
            <div className="small">✓ Right-click tower — edit</div>
            <div className="small">✓ Click link — show Fresnel zone</div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={showLinkDistance}
                  onChange={(e) => setShowLinkDistance(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show distances
              </label>
            </div>
          </div>
          {loadingEllipse && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '12px 16px', borderRadius: 8 }}>
              Loading Fresnel zone...
            </div>
          )}
        </div>

        <div className="sidebar">
          <h4 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📍 Towers ({towers.length})</span>
          </h4>
          {towers.length === 0 && <div className="small" style={{ color: '#999' }}>No towers yet — click on the map to add one.</div>}
          <div style={{ maxHeight: 'calc(50vh - 80px)', overflowY: 'auto' }}>
            {towers.map(t => (
              <div key={t.id} className="tower-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px', marginBottom: '4px', background: selectedTowerId === t.id ? '#dbeafe' : '#f8fafc', borderRadius: 6, cursor: 'pointer' }} onClick={() => setSelectedTowerId(t.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
                  <div className="small">#{t.id} • {t.latlng[0].toFixed(4)}, {t.latlng[1].toFixed(4)}</div>
                  <div className="small">📡 {t.freqGHz} GHz • 🔗 {towerStats[t.id]?.linkCount || 0} link(s)</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="button-sm" onClick={(e) => { e.stopPropagation(); openEditTower(t); }}>✏️</button>
                  <button className="button-sm button-danger" onClick={(e) => { e.stopPropagation(); removeTower(t.id); }}>✕</button>
                </div>
              </div>
            ))}
          </div>

          <hr style={{ margin: '12px 0' }} />
          <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔗 Links ({links.length})</span>
          </h4>
          {links.length === 0 && <div className="small" style={{ color: '#999' }}>No links yet.</div>}
          <div style={{ maxHeight: 'calc(50vh - 80px)', overflowY: 'auto' }}>
            {links.map(l => {
              const a = towers.find(t => t.id === l.aId);
              const b = towers.find(t => t.id === l.bId);
              const dist = a && b ? haversine(a.latlng, b.latlng) : 0;
              const distKm = (dist / 1000).toFixed(2);
              return (
                <div key={l.id} className="tower-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px', marginBottom: '4px', background: selectedLinkId === l.id ? '#fee2e2' : '#f8fafc', borderRadius: 6, cursor: 'pointer' }} onClick={() => handleLinkClick(l)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Link #{l.id}</div>
                    <div className="small">{a ? `${a.name}` : '?'} ↔ {b ? `${b.name}` : '?'}</div>
                    <div className="small">📏 {distKm} km • 📡 {a?.freqGHz || b?.freqGHz} GHz</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button className="button-sm" onClick={(e) => { e.stopPropagation(); handleLinkClick(l); }}>👁️</button>
                    <button className="button-sm button-danger" onClick={(e) => { e.stopPropagation(); removeLink(l.id); }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTowerId !== null && towers.find(t => t.id === selectedTowerId) && (
            <div style={{ marginTop: 12, padding: 12, background: '#f0f9ff', borderRadius: 6, borderLeft: '4px solid #0ea5a4' }}>
              <h4 style={{ marginTop: 0, marginBottom: 8 }}>✏️ Edit Tower</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label className="small" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Tower Name</label>
                  <input className="input" value={editingName} onChange={(e) => setEditingName(e.target.value)} placeholder="e.g., Tower A" />
                </div>
                <div>
                  <label className="small" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Frequency (GHz)</label>
                  <input className="input" type="number" step="0.1" value={editingFreq} onChange={(e) => setEditingFreq(e.target.value)} placeholder="e.g., 5.0" />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="button" style={{ flex: 1 }} onClick={saveFreq}>Save</button>
                  <button className="button-secondary" style={{ flex: 1 }} onClick={() => { setSelectedTowerId(null); setEditingFreq(''); setEditingName(''); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {fresnelEllipse && (
            <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', borderRadius: 6, borderLeft: '4px solid #ef4444' }}>
              <h4 style={{ marginTop: 0, marginBottom: 6 }}>📊 Fresnel Zone</h4>
              <div className="small">
                <div>Radius: <strong>{(fresnelEllipse.radiusMeters).toFixed(0)} m</strong></div>
                <div>Distance: <strong>{(fresnelEllipse.distMeters / 1000).toFixed(2)} km</strong></div>
              </div>
              <button className="button-sm" style={{ marginTop: 8, width: '100%' }} onClick={() => { setFresnelEllipse(null); setSelectedLinkId(null); }}>Clear</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
