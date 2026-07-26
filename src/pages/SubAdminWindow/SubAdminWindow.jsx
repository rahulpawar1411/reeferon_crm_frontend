// ====================================================================
// Sub Admin Portal Window (src/pages/SubAdminWindow/SubAdminWindow.jsx)
// Strictly managed workspace layout for Sub Admin role.
// Integrates Sales Leads CRM dashboard, header, and sidebar components.
// ====================================================================

import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import Dashboard from '../Dashboard/Dashboard';
import Leads from '../Leads/Leads';
import AddLead from '../AddLead/AddLead';
import LeadDetails from '../LeadDetails/LeadDetails';
import Settings from '../Settings/Settings';
import TempMonitor from '../TempMonitor/TempMonitor';

export default function SubAdminWindow({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);

  const getAdminTitle = () => {
    if (selectedLead) return 'Lead Details';
    switch (activeTab) {
      case 'dashboard': return 'Sales Dashboard';
      case 'leads': return 'Lead Manager';
      case 'add-lead': return 'New Lead';
      case 'temp-monitor': return 'DO Temp Monitoring';
      case 'settings': return 'Settings';
      default: return 'ReeferON CRM';
    }
  };

  return (
    <>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setSelectedLead(null);
          setActiveTab(tab);
        }} 
        onLogout={onLogout}
      />

      <Header 
        title={getAdminTitle()} 
        activeTab={activeTab}
      />

      <main className="app-viewport">
        {selectedLead ? (
          <LeadDetails 
            leadId={selectedLead} 
            onBack={() => setSelectedLead(null)} 
          />
        ) : activeTab === 'leads' ? (
          <Leads onSelectLead={(id) => setSelectedLead(id)} />
        ) : activeTab === 'add-lead' ? (
          <AddLead />
        ) : activeTab === 'temp-monitor' ? (
          <TempMonitor />
        ) : activeTab === 'settings' ? (
          <Settings />
        ) : (
          <Dashboard onSelectTab={setActiveTab} />
        )}
      </main>
    </>
  );
}
