import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  MapPin,
  Users,
  Mail,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const VenuesView = ({ onOpenAddVenueModal }) => {
  const { venues, events } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVenues = venues.filter(v =>
    v.Venue_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.Location_Address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Venues & Structural Capacity</h1>
            <p className="page-description">
              Campus spaces, maximum architectural limits, and active reservation schedules.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={onOpenAddVenueModal}
          >
            <Plus size={18} />
            <span>Add Campus Venue</span>
          </button>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="events-grid">
        {filteredVenues.map(venue => {
          // Find events scheduled at this venue
          const venueEvents = events.filter(e => e.Venue_ID === venue.Venue_ID);
          const totalEnrolled = venueEvents.reduce((acc, e) => acc + e.Current_Enrolled, 0);
          const utilizationRate = Math.min(100, Math.round((totalEnrolled / venue.Total_Capacity) * 100));

          return (
            <div key={venue.Venue_ID} className="event-card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Image banner */}
              <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={venue.Image || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80'}
                  alt={venue.Venue_Name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  Cap: {venue.Total_Capacity} Seats
                </div>
              </div>

              {/* Content Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {venue.Venue_Name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} color="var(--text-muted)" />
                    <span>{venue.Location_Address}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Mail size={13} />
                  <span>{venue.Contact_Email}</span>
                </div>

                {/* Utilization meter */}
                <div className="capacity-box" style={{ marginTop: '0.15rem' }}>
                  <div className="capacity-labels">
                    <span className="capacity-title">Venue Load Allocation</span>
                    <span className="capacity-stats available">{totalEnrolled} / {venue.Total_Capacity} Booked</span>
                  </div>
                  <div className="capacity-track">
                    <div
                      className="capacity-fill dark"
                      style={{ width: `${utilizationRate}%` }}
                    />
                  </div>
                </div>

                {/* Scheduled events list */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Scheduled Events ({venueEvents.length})
                  </div>

                  {venueEvents.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No events currently scheduled.</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {venueEvents.map(e => (
                        <div
                          key={e.Event_ID}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-subtle)',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem'
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {e.Title}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {e.Current_Enrolled}/{e.Max_Capacity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
