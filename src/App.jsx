import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { DiscoverEvents } from './components/DiscoverEvents';
import { OrganizeEvents } from './components/OrganizeEvents';
import { VenuesView } from './components/VenuesView';
import { VolunteerHub } from './components/VolunteerHub';
import { FinanceInsights } from './components/FinanceInsights';
import { DatabaseSchemaHub } from './components/DatabaseSchemaHub';
import { PaymentModal } from './components/PaymentModal';
import { CreateEventModal } from './components/CreateEventModal';
import { CreateVenueModal } from './components/CreateVenueModal';
import { EventDetailsModal } from './components/EventDetailsModal';
import { SupabaseModal } from './components/SupabaseModal';
import { ToastContainer } from './components/ToastContainer';

export function App() {
  const { activeTab, setActiveTab, isAuthenticated } = useApp();

  // Modal State
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isCreateVenueModalOpen, setIsCreateVenueModalOpen] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState(null);
  const [paymentModalData, setPaymentModalData] = useState(null); // { event, registration }

  const handleOpenPayment = (event, existingReg = null) => {
    setPaymentModalData({ event, existingReg });
  };

  // If user is not authenticated, show professional login screen
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <LoginPage />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Central Text Navigation & Brand Header */}
      <Navbar />

      {/* Main Tab Content View */}
      <main className="main-content">
        {activeTab === 'discover' && (
          <DiscoverEvents
            onSelectEvent={(evt) => setSelectedEventForModal(evt)}
            onInitiatePayment={(evt, existingReg) => handleOpenPayment(evt, existingReg)}
          />
        )}

        {activeTab === 'organize' && (
          <OrganizeEvents
            onOpenCreateModal={() => setIsCreateEventModalOpen(true)}
            onSelectEvent={(evt) => setSelectedEventForModal(evt)}
          />
        )}

        {activeTab === 'venues' && (
          <VenuesView
            onOpenAddVenueModal={() => setIsCreateVenueModalOpen(true)}
          />
        )}

        {activeTab === 'volunteer' && (
          <VolunteerHub />
        )}

        {activeTab === 'finance' && (
          <FinanceInsights />
        )}

        {activeTab === 'database' && (
          <DatabaseSchemaHub
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="app-footer-brand">
            <span className="app-footer-logo">SYMVIAN</span>
            <span>•</span>
            <span>23CSE202 Database Management Systems (Group B6)</span>
          </div>

          <div className="app-footer-links">
            <span>Amrita School of Computing • Amritapuri Campus</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {isSupabaseModalOpen && (
        <SupabaseModal onClose={() => setIsSupabaseModalOpen(false)} />
      )}

      {isCreateEventModalOpen && (
        <CreateEventModal onClose={() => setIsCreateEventModalOpen(false)} />
      )}

      {isCreateVenueModalOpen && (
        <CreateVenueModal onClose={() => setIsCreateVenueModalOpen(false)} />
      )}

      {selectedEventForModal && (
        <EventDetailsModal
          event={selectedEventForModal}
          onClose={() => setSelectedEventForModal(null)}
          onInitiatePayment={(evt) => handleOpenPayment(evt)}
        />
      )}

      {paymentModalData && (
        <PaymentModal
          event={paymentModalData.event}
          existingRegistration={paymentModalData.existingReg}
          onClose={() => setPaymentModalData(null)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
