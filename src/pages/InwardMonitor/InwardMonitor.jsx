// ====================================================================
// DO Inward Temp Monitor Component (src/pages/InwardMonitor/InwardMonitor.jsx)
// Paired with: src/pages/InwardMonitor/InwardMonitor.css
// Handles comprehensive Inward vehicle inspections in a single card with rounded boxes.
// ====================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowDownLeft, Plus, CheckCircle, PlusCircle, Camera, Loader2, Trash2, Calendar, FileText, Truck, Thermometer, Check, RefreshCw
} from 'lucide-react';
import { addInwardLog, fetchInwardLogs, deleteInwardLog } from '../../services/api';
import exifr from 'exifr';
import './InwardMonitor.css';

export default function InwardMonitor() {
  const getLocalTodayStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const todayStr = getLocalTodayStr();
  const fileInputRef = useRef({});

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    inward_entry_date: todayStr,
    inward_vehicle_no: '',
    inward_seal_no: '',
    inward_vehicle_temp: '',
    inward_material_temp: '',
    inward_transporter_name: '',
    inward_driver_name: '',
    inward_driver_no: '',
    inward_client_name: '',
    inward_dock_no: '',
    inward_vehicle_reporting_time: '11:00',
    inward_unloading_start_time: '11:30',
    inward_unloading_duration_hours: '1',
    inward_unloading_duration_mins: '0',
    inward_unloading_end_time: '12:30',
    inward_pallets_in_qty: '',
    inward_invoice_qty: '',
    inward_received_qty: '',
    inward_received_boxes_qty: '',
    inward_short_received_boxes_qty: 0,
    inward_excess_received_boxes_qty: 0,
    inward_damage_received_boxes_qty: '',
    inward_material_type: 'Frozen',
    inward_unloading_supervisor_name: '',
    inward_remarks: ''
  });

  // Custom text triggers for dropdown inputs
  const [isMaterialCustom, setIsMaterialCustom] = useState(false);
  const [driverCountryCode, setDriverCountryCode] = useState('+91');

  // Uploaded Files State
  const [invoicePhoto, setInvoicePhoto] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [podPhoto, setPodPhoto] = useState(null);
  const [podPreview, setPodPreview] = useState(null);
  const [sealPhoto, setSealPhoto] = useState(null);
  const [sealPreview, setSealPreview] = useState(null);
  const [vehicleTempPhoto, setVehicleTempPhoto] = useState(null);
  const [vehicleTempPreview, setVehicleTempPreview] = useState(null);
  const [materialTempPhoto, setMaterialTempPhoto] = useState(null);
  const [materialTempPreview, setMaterialTempPreview] = useState(null);
  const [vehicleBackPhoto, setVehicleBackPhoto] = useState(null);
  const [vehicleBackPreview, setVehicleBackPreview] = useState(null);
  const [vehicleBackWithMaterialPhoto, setVehicleBackWithMaterialPhoto] = useState(null);
  const [vehicleBackWithMaterialPreview, setVehicleBackWithMaterialPreview] = useState(null);
  const [countSheetPhoto, setCountSheetPhoto] = useState(null);
  const [countSheetPreview, setCountSheetPreview] = useState(null);
  const [damagePhotos, setDamagePhotos] = useState([]);
  const [damagePreviews, setDamagePreviews] = useState([]);

  // Time Verification Modal State
  const [verificationData, setVerificationData] = useState(null);

  // Load Logs
  const loadLogs = async () => {
    setLoadingLogs(true);
    const data = await fetchInwardLogs();
    setLogs(data || []);
    setLoadingLogs(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Update auto-calculated boxes quantity
  useEffect(() => {
    const inv = parseInt(formData.inward_invoice_qty) || 0;
    const rec = parseInt(formData.inward_received_qty) || 0;

    setFormData(prev => ({
      ...prev,
      inward_short_received_boxes_qty: inv > rec ? inv - rec : 0,
      inward_excess_received_boxes_qty: rec > inv ? rec - inv : 0
    }));
  }, [formData.inward_invoice_qty, formData.inward_received_qty]);

  // Reset damage photo files if damage quantity is reset to 0
  useEffect(() => {
    const damageQty = parseInt(formData.inward_damage_received_boxes_qty) || 0;
    if (damageQty === 0) {
      setDamagePhotos([]);
      setDamagePreviews([]);
    }
  }, [formData.inward_damage_received_boxes_qty]);

  const calculateEndDateTime = (dateStr, timeStr, durationMinutes) => {
    if (!dateStr || !timeStr || isNaN(durationMinutes)) return '';

    // Parse entry date & reporting time
    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
    const [hours, mins] = timeStr.split(':').map(Number);

    // Create Date object
    const startDateTime = new Date(yyyy, mm - 1, dd, hours, mins, 0);
    // Add duration minutes
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    // Format outputs
    const endYear = endDateTime.getFullYear();
    const endMonth = String(endDateTime.getMonth() + 1).padStart(2, '0');
    const endDate = String(endDateTime.getDate()).padStart(2, '0');
    const endHours = String(endDateTime.getHours()).padStart(2, '0');
    const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0');

    return `${endDate}-${endMonth}-${endYear} ${endHours}:${endMinutes}`;
  };

  // Update unloading end times dynamically based on unloading start time and duration
  useEffect(() => {
    const hours = parseInt(formData.inward_unloading_duration_hours) || 0;
    const mins = parseInt(formData.inward_unloading_duration_mins) || 0;
    const totalMinutes = hours * 60 + mins;

    const unloadingStartTime = formData.inward_unloading_start_time || '11:30';
    const entryDate = formData.inward_entry_date || todayStr;

    const endDateTimeStr = calculateEndDateTime(entryDate, unloadingStartTime, totalMinutes);

    setFormData(prev => ({
      ...prev,
      inward_unloading_end_time: endDateTimeStr
    }));
  }, [formData.inward_entry_date, formData.inward_unloading_start_time, formData.inward_unloading_duration_hours, formData.inward_unloading_duration_mins]);

  // Client-Side Canvas Image Compressor
  const compressImageFile = (file) => {
    return new Promise((resolve) => {
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

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name || 'compressed-photo.jpg', {
                type: 'image/jpeg',
                lastModified: file.lastModified
              });
              resolve({ file: compressedFile, previewUrl: URL.createObjectURL(blob) });
            } else {
              resolve({ file, previewUrl: URL.createObjectURL(file) });
            }
          }, 'image/jpeg', 0.75);
        };
      };
    });
  };

  // Image Selection Handlers

  const handleMultipleDamageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setCompressing(true);
    const compressedList = [];
    const previewList = [];

    for (let file of files) {
      let originalCaptureDate = null;
      try {
        const exif = await exifr.parse(file);
        if (exif && exif.DateTimeOriginal) {
          originalCaptureDate = new Date(exif.DateTimeOriginal);
        }
      } catch (err) {
        console.warn('Failed to parse EXIF metadata on frontend:', err.message);
      }

      const res = await compressImageFile(file);
      const captureTime = originalCaptureDate || new Date(file.lastModified || Date.now());

      const finalFile = new File([res.file], file.name || 'damage-photo.jpg', {
        type: 'image/jpeg',
        lastModified: captureTime.getTime()
      });

      compressedList.push(finalFile);
      previewList.push(res.previewUrl);
    }

    setDamagePhotos(prev => [...prev, ...compressedList]);
    setDamagePreviews(prev => [...prev, ...previewList]);
    setCompressing(false);

    // Clear input value so selecting files repeatedly triggers onChange
    e.target.value = '';
  };

  const handleSingleImageChange = async (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;

    setCompressing(true);

    // Parse EXIF DateTimeOriginal before compression strips it
    let originalCaptureDate = null;
    try {
      const exif = await exifr.parse(file);
      if (exif && exif.DateTimeOriginal) {
        originalCaptureDate = new Date(exif.DateTimeOriginal);
      }
    } catch (err) {
      console.warn('Failed to parse EXIF metadata on frontend:', err.message);
    }

    const res = await compressImageFile(file);
    const captureTime = originalCaptureDate || new Date(file.lastModified || Date.now());

    const finalFile = new File([res.file], file.name || 'compressed-photo.jpg', {
      type: 'image/jpeg',
      lastModified: captureTime.getTime()
    });

    setFile(finalFile);
    setPreview(res.previewUrl);
    setCompressing(false);

    // Clear input value so selecting files repeatedly triggers onChange
    e.target.value = '';
  };

  // Variance calculator (Unloading End Time vs Vehicle Temp Photo capture)
  const calculateVariance = (endDateTimeStr, captureDate) => {
    try {
      if (!endDateTimeStr || !captureDate) return 0;
      // endDateTimeStr is "DD-MM-YYYY HH:MM"
      const [datePart, timePart] = endDateTimeStr.split(' ');
      const [day, month, year] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);

      const expectedEndDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const diffMs = Math.abs(captureDate.getTime() - expectedEndDate.getTime());
      return Math.round(diffMs / (1000 * 60));
    } catch (e) {
      return 0;
    }
  };

  // Submit Handler: Show Verification Pop-up Modal First
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const required = ['inward_entry_date', 'inward_vehicle_no', 'inward_client_name'];
    const missing = required.filter(f => !formData[f] || !formData[f].toString().trim());

    if (missing.length > 0) {
      alert(`⚠️ Validation Error:\nPlease fill all required fields:\n- ${missing.join('\n- ')}`);
      return;
    }

    if (formData.inward_driver_no) {
      const digits = formData.inward_driver_no.replace(/\D/g, '');
      const expectedDigits = (driverCountryCode === '+91') ? 10 : (['+971', '+966', '+61'].includes(driverCountryCode) ? 9 : (driverCountryCode === '+65' ? 8 : 10));
      if (digits.length < expectedDigits) {
        alert(`⚠️ Invalid Phone Number:\nPlease enter a valid ${expectedDigits}-digit mobile number for country code ${driverCountryCode}.`);
        return;
      }
    }

    let captureDate = new Date();
    let photoDateStr = todayStr;

    // Choose the first available uploaded photo as the inspection reference
    const refPhoto = vehicleTempPhoto || materialTempPhoto || podPhoto || sealPhoto || vehicleBackPhoto || vehicleBackWithMaterialPhoto || countSheetPhoto || invoicePhoto || damagePhotos[0];

    if (refPhoto) {
      captureDate = new Date(refPhoto.lastModified);
    }

    const yyyy = captureDate.getFullYear();
    const mm = String(captureDate.getMonth() + 1).padStart(2, '0');
    const dd = String(captureDate.getDate()).padStart(2, '0');
    const hh = String(captureDate.getHours()).padStart(2, '0');
    const min = String(captureDate.getMinutes()).padStart(2, '0');
    const ss = String(captureDate.getSeconds()).padStart(2, '0');

    photoDateStr = `${dd}-${mm}-${yyyy}`;
    const formattedCapture = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    const photoTimeStr = `${hh}:${min}`;

    const variance = calculateVariance(formData.inward_unloading_end_time, captureDate);

    setVerificationData({
      photo_capture_time_str: formattedCapture,
      photo_date_str: photoDateStr,
      photo_time_str: photoTimeStr,
      time_variance_minutes: variance
    });
  };

  // Confirm Submit to Save in MySQL
  const handleConfirmSubmit = async () => {
    setSubmitting(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'inward_driver_no') {
        const fullPhone = formData.inward_driver_no ? `${driverCountryCode} ${formData.inward_driver_no}` : '';
        submissionData.append('inward_driver_no', fullPhone);
      } else {
        submissionData.append(key, formData[key]);
      }
    });

    if (invoicePhoto) submissionData.append('inward_invoice_photos', invoicePhoto);
    if (podPhoto) submissionData.append('inward_pod_photo', podPhoto);
    if (sealPhoto) submissionData.append('inward_vehicle_seal_photo', sealPhoto);
    if (vehicleTempPhoto) submissionData.append('inward_vehicle_temp_photo', vehicleTempPhoto);
    if (materialTempPhoto) submissionData.append('inward_material_temp_photo', materialTempPhoto);
    if (vehicleBackPhoto) submissionData.append('inward_vehicle_back_side_photo', vehicleBackPhoto);
    if (vehicleBackWithMaterialPhoto) submissionData.append('inward_vehicle_back_side_photo_with_material', vehicleBackWithMaterialPhoto);
    if (countSheetPhoto) submissionData.append('inward_count_sheet_photo', countSheetPhoto);

    damagePhotos.forEach(file => {
      submissionData.append('inward_damage_boxes_photo', file);
    });

    const res = await addInwardLog(submissionData);
    setSubmitting(false);
    setVerificationData(null);

    if (res) {
      setSuccessMsg('Inward temperature saved successfully');
      loadLogs();

      // Reset State
      setDriverCountryCode('+91');
      setFormData({
        inward_entry_date: todayStr,
        inward_vehicle_no: '',
        inward_seal_no: '',
        inward_vehicle_temp: '',
        inward_material_temp: '',
        inward_transporter_name: '',
        inward_driver_name: '',
        inward_driver_no: '',
        inward_client_name: '',
        inward_dock_no: '',
        inward_vehicle_reporting_time: '11:00',
        inward_unloading_start_time: '11:30',
        inward_unloading_duration_hours: '1',
        inward_unloading_duration_mins: '0',
        inward_unloading_end_time: '12:30',
        inward_pallets_in_qty: '',
        inward_invoice_qty: '',
        inward_received_qty: '',
        inward_received_boxes_qty: '',
        inward_short_received_boxes_qty: 0,
        inward_excess_received_boxes_qty: 0,
        inward_damage_received_boxes_qty: '',
        inward_material_type: 'Frozen',
        inward_unloading_supervisor_name: '',
        inward_remarks: ''
      });
      setInvoicePhoto(null);
      setInvoicePreview(null);
      setPodPhoto(null);
      setPodPreview(null);
      setSealPhoto(null);
      setSealPreview(null);
      setVehicleTempPhoto(null);
      setVehicleTempPreview(null);
      setMaterialTempPhoto(null);
      setMaterialTempPreview(null);
      setVehicleBackPhoto(null);
      setVehicleBackPreview(null);
      setVehicleBackWithMaterialPhoto(null);
      setVehicleBackWithMaterialPreview(null);
      setCountSheetPhoto(null);
      setCountSheetPreview(null);
      setDamagePhotos([]);
      setDamagePreviews([]);

      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this Inward record?')) {
      await deleteInwardLog(id);
      loadLogs();
    }
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // 1. Vehicle Number (uppercase and auto hyphen formatting like MP-04-ZD-1990)
    if (name === 'inward_vehicle_no') {
      const raw = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
      let formatted = '';
      if (raw.length <= 2) {
        formatted = raw;
      } else if (raw.length <= 4) {
        formatted = `${raw.slice(0, 2)}-${raw.slice(2)}`;
      } else if (raw.length <= 6) {
        formatted = `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}`;
      } else {
        formatted = `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}`;
      }
      value = formatted;
    }
    // 2. Seal Number (uppercase only)
    else if (name === 'inward_seal_no') {
      value = value.toUpperCase();
    }
    // 3. Phone number (Allow only digits, restrict length dynamically)
    else if (name === 'inward_driver_no') {
      const digits = value.replace(/\D/g, '');
      const maxDigits = (driverCountryCode === '+91') ? 10 : (['+971', '+966', '+61'].includes(driverCountryCode) ? 9 : (driverCountryCode === '+65' ? 8 : 10));
      value = digits.slice(0, maxDigits);
    }
    // 4. Integer fields (Pallets, Boxes, Quantities)
    else if (['inward_pallets_in_qty', 'inward_invoice_qty', 'inward_received_qty', 'inward_damage_received_boxes_qty'].includes(name)) {
      value = value.replace(/\D/g, '');
    }
    // 4b. Duration fields (with 60-mins rollover validation)
    else if (name === 'inward_unloading_duration_hours') {
      value = value.replace(/\D/g, '');
      if (parseInt(value) > 24) value = '24';
    }
    else if (name === 'inward_unloading_duration_mins') {
      value = value.replace(/\D/g, '');
      const minsNum = parseInt(value) || 0;
      if (minsNum >= 60) {
        const extraHours = Math.floor(minsNum / 60);
        const remMins = minsNum % 60;

        setFormData(prev => {
          const currentHours = parseInt(prev.inward_unloading_duration_hours) || 0;
          const newHours = Math.min(currentHours + extraHours, 24);
          return {
            ...prev,
            inward_unloading_duration_hours: newHours.toString(),
            inward_unloading_duration_mins: remMins.toString()
          };
        });
        return;
      }
    }
    // 5. Float/Decimal fields (Temperatures)
    else if (['inward_vehicle_temp', 'inward_material_temp'].includes(name)) {
      // Allow only digits, dot, and minus sign
      let clean = value.replace(/[^\d\.\-]/g, '');
      // Ensure minus sign only at start
      if (clean.includes('-')) {
        const parts = clean.split('-');
        clean = (clean.startsWith('-') ? '-' : '') + parts.join('');
      }
      // Ensure only single dot
      if (clean.includes('.')) {
        const parts = clean.split('.');
        clean = parts[0] + '.' + parts.slice(1).join('');
      }
      value = clean;
    }
    // 6. Text-only Name fields (no numbers or punctuation except dot and dash)
    else if (name.toLowerCase().includes('name')) {
      value = value.replace(/[^a-zA-Z\s\.\-]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="temp-monitor-page inward-monitor-page">
      {/* Header Banner */}
      <div className="do-header-banner">
        <div className="do-header-left">
          <h2>
            <ArrowDownLeft size={26} color="#00a2e8" />
            <span>DO Inward Temperature Monitor</span>
          </h2>
          <p>
            Verify and record vehicle arrivals, pallet counts, cargo temperature checks, and multiple invoice documents.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner-inward">
          <CheckCircle size={20} color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Single Card Form exactly like DO Daily Temp Monitor */}
      <div className="inward-form-card direct-form-card">
        <div className="direct-form-header">
          <h3>
            <PlusCircle size={18} color="#00a2e8" />
            <span>Add New Inward Record</span>
          </h3>
        </div>

        <form className="inward-entry-form" onSubmit={handleFormSubmit}>
          <div className="form-cards-grid">

            {/* Section 1: Basic Inward Info */}
            <div className="form-section-box">
              <h5 className="section-box-title">
                <Calendar size={15} /> 1. Basic Inward Info
              </h5>
              <div className="inward-form-grid">
                <div className="inward-form-group">
                  <label>Entry Date *</label>
                  <input
                    type="date"
                    name="inward_entry_date"
                    value={formData.inward_entry_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="inward-form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    name="inward_client_name"
                    value={formData.inward_client_name}
                    onChange={handleInputChange}
                    placeholder="e.g. ColdStore Logistics"
                    required
                  />
                </div>

                <div className="inward-form-group">
                  <label>Dock No.</label>
                  <input
                    type="text"
                    name="inward_dock_no"
                    value={formData.inward_dock_no}
                    onChange={handleInputChange}
                    placeholder="e.g. Dock-1"
                  />
                </div>

                <div className="inward-form-group">
                  <label>Material Type</label>
                  {isMaterialCustom ? (
                    <div className="input-with-reset">
                      <input
                        type="text"
                        name="inward_material_type"
                        value={formData.inward_material_type}
                        onChange={handleInputChange}
                        placeholder="Enter Material Type"
                      />
                      <button type="button" className="field-reset-btn" onClick={() => { setIsMaterialCustom(false); setFormData(p => ({ ...p, inward_material_type: 'Frozen' })); }}>Select</button>
                    </div>
                  ) : (
                    <select
                      name="inward_material_type"
                      value={formData.inward_material_type}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          setIsMaterialCustom(true);
                          setFormData(p => ({ ...p, inward_material_type: '' }));
                        } else {
                          handleInputChange(e);
                        }
                      }}
                    >
                      <option value="Frozen">Frozen</option>
                      <option value="dry">dry</option>
                      <option value="chiller">chiller</option>
                      <option value="other">other</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Vehicle & Transporter */}
            <div className="form-section-box">
              <h5 className="section-box-title">
                <Truck size={15} /> 2. Vehicle & Transporter
              </h5>
              <div className="inward-form-grid">
                <div className="inward-form-group">
                  <label>Vehicle No. *</label>
                  <input
                    type="text"
                    name="inward_vehicle_no"
                    value={formData.inward_vehicle_no}
                    onChange={handleInputChange}
                    placeholder="e.g. MH-12-QW-1234"
                    required
                  />
                </div>

                <div className="inward-form-group">
                  <label>Seal No.</label>
                  <input
                    type="text"
                    name="inward_seal_no"
                    value={formData.inward_seal_no}
                    onChange={handleInputChange}
                    placeholder="e.g. SL-998822"
                  />
                </div>

                <div className="inward-form-group">
                  <label>Transporter Name</label>
                  <input
                    type="text"
                    name="inward_transporter_name"
                    value={formData.inward_transporter_name}
                    onChange={handleInputChange}
                    placeholder="e.g. BlueDart Express"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Driver & Timing Info */}
            <div className="form-section-box">
              <h5 className="section-box-title">
                <FileText size={15} /> 3. Driver & Timing Info
              </h5>
              <div className="inward-form-grid">
                <div className="inward-form-group">
                  <label>Driver Name</label>
                  <input
                    type="text"
                    name="inward_driver_name"
                    value={formData.inward_driver_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rajesh kumar"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Driver Phone No.</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={driverCountryCode}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        setDriverCountryCode(newCode);
                        const maxDigits = (newCode === '+91') ? 10 : (['+971', '+966', '+61'].includes(newCode) ? 9 : (newCode === '+65' ? 8 : 10));
                        setFormData(prev => ({
                          ...prev,
                          inward_driver_no: (prev.inward_driver_no || '').replace(/\D/g, '').slice(0, maxDigits)
                        }));
                      }}
                      style={{ width: '90px', padding: '8px 4px', fontSize: '0.85rem', border: '1px solid #ccc', borderRadius: '4px', background: 'var(--surface)' }}
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+966">+966 (SA)</option>
                      <option value="+65">+65 (SG)</option>
                      <option value="+61">+61 (AU)</option>
                      <option value="+92">+92 (PK)</option>
                      <option value="+880">+880 (BD)</option>
                      <option value="+977">+977 (NP)</option>
                    </select>
                    <input
                      type="text"
                      name="inward_driver_no"
                      value={formData.inward_driver_no}
                      onChange={handleInputChange}
                      placeholder="98765 43210"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className="inward-form-group">
                  <label>Vehicle Reporting Time</label>
                  <input
                    type="time"
                    name="inward_vehicle_reporting_time"
                    value={formData.inward_vehicle_reporting_time}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="inward-form-group">
                  <label>Unloading Start Time</label>
                  <input
                    type="time"
                    name="inward_unloading_start_time"
                    value={formData.inward_unloading_start_time}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="inward-form-group">
                  <label>Unloading Duration</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="inward_unloading_duration_hours"
                      value={formData.inward_unloading_duration_hours}
                      onChange={handleInputChange}
                      placeholder="Hrs"
                      style={{ flex: 1, minWidth: 0, padding: '8px 6px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>hrs</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="inward_unloading_duration_mins"
                      value={formData.inward_unloading_duration_mins}
                      onChange={handleInputChange}
                      placeholder="Mins"
                      style={{ flex: 1, minWidth: 0, padding: '8px 6px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>mins</span>
                  </div>
                </div>
                <div className="inward-form-group">
                  <label>Unloading End Time (Auto)</label>
                  <input
                    type="text"
                    name="inward_unloading_end_time"
                    value={formData.inward_unloading_end_time}
                    readOnly
                    className="readonly-field"
                    style={{ background: 'var(--surface-overlay, #f5f5f5)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Temperature Checks */}
            <div className="form-section-box">
              <h5 className="section-box-title">
                <Thermometer size={15} /> 4. Temperature Checks
              </h5>
              <div className="inward-form-grid">
                <div className="inward-form-group">
                  <label>Inward Vehicle Temp. (°C)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="inward_vehicle_temp"
                    value={formData.inward_vehicle_temp}
                    onChange={handleInputChange}
                    placeholder="-18.5"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Inward Material Temp. (°C)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="inward_material_temp"
                    value={formData.inward_material_temp}
                    onChange={handleInputChange}
                    placeholder="-20.2"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Pallets & Boxes Quantity Audit */}
            <div className="form-section-box">
              <h5 className="section-box-title">
                <CheckCircle size={15} /> 5. Pallets & Boxes Quantity Audit
              </h5>
              <div className="inward-form-grid">
                <div className="inward-form-group">
                  <label>Pallets In Qty</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="inward_pallets_in_qty"
                    value={formData.inward_pallets_in_qty}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Invoice Boxes Qty</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="inward_invoice_qty"
                    value={formData.inward_invoice_qty}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Actual Received Qty</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="inward_received_qty"
                    value={formData.inward_received_qty}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Damage Qty</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="inward_damage_received_boxes_qty"
                    value={formData.inward_damage_received_boxes_qty}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Short Qty (Auto)</label>
                  <input
                    type="text"
                    name="inward_short_received_boxes_qty"
                    value={formData.inward_short_received_boxes_qty}
                    readOnly
                    className="readonly-field short"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Excess Qty (Auto)</label>
                  <input
                    type="text"
                    name="inward_excess_received_boxes_qty"
                    value={formData.inward_excess_received_boxes_qty}
                    readOnly
                    className="readonly-field excess"
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Remarks & Supervisor */}
            <div className="form-section-box">
              <h5 className="section-box-title">
                <FileText size={15} /> 6. Remarks & Supervisor Details
              </h5>
              <div className="inward-form-grid">
                <div className="inward-form-group">
                  <label>Unloading Supervisor Name</label>
                  <input
                    type="text"
                    name="inward_unloading_supervisor_name"
                    value={formData.inward_unloading_supervisor_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Sandeep V."
                  />
                </div>
                <div className="inward-form-group span-3">
                  <label>Remarks</label>
                  <textarea
                    name="inward_remarks"
                    value={formData.inward_remarks}
                    onChange={handleInputChange}
                    placeholder="Write inward monitoring notes..."
                    rows="2"
                  />
                </div>
              </div>
            </div>

            {/* Section 7: Inspection Photos Uploads */}
            <div className="form-section-box">
              <h5 className="section-box-title">
                <Camera size={15} /> 7. Inspection Photos Upload
              </h5>
              <div className="inward-form-grid">

                {/* Invoice Photo */}
                <div className="inward-form-group file-field">
                  <label>Invoice Photo</label>
                  {!invoicePreview ? (
                    <div className="image-uploader-btn">
                      <Camera size={18} />
                      <span>Choose Invoice Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleImageChange(e, setInvoicePhoto, setInvoicePreview)}
                      />
                    </div>
                  ) : (
                    <div className="sensor-photo-verified-card">
                      <div className="verified-thumb-wrapper">
                        <img src={invoicePreview} alt="Invoice Verified" />
                        <div className="verified-check-badge">
                          <Check size={8} />
                        </div>
                      </div>
                      <div className="verified-action-group">
                        <button
                          type="button"
                          className="retake-icon-btn"
                          onClick={() => { setInvoicePhoto(null); setInvoicePreview(null); }}
                          title="Retake Photo"
                        >
                          <RefreshCw size={12} />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          className="delete-photo-btn"
                          onClick={() => { setInvoicePhoto(null); setInvoicePreview(null); }}
                          title="Remove Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* POD Upload */}
                <div className="inward-form-group file-field">
                  <label>POD Photo</label>
                  {!podPreview ? (
                    <div className="image-uploader-btn">
                      <Camera size={18} />
                      <span>Choose POD Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleImageChange(e, setPodPhoto, setPodPreview)}
                      />
                    </div>
                  ) : (
                    <div className="sensor-photo-verified-card">
                      <div className="verified-thumb-wrapper">
                        <img src={podPreview} alt="POD Verified" />
                        <div className="verified-check-badge">
                          <Check size={8} />
                        </div>
                      </div>
                      <div className="verified-action-group">
                        <button
                          type="button"
                          className="retake-icon-btn"
                          onClick={() => { setPodPhoto(null); setPodPreview(null); }}
                          title="Retake Photo"
                        >
                          <RefreshCw size={12} />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          className="delete-photo-btn"
                          onClick={() => { setPodPhoto(null); setPodPreview(null); }}
                          title="Remove Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Seal Upload */}
                <div className="inward-form-group file-field">
                  <label>Vehicle Seal Photo</label>
                  {!sealPreview ? (
                    <div className="image-uploader-btn">
                      <Camera size={18} />
                      <span>Choose Seal Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleImageChange(e, setSealPhoto, setSealPreview)}
                      />
                    </div>
                  ) : (
                    <div className="sensor-photo-verified-card">
                      <div className="verified-thumb-wrapper">
                        <img src={sealPreview} alt="Seal Verified" />
                        <div className="verified-check-badge">
                          <Check size={8} />
                        </div>
                      </div>
                      <div className="verified-action-group">
                        <button
                          type="button"
                          className="retake-icon-btn"
                          onClick={() => { setSealPhoto(null); setSealPreview(null); }}
                          title="Retake Photo"
                        >
                          <RefreshCw size={12} />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          className="delete-photo-btn"
                          onClick={() => { setSealPhoto(null); setSealPreview(null); }}
                          title="Remove Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Back Side Upload */}
                <div className="inward-form-group file-field">
                  <label>Vehicle Back Side Photo</label>
                  {!vehicleBackPreview ? (
                    <div className="image-uploader-btn">
                      <Camera size={18} />
                      <span>Choose Back Side Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleImageChange(e, setVehicleBackPhoto, setVehicleBackPreview)}
                      />
                    </div>
                  ) : (
                    <div className="sensor-photo-verified-card">
                      <div className="verified-thumb-wrapper">
                        <img src={vehicleBackPreview} alt="Back Side Verified" />
                        <div className="verified-check-badge">
                          <Check size={8} />
                        </div>
                      </div>
                      <div className="verified-action-group">
                        <button
                          type="button"
                          className="retake-icon-btn"
                          onClick={() => { setVehicleBackPhoto(null); setVehicleBackPreview(null); }}
                          title="Retake Photo"
                        >
                          <RefreshCw size={12} />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          className="delete-photo-btn"
                          onClick={() => { setVehicleBackPhoto(null); setVehicleBackPreview(null); }}
                          title="Remove Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Back Side with Material Upload */}
                <div className="inward-form-group file-field">
                  <label>Vehicle Back Side Photo with Material</label>
                  {!vehicleBackWithMaterialPreview ? (
                    <div className="image-uploader-btn">
                      <Camera size={18} />
                      <span>Choose Back Side Photo with Material</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleImageChange(e, setVehicleBackWithMaterialPhoto, setVehicleBackWithMaterialPreview)}
                      />
                    </div>
                  ) : (
                    <div className="sensor-photo-verified-card">
                      <div className="verified-thumb-wrapper">
                        <img src={vehicleBackWithMaterialPreview} alt="Back Side with Material Verified" />
                        <div className="verified-check-badge">
                          <Check size={8} />
                        </div>
                      </div>
                      <div className="verified-action-group">
                        <button
                          type="button"
                          className="retake-icon-btn"
                          onClick={() => { setVehicleBackWithMaterialPhoto(null); setVehicleBackWithMaterialPreview(null); }}
                          title="Retake Photo"
                        >
                          <RefreshCw size={12} />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          className="delete-photo-btn"
                          onClick={() => { setVehicleBackWithMaterialPhoto(null); setVehicleBackWithMaterialPreview(null); }}
                          title="Remove Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Temp Upload */}
                <div className="inward-form-group file-field">
                  <label>Inward Vehicle Temp Photo</label>
                  {!vehicleTempPreview ? (
                    <div className="image-uploader-btn">
                      <Camera size={18} />
                      <span>Choose Inward Vehicle Temp Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleImageChange(e, setVehicleTempPhoto, setVehicleTempPreview)}
                      />
                    </div>
                  ) : (
                    <div className="sensor-photo-verified-card">
                      <div className="verified-thumb-wrapper">
                        <img src={vehicleTempPreview} alt="Vehicle Temp Verified" />
                        <div className="verified-check-badge">
                          <Check size={8} />
                        </div>
                      </div>
                      <div className="verified-action-group">
                        <button
                          type="button"
                          className="retake-icon-btn"
                          onClick={() => { setVehicleTempPhoto(null); setVehicleTempPreview(null); }}
                          title="Retake Photo"
                        >
                          <RefreshCw size={12} />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          className="delete-photo-btn"
                          onClick={() => { setVehicleTempPhoto(null); setVehicleTempPreview(null); }}
                          title="Remove Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Material Temp Upload */}
                <div className="inward-form-group file-field">
                  <label>Inward Material Temp Photo</label>
                  {!materialTempPreview ? (
                    <div className="image-uploader-btn">
                      <Camera size={18} />
                      <span>Choose Inward Material Temp Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleImageChange(e, setMaterialTempPhoto, setMaterialTempPreview)}
                      />
                    </div>
                  ) : (
                    <div className="sensor-photo-verified-card">
                      <div className="verified-thumb-wrapper">
                        <img src={materialTempPreview} alt="Material Temp Verified" />
                        <div className="verified-check-badge">
                          <Check size={8} />
                        </div>
                      </div>
                      <div className="verified-action-group">
                        <button
                          type="button"
                          className="retake-icon-btn"
                          onClick={() => { setMaterialTempPhoto(null); setMaterialTempPreview(null); }}
                          title="Retake Photo"
                        >
                          <RefreshCw size={12} />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          className="delete-photo-btn"
                          onClick={() => { setMaterialTempPhoto(null); setMaterialTempPreview(null); }}
                          title="Remove Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Inward Count Sheet Photo Upload */}
                <div className="inward-form-group file-field">
                  <label>Inward Count Sheet Photo</label>
                  {!countSheetPreview ? (
                    <div className="image-uploader-btn">
                      <Camera size={18} />
                      <span>Choose Inward Count Sheet Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSingleImageChange(e, setCountSheetPhoto, setCountSheetPreview)}
                      />
                    </div>
                  ) : (
                    <div className="sensor-photo-verified-card">
                      <div className="verified-thumb-wrapper">
                        <img src={countSheetPreview} alt="Count Sheet Verified" />
                        <div className="verified-check-badge">
                          <Check size={8} />
                        </div>
                      </div>
                      <div className="verified-action-group">
                        <button
                          type="button"
                          className="retake-icon-btn"
                          onClick={() => { setCountSheetPhoto(null); setCountSheetPreview(null); }}
                          title="Retake Photo"
                        >
                          <RefreshCw size={12} />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          className="delete-photo-btn"
                          onClick={() => { setCountSheetPhoto(null); setCountSheetPreview(null); }}
                          title="Remove Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Damage Boxes Photo */}
                <div className="inward-form-group file-field">
                  <label>Damage Boxes Photos (Multiple allowed)</label>
                  <div
                    className={`image-uploader-btn ${((parseInt(formData.inward_damage_received_boxes_qty) || 0) <= 0) ? 'disabled' : ''}`}
                    style={((parseInt(formData.inward_damage_received_boxes_qty) || 0) <= 0) ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                  >
                    <Camera size={18} />
                    <span>Choose Damage Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleDamageChange}
                      disabled={((parseInt(formData.inward_damage_received_boxes_qty) || 0) <= 0)}
                    />
                  </div>
                  {damagePreviews.length > 0 && (
                    <div className="preview-thumbnails">
                      {damagePreviews.map((url, idx) => (
                        <div key={idx} className="thumb-container">
                          <img src={url} alt={`Damage ${idx}`} className="mini-thumb" />
                          <button
                            type="button"
                            className="thumb-remove"
                            onClick={() => {
                              setDamagePhotos(p => p.filter((_, i) => i !== idx));
                              setDamagePreviews(p => p.filter((_, i) => i !== idx));
                            }}
                            title="Remove Photo"
                          >
                            ×
                          </button>
                          <div className="thumb-verified-check">
                            <Check size={6} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* Form Action Submit */}
          <div className="submit-section-inward">
            <button type="submit" className="submit-inward-btn" disabled={submitting || compressing}>
              {submitting ? <Loader2 size={18} className="spinner-icon" /> : <Plus size={18} />}
              <span>{submitting ? 'Saving...' : 'Add Inward Record'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Daily Logs History */}
      <div className="direct-form-card inward-history-card">
        <div className="direct-form-header">
          <h3>
            <ArrowDownLeft size={18} color="#00a2e8" />
            <span>Today's Inward Log History</span>
          </h3>
        </div>

        {(() => {
          const todayLogs = logs.filter(log => {
            const logDate = log.inward_entry_date ? log.inward_entry_date.split('T')[0] : '';
            return logDate === todayStr;
          });

          if (loadingLogs) {
            return (
              <div className="loading-logs">
                <Loader2 size={24} className="spinner-icon" color="#00a2e8" />
                <span>Loading inward logs...</span>
              </div>
            );
          }

          if (todayLogs.length === 0) {
            return (
              <div className="no-logs">
                <p>No Inward temperature inspection logs found for today.</p>
              </div>
            );
          }

          return (
            <div className="table-responsive">
              <table className="logs-table inward-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle No</th>
                    <th className="wrap-text">Client</th>
                    <th>Inward Vehicle Temp</th>
                    <th>Inward Material Temp</th>
                    <th>Pallets</th>
                    <th>Unloading Start / End</th>
                    <th className="wrap-text">Supervisor</th>
                    <th>Invoice Photo</th>
                    <th>POD</th>
                    <th>Seal Photo</th>
                    <th>Vehicle Back Side</th>
                    <th>Vehicle Back Side with Material</th>
                    <th>Count Sheet</th>
                    <th>Damage Photos</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLogs.map((log) => {
                    const serverUrl = window.location.origin === 'http://localhost:3000' ? 'http://localhost:5000' : '';
                    const podImg = log.inward_pod_photo ? `${serverUrl}/${log.inward_pod_photo}` : null;
                    const sealImg = log.inward_vehicle_seal_photo ? `${serverUrl}/${log.inward_vehicle_seal_photo}` : null;
                    const backSideImg = log.inward_vehicle_back_side_photo ? `${serverUrl}/${log.inward_vehicle_back_side_photo}` : null;
                    const backSideWithMaterialImg = log.inward_vehicle_back_side_photo_with_material ? `${serverUrl}/${log.inward_vehicle_back_side_photo_with_material}` : null;
                    const countSheetImg = log.inward_count_sheet_photo ? `${serverUrl}/${log.inward_count_sheet_photo}` : null;

                    return (
                      <tr key={log.inward_id}>
                        <td>{log.inward_entry_date}</td>
                        <td><strong>{log.inward_vehicle_no}</strong></td>
                        <td className="wrap-text">{log.inward_client_name}</td>
                        <td className="temp-cell">{log.inward_vehicle_temp !== null ? `${log.inward_vehicle_temp}°C` : '-'}</td>
                        <td className="temp-cell">{log.inward_material_temp !== null ? `${log.inward_material_temp}°C` : '-'}</td>
                        <td>{log.inward_pallets_in_qty}</td>
                        <td>
                          <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            <div>S: {log.inward_unloading_start_time || '-'}</div>
                            <div>E: {log.inward_unloading_end_time || '-'}</div>
                          </div>
                        </td>
                        <td className="wrap-text">{log.inward_unloading_supervisor_name || '-'}</td>
                        <td>
                          {log.inward_invoice_photos ? (
                            <img
                              src={`${serverUrl}/${log.inward_invoice_photos}`}
                              alt="Invoice"
                              className="table-photo-thumb"
                              onClick={() => setLightboxImage(`${serverUrl}/${log.inward_invoice_photos}`)}
                            />
                          ) : '-'}
                        </td>
                        <td>
                          {podImg ? (
                            <img src={podImg} alt="POD" className="table-photo-thumb" onClick={() => setLightboxImage(podImg)} />
                          ) : '-'}
                        </td>
                        <td>
                          {sealImg ? (
                            <img src={sealImg} alt="Seal" className="table-photo-thumb" onClick={() => setLightboxImage(sealImg)} />
                          ) : '-'}
                        </td>
                        <td>
                          {backSideImg ? (
                            <img src={backSideImg} alt="Vehicle Back Side" className="table-photo-thumb" onClick={() => setLightboxImage(backSideImg)} />
                          ) : '-'}
                        </td>
                        <td>
                          {backSideWithMaterialImg ? (
                            <img src={backSideWithMaterialImg} alt="Vehicle Back Side with Material" className="table-photo-thumb" onClick={() => setLightboxImage(backSideWithMaterialImg)} />
                          ) : '-'}
                        </td>
                        <td>
                          {countSheetImg ? (
                            <img src={countSheetImg} alt="Count Sheet" className="table-photo-thumb" onClick={() => setLightboxImage(countSheetImg)} />
                          ) : '-'}
                        </td>
                        <td>
                          {log.inward_damage_boxes_photo ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '100px' }}>
                              {log.inward_damage_boxes_photo.split(',').map((p, idx) => {
                                const imgUrl = `${serverUrl}/${p}`;
                                return (
                                  <img
                                    key={idx}
                                    src={imgUrl}
                                    alt="Damage"
                                    className="table-photo-thumb"
                                    onClick={() => setLightboxImage(imgUrl)}
                                  />
                                );
                              })}
                            </div>
                          ) : '-'}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteRecord(log.inward_id)}
                            className="delete-log-action-btn"
                            title="Delete Inward Record"
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
            <img src={lightboxImage} alt="Full Size" />
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
                <span>Verify Inward Time Audit</span>
              </h3>
            </div>

            <div className="verification-content-wrapper-modal">
              <div className="verify-time-comparison-box">
                <h4>Inward Punctuality Audit</h4>

                <div className="comparison-row">
                  <div className="comp-item">
                    <span className="comp-label">Calculated End Time</span>
                    <div className="comp-val-dt">
                      <span className="comp-date">{formData.inward_unloading_end_time.split(' ')[0]}</span>
                      <span className="comp-time">{formData.inward_unloading_end_time.split(' ')[1]}</span>
                    </div>
                  </div>
                  <div className="comp-divider">⚡</div>
                  <div className="comp-item">
                    <span className="comp-label">Inspection Photo Time</span>
                    <div className="comp-val-dt">
                      <span className="comp-date">{verificationData.photo_date_str}</span>
                      <span className="comp-time">{verificationData.photo_time_str}</span>
                    </div>
                  </div>
                </div>

                <div className="variance-audit-result">
                  <span>Variance Detected:</span>
                  <strong className={`variance-pill ${verificationData.time_variance_minutes > 120 ? 'variance-red' : 'variance-green'
                    }`}>
                    {verificationData.time_variance_minutes} minutes
                  </strong>
                </div>

                {verificationData.time_variance_minutes <= 120 ? (
                  <div className="variance-success-banner">
                    ✅ Audit Verified: Inspection photos recorded within the expected unloading window.
                  </div>
                ) : (
                  <div className="variance-alert-banner">
                    ⚠️ Audit Alert: Inspection photos recorded outside the expected unloading window.
                  </div>
                )}

                {/* Show Date Discrepancy Alert */}
                {verificationData.photo_date_str !== formData.inward_unloading_end_time.split(' ')[0] && (
                  <div className="variance-alert-banner" style={{ marginTop: '8px', border: '1.5px solid #ef4444', color: '#b91c1c', backgroundColor: '#fef2f2' }}>
                    ⚠️ Date Alert: Inspection Photo captured on {verificationData.photo_date_str}, but unloading end date is calculated as {formData.inward_unloading_end_time.split(' ')[0]}!
                  </div>
                )}
              </div>
            </div>

            <div className="verification-actions">
              <button
                type="button"
                className="cancel-verify-btn"
                onClick={() => setVerificationData(null)}
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
                <span>Confirm & Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
