// ====================================================================
// Add Lead Page Component (src/pages/AddLead/AddLead.jsx)
// Paired with: src/pages/AddLead/AddLead.css
// Form screen for creating a new sales lead.
// ====================================================================

import React, { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { createLead } from '../../services/api';
import './AddLead.css'; // Paired CSS file

export default function AddLead({ setActiveTab }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    status: 'New',
    source: 'Website',
    value: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please fill in required fields: Name & Phone Number.');
      return;
    }

    setSubmitting(true);
    const res = await createLead(formData);
    setSubmitting(false);

    if (res.success) {
      setSuccessMessage('Lead successfully saved!');
      setTimeout(() => {
        setActiveTab('leads');
      }, 1000);
    }
  };

  return (
    <div className="add-lead-page">
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add New Lead</h2>

      {successMessage && (
        <div style={{
          backgroundColor: '#dcfce7',
          color: '#15803d',
          padding: '12px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <form className="form-card" onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="form-group">
          <label>Lead Full Name *</label>
          <input 
            type="text" 
            name="name"
            className="form-input" 
            placeholder="e.g. Ramesh Verma" 
            value={formData.name}
            onChange={handleChange}
            required 
          />
        </div>

        {/* Company Name */}
        <div className="form-group">
          <label>Company / Business Name</label>
          <input 
            type="text" 
            name="company"
            className="form-input" 
            placeholder="e.g. Apex Cold Storage" 
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        {/* 2 Column Row: Phone & Email */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Phone Number *</label>
            <input 
              type="tel" 
              name="phone"
              className="form-input" 
              placeholder="9876543210" 
              value={formData.phone}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              className="form-input" 
              placeholder="name@email.com" 
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 2 Column Row: Status & Source */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Status</label>
            <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="In Progress">In Progress</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div className="form-group">
            <label>Source</label>
            <select name="source" className="form-select" value={formData.source} onChange={handleChange}>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>
        </div>

        {/* Expected Deal Value */}
        <div className="form-group">
          <label>Expected Value (INR ₹)</label>
          <input 
            type="number" 
            name="value"
            className="form-input" 
            placeholder="e.g. 50000" 
            value={formData.value}
            onChange={handleChange}
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label>Notes / Requirements</label>
          <textarea 
            name="notes"
            rows="3"
            className="form-textarea" 
            placeholder="Add details about lead interest, follow-up dates..." 
            value={formData.notes}
            onChange={handleChange}
          ></textarea>
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={submitting}>
          <Save size={18} />
          <span>{submitting ? 'Saving...' : 'Save Lead'}</span>
        </button>
      </form>
    </div>
  );
}
