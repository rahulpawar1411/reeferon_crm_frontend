// ====================================================================
// Data Operator Temp Monitor Component (src/pages/TempMonitor/TempMonitor.jsx)
// Paired with: src/pages/TempMonitor/TempMonitor.css
// Strictly 24-Hour Inspection Time Format (HH:MM - No AM/PM)
// ====================================================================

import React, { useState, useRef } from 'react';
import { 
  Thermometer, Plus, CheckCircle, PlusCircle, Camera, Loader2, Check, Trash2, RefreshCw
} from 'lucide-react';
import { addChamberLog } from '../../services/api';
import './TempMonitor.css'; // Paired CSS file

export default function TempMonitor() {
  const todayStr = new Date().toISOString().split('T')[0];
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Is Chamber Name in custom text mode?
  const [isChamberCustom, setIsChamberCustom] = useState(false);
  // Is Time in custom time picker mode?
  const [isTimeCustom, setIsTimeCustom] = useState(false);

  // Compressed Temp Sensor Image File & Preview Thumbnail State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Direct On-Screen Form State (Strict 24-Hour Time)
  const [formData, setFormData] = useState({
    entry_date: todayStr,
    client_name: '',
    chamber_name: 'BDF-1',
    inspection_time: '11:00',
    chamber_temp: '',
    monitor_supervisor_name: ''
  });

  // Client-Side Canvas Image Compressor
  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      setCompressing(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Quality 0.75 JPEG
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name || 'temp-sensor-photo.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              setCompressing(false);
              resolve({ file: compressedFile, previewUrl: URL.createObjectURL(blob) });
            } else {
              setCompressing(false);
              resolve({ file, previewUrl: URL.createObjectURL(file) });
            }
          }, 'image/jpeg', 0.75);
        };
      };
    });
  };

  // Handle Temp Sensor Photo Selection / Mobile Camera Click
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const compressed = await compressImageFile(file);
    setImageFile(compressed.file);
    setImagePreview(compressed.previewUrl);
  };

  // Retake Photo (Triggers camera/file picker again)
  const handleRetakeImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Delete Image
  const handleDeleteImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Chamber Select Dropdown Change
  const handleChamberChange = (val) => {
    if (val === 'OTHER_CUSTOM') {
      setIsChamberCustom(true);
      setFormData(prev => ({ ...prev, chamber_name: '' }));
    } else {
      setIsChamberCustom(false);
      setFormData(prev => ({ ...prev, chamber_name: val }));
    }
  };

  // Helper to get current system time in strict 24-Hour HH:MM format
  const getCurrentTimeHHMM = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Handle Time Select Dropdown Change (Defaults to 24-Hour format)
  const handleTimeChange = (val) => {
    if (val === 'OTHER_CUSTOM') {
      setIsTimeCustom(true);
      const currentTime = getCurrentTimeHHMM();
      setFormData(prev => ({ ...prev, inspection_time: currentTime }));
    } else {
      setIsTimeCustom(false);
      setFormData(prev => ({ ...prev, inspection_time: val }));
    }
  };

  // Handle Direct On-Screen Form Submit
  const handleDirectFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_name || !formData.chamber_name || !formData.chamber_temp || !formData.monitor_supervisor_name) {
      alert('Please fill all required fields: Entry Date, Client Name, Chamber Name, Chamber Temp, and Monitor Supervisor Name.');
      return;
    }

    setSubmitting(true);

    // Prepare FormData for Multi-part File Upload
    const submissionData = new FormData();
    submissionData.append('entry_date', formData.entry_date);
    submissionData.append('client_name', formData.client_name);
    submissionData.append('chamber_name', formData.chamber_name);
    submissionData.append('inspection_time', formData.inspection_time);
    submissionData.append('chamber_temp', formData.chamber_temp);
    submissionData.append('monitor_supervisor_name', formData.monitor_supervisor_name);

    if (imageFile) {
      submissionData.append('temp_sensor_image', imageFile);
    }

    await addChamberLog(submissionData);
    setSubmitting(false);

    // Show Success Alert Notification
    setSuccessMsg(`Chamber temperature record for "${formData.client_name}" saved successfully in MySQL database!`);

    // Reset Form
    setIsChamberCustom(false);
    setIsTimeCustom(false);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setFormData({
      entry_date: todayStr,
      client_name: '',
      chamber_name: 'BDF-1',
      inspection_time: '11:00',
      chamber_temp: '',
      monitor_supervisor_name: ''
    });

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  return (
    <div className="temp-monitor-page">
      {/* 1. Header Banner */}
      <div className="do-header-banner">
        <div className="do-header-left">
          <h2>
            <Thermometer size={26} color="#00a2e8" />
            <span>DO Daily Chamber Temp Monitor</span>
          </h2>
          <p>
            Record daily chamber temperatures directly into MySQL database with compressed temp sensor photo capture.
          </p>
        </div>
      </div>

      {/* Success Banner Notification */}
      {successMsg && (
        <div className="success-banner-do">
          <CheckCircle size={20} color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. DIRECT ON-SCREEN ENTRY FORM CARD */}
      <div className="direct-form-card">
        <div className="direct-form-header">
          <h3>
            <PlusCircle size={18} color="#00a2e8" />
            <span>Add New Daily Chamber Temp Record</span>
          </h3>
        </div>

        <form onSubmit={handleDirectFormSubmit}>
          <div className="direct-form-grid">
            {/* Field 1: Entry Date */}
            <div className="direct-form-group">
              <label>Entry Date *</label>
              <input 
                type="date" 
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                required
              />
            </div>

            {/* Field 2: Client Name */}
            <div className="direct-form-group">
              <label>Client Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Amul Ice Creams"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>

            {/* Field 3: Chamber Name */}
            <div className="direct-form-group">
              <label>Chamber Name *</label>
              {!isChamberCustom ? (
                <select 
                  value={formData.chamber_name}
                  onChange={(e) => handleChamberChange(e.target.value)}
                  required
                >
                  <option value="BDF-1">BDF-1</option>
                  <option value="BDF-2">BDF-2</option>
                  <option value="BDF-3">BDF-3</option>
                  <option value="BDF-4">BDF-4</option>
                  <option value="BDF-5">BDF-5</option>
                  <option value="BDF-6">BDF-6</option>
                  <option value="BDF-7">BDF-7</option>
                  <option value="BDF-8">BDF-8</option>
                  <option value="OTHER_CUSTOM">Other (Type Custom Name...)</option>
                </select>
              ) : (
                <input 
                  type="text"
                  placeholder="Type custom Chamber Name..."
                  value={formData.chamber_name}
                  onChange={(e) => setFormData({ ...formData, chamber_name: e.target.value })}
                  required
                  autoFocus
                />
              )}
            </div>

            {/* Field 4: Inspection Time (Strict 24-Hour Format - No AM/PM) */}
            <div className="direct-form-group">
              <label>Inspection Time *</label>
              {!isTimeCustom ? (
                <select 
                  value={formData.inspection_time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  required
                >
                  <option value="11:00">11:00</option>
                  <option value="18:00">18:00</option>
                  <option value="OTHER_CUSTOM">Other (Current 24h Clock...)</option>
                </select>
              ) : (
                <input 
                  type="time"
                  value={formData.inspection_time}
                  onChange={(e) => setFormData({ ...formData, inspection_time: e.target.value })}
                  required
                  autoFocus
                />
              )}
            </div>

            {/* Field 5: Chamber Temp (°C) */}
            <div className="direct-form-group">
              <label>Chamber Temp (°C) *</label>
              <input 
                type="number" 
                step="0.1" 
                placeholder="e.g. -18.5"
                value={formData.chamber_temp}
                onChange={(e) => setFormData({ ...formData, chamber_temp: e.target.value })}
                required
              />
            </div>

            {/* Field 6: Monitor Supervisor Name */}
            <div className="direct-form-group">
              <label>Monitor Supervisor Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Rajesh Kumar"
                value={formData.monitor_supervisor_name}
                onChange={(e) => setFormData({ ...formData, monitor_supervisor_name: e.target.value })}
                required
              />
            </div>

            {/* Field 7: Temp Sensor Photo */}
            <div className="direct-form-group">
              <label>Temp Sensor Photo</label>
              <input 
                type="file" 
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />

              <div className="unique-photo-wrapper">
                {compressing ? (
                  // Compressing State
                  <div className="sensor-compressing-box">
                    <Loader2 size={16} color="#00a2e8" className="spinner-icon" />
                    <span>Compressing Photo...</span>
                  </div>
                ) : !imagePreview ? (
                  // Camera Trigger Button
                  <button 
                    type="button" 
                    className="sensor-camera-trigger"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Camera size={18} color="#00a2e8" />
                    <span>Take Photo / Upload</span>
                  </button>
                ) : (
                  // Verified Photo Card (Preview + Retake + Delete)
                  <div className="sensor-photo-verified-card">
                    <div className="verified-thumb-wrapper">
                      <img src={imagePreview} alt="Temp Sensor Verified" />
                      <div className="verified-check-badge">
                        <Check size={8} />
                      </div>
                    </div>

                    <div className="verified-action-group">
                      <button 
                        type="button" 
                        className="retake-icon-btn"
                        onClick={handleRetakeImage}
                        title="Retake Photo"
                      >
                        <RefreshCw size={12} />
                        <span>Retake</span>
                      </button>

                      <button 
                        type="button" 
                        className="delete-photo-btn"
                        onClick={handleDeleteImage}
                        title="Remove Photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-direct-btn" disabled={submitting || compressing}>
              <Plus size={18} />
              <span>{submitting ? 'Saving...' : 'Add Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
