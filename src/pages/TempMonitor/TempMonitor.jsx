// ====================================================================
// Data Operator Temp Monitor Component (src/pages/TempMonitor/TempMonitor.jsx)
// Paired with: src/pages/TempMonitor/TempMonitor.css
// Strictly 24-Hour Inspection Time Format (HH:MM - No AM/PM)
// ====================================================================

import React, { useState, useRef, useEffect } from 'react';
import { 
  Thermometer, Plus, CheckCircle, PlusCircle, Camera, Loader2, Check, Trash2, RefreshCw
} from 'lucide-react';
import { addChamberLog, fetchChamberLogs, deleteChamberLog } from '../../services/api';
import exifr from 'exifr';
import './TempMonitor.css'; // Paired CSS file

export default function TempMonitor() {
  const todayStr = new Date().toISOString().split('T')[0];
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  // Is Chamber Name in custom text mode?
  const [isChamberCustom, setIsChamberCustom] = useState(false);
  // Is Time in custom time picker mode?
  const [isTimeCustom, setIsTimeCustom] = useState(false);

  // Compressed Temp Sensor Image File & Preview Thumbnail State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Inspection Logs & Loading States
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Verification Step Data State
  const [verificationData, setVerificationData] = useState(null);

  // Direct On-Screen Form State (Strict 24-Hour Time)
  const [formData, setFormData] = useState({
    entry_date: todayStr,
    client_name: '',
    chamber_name: 'BDF-1',
    inspection_time: '11:00',
    chamber_temp: '',
    monitor_supervisor_name: ''
  });

  const formatDateTime = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const calculateVariance = (entryDateStr, inspectionTimeStr, captureDate) => {
    try {
      if (!entryDateStr || !inspectionTimeStr || !captureDate) return 0;
      const [hours, minutes] = inspectionTimeStr.split(':').map(Number);
      const [year, month, day] = entryDateStr.split('-').map(Number);
      
      // Timezone-safe local Date instantiation
      const inspectionDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      const diffMs = Math.abs(captureDate.getTime() - inspectionDate.getTime());
      return Math.round(diffMs / (1000 * 60));
    } catch (e) {
      console.error(e);
      return 0;
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    const data = await fetchChamberLogs();
    setLogs(data || []);
    setLoadingLogs(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleDeleteLog = async (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      await deleteChamberLog(id);
      loadLogs();
    }
  };

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
                lastModified: file.lastModified
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

    // 1. Parse EXIF DateTimeOriginal from the original file BEFORE Canvas compression strips it
    let originalCaptureDate = null;
    try {
      const exif = await exifr.parse(file);
      if (exif && exif.DateTimeOriginal) {
        originalCaptureDate = new Date(exif.DateTimeOriginal);
      }
    } catch (err) {
      console.warn('Failed to parse EXIF metadata on frontend:', err.message);
    }

    // 2. Compress image using Canvas
    const compressed = await compressImageFile(file);

    // 3. Fallback hierarchy: EXIF camera capture time -> File lastModified time -> Current server time
    const captureTime = originalCaptureDate || new Date(file.lastModified || Date.now());

    // 4. Wrap compressed blob/file in a new File preserving the resolved capture timestamp
    const finalFile = new File([compressed.file], file.name || 'temp-sensor-photo.jpg', {
      type: 'image/jpeg',
      lastModified: captureTime.getTime()
    });

    setImageFile(finalFile);
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
  const handleDirectFormSubmit = (e) => {
    e.preventDefault();

    const isDateEmpty = !formData.entry_date;
    const isClientEmpty = !formData.client_name || !formData.client_name.trim();
    const isChamberEmpty = !formData.chamber_name || !formData.chamber_name.trim();
    const isTimeEmpty = !formData.inspection_time;
    const isTempEmpty = !formData.chamber_temp;
    const isSupervisorEmpty = !formData.monitor_supervisor_name || !formData.monitor_supervisor_name.trim();
    const isPhotoEmpty = !imageFile;

    if (isDateEmpty || isClientEmpty || isChamberEmpty || isTimeEmpty || isTempEmpty || isSupervisorEmpty || isPhotoEmpty) {
      setShowErrors(true);
      
      const missingFields = [];
      if (isDateEmpty) missingFields.push('Entry Date');
      if (isClientEmpty) missingFields.push('Client Name');
      if (isChamberEmpty) missingFields.push('Chamber Name');
      if (isTimeEmpty) missingFields.push('Inspection Time');
      if (isTempEmpty) missingFields.push('Chamber Temp');
      if (isSupervisorEmpty) missingFields.push('Monitor Supervisor Name');
      if (isPhotoEmpty) missingFields.push('Temp Sensor Photo');

      alert(`⚠️ Validation Error:\nPlease fill all required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setShowErrors(false);

    // Calculate metadata from the file uploaded on client
    const captureTime = new Date(imageFile.lastModified || Date.now());
    const formattedCapture = formatDateTime(captureTime);
    const variance = calculateVariance(formData.entry_date, formData.inspection_time, captureTime);

    setVerificationData({
      photo_capture_time_str: formattedCapture,
      time_variance_minutes: variance
    });
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);

    const submissionData = new FormData();
    submissionData.append('entry_date', formData.entry_date);
    submissionData.append('client_name', formData.client_name);
    submissionData.append('chamber_name', formData.chamber_name);
    submissionData.append('inspection_time', formData.inspection_time);
    submissionData.append('chamber_temp', formData.chamber_temp);
    submissionData.append('monitor_supervisor_name', formData.monitor_supervisor_name);
    
    // Pass frontend-audited capture times to the backend database insert
    if (verificationData) {
      submissionData.append('photo_capture_time', verificationData.photo_capture_time_str);
      submissionData.append('time_variance_minutes', verificationData.time_variance_minutes);
    }

    if (imageFile) {
      submissionData.append('temp_sensor_image', imageFile);
    }

    await addChamberLog(submissionData);
    setSubmitting(false);
    setVerificationData(null);
    loadLogs();

    // Show Success Alert Notification
    setSuccessMsg('Chamber temperature saved successfully');

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

  const handleCancelVerification = () => {
    setVerificationData(null);
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
            Make sure the sensor image capture time and inspection time match closely to avoid audit discrepancies.
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
                className={showErrors && !formData.entry_date ? 'input-error' : ''}
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
                className={showErrors && !formData.client_name ? 'input-error' : ''}
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
                  className={showErrors && !formData.chamber_name ? 'input-error' : ''}
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
                  className={showErrors && !formData.chamber_name ? 'input-error' : ''}
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
                  className={showErrors && !formData.inspection_time ? 'input-error' : ''}
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
                  className={showErrors && !formData.inspection_time ? 'input-error' : ''}
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
                className={showErrors && !formData.chamber_temp ? 'input-error' : ''}
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
                className={showErrors && !formData.monitor_supervisor_name ? 'input-error' : ''}
              />
            </div>

            {/* Field 7: Temp Sensor Photo */}
            <div className="direct-form-group">
              <label>Temp Sensor Photo *</label>
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
                    className={`sensor-camera-trigger ${showErrors && !imageFile ? 'error' : ''}`}
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

      {/* 3. Daily Temp Logs History List */}
      <div className="direct-form-card logs-history-card">
        <div className="direct-form-header">
          <h3>
            <Thermometer size={18} color="#00a2e8" />
            <span>Inspection Log History</span>
          </h3>
        </div>

        {(() => {
          const todayLogs = logs.filter(log => {
            const logDate = log.formatted_date || (log.entry_date ? log.entry_date.split('T')[0] : '');
            return logDate === todayStr;
          });

          if (loadingLogs) {
            return (
              <div className="loading-logs">
                <Loader2 size={24} className="spinner-icon" color="#00a2e8" />
                <span>Loading history logs...</span>
              </div>
            );
          }

          if (todayLogs.length === 0) {
            return (
              <div className="no-logs">
                <p>No daily temperature inspection logs found for today.</p>
              </div>
            );
          }

          return (
            <div className="table-responsive">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="wrap-text">Client</th>
                    <th>Chamber</th>
                    <th>Inspection Time</th>
                    <th>Sensor Temp</th>
                    <th className="wrap-text">Supervisor</th>
                    <th>Image</th>
                    <th className="wrap-text">Capture Time (Actual)</th>
                    <th>Variance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLogs.map((log) => {
                    const varMin = log.time_variance_minutes || 0;
                    let varianceClass = varMin > 120 ? 'variance-red' : 'variance-green';
                  let varianceLabel = `${varMin} mins`;

                  const imageSrc = log.temp_sensor_image && log.temp_sensor_image.startsWith('data:image') 
                    ? log.temp_sensor_image 
                    : `http://localhost:5000/${log.temp_sensor_image}`;

                  return (
                    <tr key={log.id}>
                      <td>{log.formatted_date || log.entry_date}</td>
                      <td className="wrap-text"><strong>{log.client_name}</strong></td>
                      <td><span className="chamber-badge">{log.chamber_name}</span></td>
                      <td>{log.inspection_time}</td>
                      <td className="temp-cell"><strong>{log.chamber_temp}°C</strong></td>
                      <td className="wrap-text">{log.monitor_supervisor_name}</td>
                      <td className="photo-cell">
                        {log.temp_sensor_image ? (
                          <div 
                            className="view-photo-link"
                            onClick={() => setLightboxImage(imageSrc)}
                          >
                            <img 
                              src={imageSrc} 
                              alt="Sensor" 
                              className="table-photo-thumb"
                            />
                          </div>
                        ) : (
                          <span className="no-photo-text">No Photo</span>
                        )}
                      </td>
                      <td className="time-text">
                        {log.photo_capture_time ? (
                          <span>{log.photo_capture_time.split(' ')[1] || log.photo_capture_time}</span>
                        ) : (
                          <span className="no-photo-text">-</span>
                        )}
                      </td>
                      <td>
                        {log.photo_capture_time ? (
                          <span className={`variance-pill ${varianceClass}`}>
                            {varianceLabel}
                          </span>
                        ) : (
                          <span className="no-photo-text">-</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteLog(log.id)}
                          className="delete-log-action-btn"
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Temperature Sensor Full Size" />
            <button className="lightbox-close" onClick={() => setLightboxImage(null)}>×</button>
          </div>
        </div>
      )}

      {/* Verification Modal Popup Overlay */}
      {verificationData && (
        <div className="verification-modal-overlay">
          <div className="verification-modal-content">
            <div className="direct-form-header">
              <h3 className="verify-title">
                <CheckCircle size={20} color="#10b981" />
                <span>Verify Time Audit Details</span>
              </h3>
            </div>
            
            <div className="verification-content-wrapper-modal">
              {/* Time variance box */}
              <div className="verify-time-comparison-box">
                <h4>Time Audit Comparison</h4>
                
                <div className="comparison-row">
                  <div className="comp-item">
                    <span className="comp-label">Reported Time</span>
                    <div className="comp-val-dt">
                      <span className="comp-date">{formData.entry_date}</span>
                      <span className="comp-time">{formData.inspection_time}</span>
                    </div>
                  </div>
                  <div className="comp-divider">⚡</div>
                  <div className="comp-item">
                    <span className="comp-label">Actual Photo Time</span>
                    <div className="comp-val-dt">
                      <span className="comp-date">{verificationData.photo_capture_time_str.split(' ')[0]}</span>
                      <span className="comp-time">{verificationData.photo_capture_time_str.split(' ')[1]}</span>
                    </div>
                  </div>
                </div>

                <div className="variance-audit-result">
                  <span>Variance Detected:</span>
                  <strong className={`variance-pill ${
                    verificationData.time_variance_minutes > 120 ? 'variance-red' : 'variance-green'
                  }`}>
                    {verificationData.time_variance_minutes} minutes
                  </strong>
                </div>

                {verificationData.time_variance_minutes <= 120 ? (
                  <div className="variance-success-banner">
                    ✅ Audit Verified: Inspection completed within the scheduled window.
                  </div>
                ) : (
                  <div className="variance-alert-banner">
                    ⚠️ Audit Alert: Entry recorded outside the scheduled inspection window.
                  </div>
                )}

                {/* Show Date Discrepancy Alert to the DO operator */}
                {verificationData.photo_capture_time_str.split(' ')[0] !== formData.entry_date && (
                  <div className="variance-alert-banner" style={{ marginTop: '8px', border: '1.5px solid #ef4444', color: '#b91c1c', backgroundColor: '#fef2f2' }}>
                    ⚠️ Date Alert: Photo captured on {verificationData.photo_capture_time_str.split(' ')[0]}, but you are submitting for {formData.entry_date}!
                  </div>
                )}
              </div>
            </div>

            <div className="verification-actions">
              <button 
                type="button" 
                className="cancel-verify-btn" 
                onClick={handleCancelVerification}
                disabled={submitting}
              >
                <span>Back to Edit Form</span>
              </button>

              <button 
                type="button" 
                className="confirm-submit-btn" 
                onClick={handleConfirmSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spinner-icon" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Confirm & Continue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
