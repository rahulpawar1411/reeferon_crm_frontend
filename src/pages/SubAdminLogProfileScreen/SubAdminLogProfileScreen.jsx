import React from 'react';
import LogProfileDetailModal from '../../components/LogProfileDetailModal/LogProfileDetailModal';
import './SubAdminLogProfileScreen.css';

export default function SubAdminLogProfileScreen({ log, detailType, onBack }) {
  if (!log) return null;

  return (
    <LogProfileDetailModal
      log={log}
      detailType={detailType}
      onClose={onBack}
      fullScreen
    />
  );
}
