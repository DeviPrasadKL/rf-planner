import React, { useState } from "react";
import MapView from "./components/MapView";
import "leaflet/dist/leaflet.css";

export default function App() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="app">
      <div className="header">
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <h3 style={{margin:0}}>📡 RF Link Planner</h3>
          <div className="small">Plan point-to-point RF links with Fresnel zone visualization</div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button 
            className="button-secondary" 
            style={{padding: '6px 12px', fontSize: '13px'}}
            onClick={() => setShowHelp(!showHelp)}
          >
            {showHelp ? '✕ Close Help' : '? Help'}
          </button>
          <a className="button" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
      
      {showHelp && (
        <div className="help-panel">
          <div className="help-content">
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div>
                <h4 style={{marginTop: 0}}>Getting Started</h4>
                <ul style={{marginBottom: '12px', paddingLeft: '20px'}}>
                  <li><strong>Add Tower:</strong> Click on the map to place a tower</li>
                  <li><strong>Edit Tower:</strong> Right-click a tower or use the Edit button in the sidebar</li>
                  <li><strong>Create Link:</strong> Click one tower, then click another with the same frequency</li>
                  <li><strong>View Fresnel Zone:</strong> Click on a link to see the first Fresnel zone (ellipse)</li>
                </ul>
              </div>
              <div>
                <h4 style={{marginTop: 0}}>Key Concepts</h4>
                <ul style={{marginBottom: '12px', paddingLeft: '20px'}}>
                  <li><strong>Frequency:</strong> Only towers with the same GHz can connect</li>
                  <li><strong>Fresnel Zone:</strong> Calculated area around the RF link for signal propagation</li>
                  <li><strong>Link Distance:</strong> Great-circle distance between towers</li>
                  <li><strong>Formula:</strong> r = √((λ × d₁ × d₂) / (d₁ + d₂))</li>
                </ul>
              </div>
            </div>
            <div style={{background: '#f0f9ff', padding: '12px', borderRadius: '6px', marginTop: '12px', fontSize: '12px', borderLeft: '4px solid #0ea5a4'}}>
              <strong>💡 Tip:</strong> The Fresnel zone is an ellipse centered on the link line. Clear obstructions in this zone to ensure good signal quality.
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <MapView />
      </div>
    </div>
  );
}
