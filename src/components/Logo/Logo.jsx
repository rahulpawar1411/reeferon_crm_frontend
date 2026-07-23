// ====================================================================
// ReeferON Logo Component (src/components/Logo/Logo.jsx)
// Paired with: src/components/Logo/Logo.css
// Renders official ReeferON Cold Chain logo with Cyan/Green branding & tagline.
// ====================================================================

import React from 'react';
import './Logo.css'; // Paired CSS file

export default function Logo({ compact = false }) {
  return (
    <div className={`reeferon-logo-wrapper ${compact ? 'compact' : ''}`}>
      {/* Power Dial Icon with Green 'R' Badge */}
      <div className="logo-icon-dial">
        <div className="logo-r-badge">R</div>
      </div>

      {/* Brand Text & Tagline */}
      <div className="logo-text-block">
        <div className="brand-main-title">
          <span className="brand-reefer">Reefer</span>
          <span className="brand-on">ON</span>
        </div>
        <span className="brand-tagline">
          Anything to Everything in Cold Chain
        </span>
      </div>
    </div>
  );
}
