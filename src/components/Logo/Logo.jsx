// ====================================================================
// ReeferON Logo Component (src/components/Logo/Logo.jsx)
// Paired with: src/components/Logo/Logo.css
// Renders official ReeferON Cold Chain logo from image asset.
// ====================================================================

import React from 'react';
import logoImg from './logo.png';
import './Logo.css'; // Paired CSS file

export default function Logo({ compact = false }) {
  return (
    <div className={`reeferon-logo-wrapper ${compact ? 'compact' : ''}`}>
      <img src={logoImg} alt="ReeferON" className="brand-logo-img" />
    </div>
  );
}
