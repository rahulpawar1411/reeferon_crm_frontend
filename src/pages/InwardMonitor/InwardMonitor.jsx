// ====================================================================
// DO Inward Temp Monitor Component (src/pages/InwardMonitor/InwardMonitor.jsx)
// Paired with: src/pages/InwardMonitor/InwardMonitor.css
// Handles comprehensive Inward vehicle inspections in a single card with rounded boxes.
// ====================================================================

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowDownLeft, Plus, CheckCircle, PlusCircle, Camera, Loader2, Trash2, Calendar, FileText, Truck, Thermometer
} from 'lucide-react';
import { addInwardLog, fetchInwardLogs, deleteInwardLog } from '../../services/api';
import exifr from 'exifr';
import './InwardMonitor.css';

export default function InwardMonitor() {
  const todayStr = new Date().toISOString().split('T')[0];
  const fileInputRef = useRef({});

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    entry_date: todayStr,
    vehicle_no: '',
    seal_no: '',
    vehicle_temp: '',
    material_temp: '',
    transporter_name: '',
    driver_name: '',
    driver_no: '',
    client_name: '',
    dock_no: '',
    vehicle_reporting_time: '11:00',
    unloading_start_time: '11:30',
    unloading_end_time: '12:30',
    pallets_in_qty: '',
    invoice_qty: '',
    received_qty: '',
    received_boxes_qty: '',
    short_received_boxes_qty: 0,
    excess_received_boxes_qty: 0,
    damage_received_boxes_qty: '',
    material_type: 'Frozen',
    unloading_supervisor_name: '',
    remarks: ''
  });

  // Custom text triggers for dropdown inputs
  const [isMaterialCustom, setIsMaterialCustom] = useState(false);

  // Uploaded Files State
  const [invoicePhotos, setInvoicePhotos] = useState([]);
  const [invoicePreviews, setInvoicePreviews] = useState([]);
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
  const [damagePhoto, setDamagePhoto] = useState(null);
  const [damagePreview, setDamagePreview] = useState(null);

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
    const inv = parseInt(formData.invoice_qty) || 0;
    const rec = parseInt(formData.received_qty) || 0;
    
    setFormData(prev => ({
      ...prev,
      short_received_boxes_qty: inv > rec ? inv - rec : 0,
      excess_received_boxes_qty: rec > inv ? rec - inv : 0
    }));
  }, [formData.invoice_qty, formData.received_qty]);

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
  const handleMultipleInvoicesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setCompressing(true);
    const compressedList = [];
    const previewList = [];

    for (let file of files) {
      const res = await compressImageFile(file);
      compressedList.push(res.file);
      previewList.push(res.previewUrl);
    }

    setInvoicePhotos(prev => [...prev, ...compressedList]);
    setInvoicePreviews(prev => [...prev, ...previewList]);
    setCompressing(false);
  };

  const handleSingleImageChange = async (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;

    setCompressing(true);
    const res = await compressImageFile(file);
    setFile(res.file);
    setPreview(res.previewUrl);
    setCompressing(false);
  };

  // Variance calculator (Reporting Time vs Vehicle Temp Photo capture)
  const calculateVariance = (entryDateStr, inspectionTimeStr, captureDate) => {
    try {
      if (!entryDateStr || !inspectionTimeStr || !captureDate) return 0;
      const [hours, minutes] = inspectionTimeStr.split(':').map(Number);
      const [year, month, day] = entryDateStr.split('-').map(Number);
      
      const inspectionDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const diffMs = Math.abs(captureDate.getTime() - inspectionDate.getTime());
      return Math.round(diffMs / (1000 * 60));
    } catch (e) {
      return 0;
    }
  };

  // Submit Handler: Show Verification Pop-up Modal First
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const required = ['entry_date', 'vehicle_no', 'client_name'];
    const missing = required.filter(f => !formData[f] || !formData[f].toString().trim());

    if (missing.length > 0) {
      alert(`⚠️ Validation Error:\nPlease fill all required fields:\n- ${missing.join('\n- ')}`);
      return;
    }

    let captureDate = new Date();
    let photoDateStr = todayStr;
    
    if (vehicleTempPhoto) {
      try {
        const exif = await exifr.parse(vehicleTempPhoto);
        if (exif && exif.DateTimeOriginal) {
          captureDate = new Date(exif.DateTimeOriginal);
        } else {
          captureDate = new Date(vehicleTempPhoto.lastModified);
        }
      } catch (err) {
        captureDate = new Date(vehicleTempPhoto.lastModified);
      }
    }

    const yyyy = captureDate.getFullYear();
    const mm = String(captureDate.getMonth() + 1).padStart(2, '0');
    const dd = String(captureDate.getDate()).padStart(2, '0');
    const hh = String(captureDate.getHours()).padStart(2, '0');
    const min = String(captureDate.getMinutes()).padStart(2, '0');
    const ss = String(captureDate.getSeconds()).padStart(2, '0');
    
    photoDateStr = `${yyyy}-${mm}-${dd}`;
    const formattedCapture = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

    const variance = calculateVariance(formData.entry_date, formData.vehicle_reporting_time, captureDate);

    setVerificationData({
      photo_capture_time_str: formattedCapture,
      photo_date_str: photoDateStr,
      time_variance_minutes: variance
    });
  };

  // Confirm Submit to Save in MySQL
  const handleConfirmSubmit = async () => {
    setSubmitting(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      submissionData.append(key, formData[key]);
    });

    invoicePhotos.forEach(file => {
      submissionData.append('invoice_photos', file);
    });

    if (podPhoto) submissionData.append('pod_photo', podPhoto);
    if (sealPhoto) submissionData.append('vehicle_seal_photo', sealPhoto);
    if (vehicleTempPhoto) submissionData.append('vehicle_temp_photo', vehicleTempPhoto);
    if (materialTempPhoto) submissionData.append('material_temp_photo', materialTempPhoto);
    if (vehicleBackPhoto) submissionData.append('vehicle_back_side_photo', vehicleBackPhoto);
    if (damagePhoto) submissionData.append('damage_boxes_photo', damagePhoto);

    const res = await addInwardLog(submissionData);
    setSubmitting(false);
    setVerificationData(null);

    if (res) {
      setSuccessMsg('Inward temperature saved successfully');
      loadLogs();
      
      // Reset State
      setFormData({
        entry_date: todayStr,
        vehicle_no: '',
        seal_no: '',
        vehicle_temp: '',
        material_temp: '',
        transporter_name: '',
        driver_name: '',
        driver_no: '',
        client_name: '',
        dock_no: '',
        vehicle_reporting_time: '11:00',
        unloading_start_time: '11:30',
        unloading_end_time: '12:30',
        pallets_in_qty: '',
        invoice_qty: '',
        received_qty: '',
        received_boxes_qty: '',
        short_received_boxes_qty: 0,
        excess_received_boxes_qty: 0,
        damage_received_boxes_qty: '',
        material_type: 'Frozen',
        unloading_supervisor_name: '',
        remarks: ''
      });
      setInvoicePhotos([]);
      setInvoicePreviews([]);
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
      setDamagePhoto(null);
      setDamagePreview(null);

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
    const { name, value } = e.target;
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
                    name="entry_date"
                    value={formData.entry_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="inward-form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleInputChange}
                    placeholder="e.g. ColdStore Logistics"
                    required
                  />
                </div>

                <div className="inward-form-group">
                  <label>Dock No.</label>
                  <input
                    type="text"
                    name="dock_no"
                    value={formData.dock_no}
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
                        name="material_type"
                        value={formData.material_type}
                        onChange={handleInputChange}
                        placeholder="Enter Material Type"
                      />
                      <button type="button" className="field-reset-btn" onClick={() => { setIsMaterialCustom(false); setFormData(p => ({ ...p, material_type: 'Frozen' })); }}>Select</button>
                    </div>
                  ) : (
                    <select
                      name="material_type"
                      value={formData.material_type}
                      onChange={(e) => {
                        if (e.target.value === 'OTHER_CUSTOM') {
                          setIsMaterialCustom(true);
                          setFormData(p => ({ ...p, material_type: '' }));
                        } else {
                          handleInputChange(e);
                        }
                      }}
                    >
                      <option value="Frozen">Frozen (Below -18°C)</option>
                      <option value="Chilled">Chilled (2°C to 8°C)</option>
                      <option value="Ambient">Ambient (Dry Cargo)</option>
                      <option value="OTHER_CUSTOM">++ Add Custom Type ++</option>
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
                    name="vehicle_no"
                    value={formData.vehicle_no}
                    onChange={handleInputChange}
                    placeholder="e.g. MH-12-QW-1234"
                    required
                  />
                </div>

                <div className="inward-form-group">
                  <label>Seal No.</label>
                  <input
                    type="text"
                    name="seal_no"
                    value={formData.seal_no}
                    onChange={handleInputChange}
                    placeholder="e.g. SL-998822"
                  />
                </div>

                <div className="inward-form-group">
                  <label>Transporter Name</label>
                  <input
                    type="text"
                    name="transporter_name"
                    value={formData.transporter_name}
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
                    name="driver_name"
                    value={formData.driver_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Driver Phone No.</label>
                  <input
                    type="text"
                    name="driver_no"
                    value={formData.driver_no}
                    onChange={handleInputChange}
                    placeholder="10-digit number"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Vehicle Reporting Time</label>
                  <input
                    type="time"
                    name="vehicle_reporting_time"
                    value={formData.vehicle_reporting_time}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="inward-form-group">
                  <label>Unloading Start Time</label>
                  <input
                    type="time"
                    name="unloading_start_time"
                    value={formData.unloading_start_time}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="inward-form-group">
                  <label>Unloading End Time</label>
                  <input
                    type="time"
                    name="unloading_end_time"
                    value={formData.unloading_end_time}
                    onChange={handleInputChange}
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
                  <label>Vehicle Temp. (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="vehicle_temp"
                    value={formData.vehicle_temp}
                    onChange={handleInputChange}
                    placeholder="-18.5"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Material Temp. (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="material_temp"
                    value={formData.material_temp}
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
                    type="number"
                    name="pallets_in_qty"
                    value={formData.pallets_in_qty}
                    onChange={handleInputChange}
                    placeholder="12"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Invoice Boxes Qty</label>
                  <input
                    type="number"
                    name="invoice_qty"
                    value={formData.invoice_qty}
                    onChange={handleInputChange}
                    placeholder="350"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Actual Received Qty</label>
                  <input
                    type="number"
                    name="received_qty"
                    value={formData.received_qty}
                    onChange={handleInputChange}
                    placeholder="348"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Damage Qty</label>
                  <input
                    type="number"
                    name="damage_received_boxes_qty"
                    value={formData.damage_received_boxes_qty}
                    onChange={handleInputChange}
                    placeholder="2"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Short Qty (Auto)</label>
                  <input
                    type="number"
                    name="short_received_boxes_qty"
                    value={formData.short_received_boxes_qty}
                    readOnly
                    className="readonly-field short"
                  />
                </div>
                <div className="inward-form-group">
                  <label>Excess Qty (Auto)</label>
                  <input
                    type="number"
                    name="excess_received_boxes_qty"
                    value={formData.excess_received_boxes_qty}
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
                    name="unloading_supervisor_name"
                    value={formData.unloading_supervisor_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Sandeep V."
                  />
                </div>
                <div className="inward-form-group span-3">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
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
                
                {/* Multiple Invoice Upload */}
                <div className="inward-form-group file-field">
                  <label>Invoice Photos (Multiple allowed)</label>
                  <div className="image-uploader-btn">
                    <Camera size={18} />
                    <span>Choose Invoice Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleInvoicesChange}
                    />
                  </div>
                  {invoicePreviews.length > 0 && (
                    <div className="preview-thumbnails">
                      {invoicePreviews.map((url, idx) => (
                        <div key={idx} className="thumb-container">
                          <img src={url} alt="Invoice preview" className="mini-thumb" />
                          <button type="button" className="thumb-remove" onClick={() => {
                            setInvoicePhotos(p => p.filter((_, i) => i !== idx));
                            setInvoicePreviews(p => p.filter((_, i) => i !== idx));
                          }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* POD Upload */}
                <div className="inward-form-group file-field">
                  <label>POD Photo</label>
                  <div className="image-uploader-btn">
                    <Camera size={18} />
                    <span>{podPhoto ? 'Change POD Photo' : 'Choose POD Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleImageChange(e, setPodPhoto, setPodPreview)}
                    />
                  </div>
                  {podPreview && (
                    <div className="preview-thumbnails">
                      <div className="thumb-container">
                        <img src={podPreview} alt="POD preview" className="mini-thumb" />
                        <button type="button" className="thumb-remove" onClick={() => { setPodPhoto(null); setPodPreview(null); }}>×</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Seal Upload */}
                <div className="inward-form-group file-field">
                  <label>Vehicle Seal Photo</label>
                  <div className="image-uploader-btn">
                    <Camera size={18} />
                    <span>{sealPhoto ? 'Change Seal Photo' : 'Choose Seal Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleImageChange(e, setSealPhoto, setSealPreview)}
                    />
                  </div>
                  {sealPreview && (
                    <div className="preview-thumbnails">
                      <div className="thumb-container">
                        <img src={sealPreview} alt="Seal preview" className="mini-thumb" />
                        <button type="button" className="thumb-remove" onClick={() => { setSealPhoto(null); setSealPreview(null); }}>×</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Temp Upload */}
                <div className="inward-form-group file-field">
                  <label>Vehicle Temp Photo</label>
                  <div className="image-uploader-btn">
                    <Camera size={18} />
                    <span>{vehicleTempPhoto ? 'Change Vehicle Temp Photo' : 'Choose Vehicle Temp Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleImageChange(e, setVehicleTempPhoto, setVehicleTempPreview)}
                    />
                  </div>
                  {vehicleTempPreview && (
                    <div className="preview-thumbnails">
                      <div className="thumb-container">
                        <img src={vehicleTempPreview} alt="Vehicle Temp preview" className="mini-thumb" />
                        <button type="button" className="thumb-remove" onClick={() => { setVehicleTempPhoto(null); setVehicleTempPreview(null); }}>×</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Material Temp Upload */}
                <div className="inward-form-group file-field">
                  <label>Material Temp Photo</label>
                  <div className="image-uploader-btn">
                    <Camera size={18} />
                    <span>{materialTempPhoto ? 'Change Material Temp Photo' : 'Choose Material Temp Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleImageChange(e, setMaterialTempPhoto, setMaterialTempPreview)}
                    />
                  </div>
                  {materialTempPreview && (
                    <div className="preview-thumbnails">
                      <div className="thumb-container">
                        <img src={materialTempPreview} alt="Material Temp preview" className="mini-thumb" />
                        <button type="button" className="thumb-remove" onClick={() => { setMaterialTempPhoto(null); setMaterialTempPreview(null); }}>×</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Back Side Upload */}
                <div className="inward-form-group file-field">
                  <label>Vehicle Back Side Photo</label>
                  <div className="image-uploader-btn">
                    <Camera size={18} />
                    <span>{vehicleBackPhoto ? 'Change Back Side Photo' : 'Choose Back Side Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleImageChange(e, setVehicleBackPhoto, setVehicleBackPreview)}
                    />
                  </div>
                  {vehicleBackPreview && (
                    <div className="preview-thumbnails">
                      <div className="thumb-container">
                        <img src={vehicleBackPreview} alt="Back side preview" className="mini-thumb" />
                        <button type="button" className="thumb-remove" onClick={() => { setVehicleBackPhoto(null); setVehicleBackPreview(null); }}>×</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Damage Boxes Photo */}
                <div className="inward-form-group file-field">
                  <label>Damage Boxes Photo</label>
                  <div className="image-uploader-btn">
                    <Camera size={18} />
                    <span>{damagePhoto ? 'Change Damage Photo' : 'Choose Damage Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSingleImageChange(e, setDamagePhoto, setDamagePreview)}
                    />
                  </div>
                  {damagePreview && (
                    <div className="preview-thumbnails">
                      <div className="thumb-container">
                        <img src={damagePreview} alt="Damage preview" className="mini-thumb" />
                        <button type="button" className="thumb-remove" onClick={() => { setDamagePhoto(null); setDamagePreview(null); }}>×</button>
                      </div>
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

        {loadingLogs ? (
          <div className="loading-logs">
            <Loader2 size={24} className="spinner-icon" color="#00a2e8" />
            <span>Loading inward logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="no-logs">
            <p>No Inward temperature inspection logs found for today.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="logs-table inward-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle No</th>
                  <th className="wrap-text">Client</th>
                  <th>Vehicle Temp</th>
                  <th>Material Temp</th>
                  <th>Pallets</th>
                  <th className="wrap-text">Supervisor</th>
                  <th>POD</th>
                  <th>Seal Photo</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter(log => log.entry_date === todayStr).map((log) => {
                  const podImg = log.pod_photo ? `http://localhost:5000/${log.pod_photo}` : null;
                  const sealImg = log.vehicle_seal_photo ? `http://localhost:5000/${log.vehicle_seal_photo}` : null;
                  
                  return (
                    <tr key={log.id}>
                      <td>{log.entry_date}</td>
                      <td><strong>{log.vehicle_no}</strong></td>
                      <td className="wrap-text">{log.client_name}</td>
                      <td className="temp-cell">{log.vehicle_temp !== null ? `${log.vehicle_temp}°C` : '-'}</td>
                      <td className="temp-cell">{log.material_temp !== null ? `${log.material_temp}°C` : '-'}</td>
                      <td>{log.pallets_in_qty}</td>
                      <td className="wrap-text">{log.unloading_supervisor_name || '-'}</td>
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
                        <button
                          onClick={() => handleDeleteRecord(log.id)}
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
        )}
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
                    <span className="comp-label">Reported Reporting Time</span>
                    <div className="comp-val-dt">
                      <span className="comp-date">{formData.entry_date}</span>
                      <span className="comp-time">{formData.vehicle_reporting_time}</span>
                    </div>
                  </div>
                  <div className="comp-divider">⚡</div>
                  <div className="comp-item">
                    <span className="comp-label">Temp Photo Time</span>
                    <div className="comp-val-dt">
                      <span className="comp-date">{verificationData.photo_date_str}</span>
                      <span className="comp-time">{verificationData.photo_capture_time_str.split(' ')[1]}</span>
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
                    ✅ Audit Verified: Vehicle temperature check recorded within the scheduled window.
                  </div>
                ) : (
                  <div className="variance-alert-banner">
                    ⚠️ Audit Alert: Vehicle temperature check recorded outside the scheduled reporting window.
                  </div>
                )}

                {/* Show Date Discrepancy Alert */}
                {verificationData.photo_date_str !== formData.entry_date && (
                  <div className="variance-alert-banner" style={{ marginTop: '8px', border: '1.5px solid #ef4444', color: '#b91c1c', backgroundColor: '#fef2f2' }}>
                    ⚠️ Date Alert: Inspection Photo captured on {verificationData.photo_date_str}, but you are submitting for {formData.entry_date}!
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
