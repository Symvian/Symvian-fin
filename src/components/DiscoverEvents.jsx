import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ArrowRight,
  Ticket,
  User,
  Users,
  ShieldAlert,
  XCircle
} from 'lucide-react';

export const DiscoverEvents = ({ onSelectEvent, onInitiatePayment }) => {
  const {
    events,
    venues,
    categories,
    currentUser,
    registrations,
    payments,
    registerForEvent,
    cancelRegistration,
    markNotificationRead,
    retryRegistration,
    getUserEventRegistration
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL'); // 'ALL' | 'FREE' | 'PAID'

  // Helper to get venue name
  const getVenue = (venueId) => venues.find(v => v.Venue_ID === venueId);
  // Helper to get category name
  const getCategory = (catId) => categories.find(c => c.Category_ID === catId);

  // Filtered Events List
  const filteredEvents = events.filter(evt => {
    const matchesSearch =
      evt.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.Description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || evt.Category_ID === selectedCategory;

    const matchesPrice =
      priceFilter === 'ALL' ||
      (priceFilter === 'FREE' && Number(evt.Ticket_Price) === 0) ||
      (priceFilter === 'PAID' && Number(evt.Ticket_Price) > 0);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const handleRegisterFree = (eventId) => {
    registerForEvent({ eventId, userId: currentUser.User_ID });
  };

  const handleJoinWaitlist = (eventId) => {
    registerForEvent({ eventId, userId: currentUser.User_ID });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Upcoming Experiences</h1>
            <p className="page-description">
              Reserve seats, track live dynamic limits, and finalize payment verifications.
            </p>
          </div>

          {/* Search Input */}
          <div className="search-input-box">
            <Search size={16} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category Navigation (Clean Text Tabs, No Pill Enclosure) */}
      <div className="category-text-nav-bar">
        <div className="category-text-links" role="tablist" aria-label="Event Categories">
          <button
            className={`cat-text-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
            role="tab"
            aria-selected={selectedCategory === 'ALL'}
          >
            <span>All Categories</span>
            {selectedCategory === 'ALL' && <span className="cat-active-line" />}
          </button>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.Category_ID;
            return (
              <button
                key={cat.Category_ID}
                className={`cat-text-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.Category_ID)}
                role="tab"
                aria-selected={isSelected}
              >
                <span>{cat.Category_Name}</span>
                {isSelected && <span className="cat-active-line" />}
              </button>
            );
          })}
        </div>

        {/* Clean Text-based Price Filter */}
        <div className="price-text-filter">
          <span className="price-filter-label">Price:</span>
          <button
            className={`price-text-btn ${priceFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setPriceFilter('ALL')}
          >
            All
          </button>
          <button
            className={`price-text-btn ${priceFilter === 'FREE' ? 'active' : ''}`}
            onClick={() => setPriceFilter('FREE')}
          >
            Free
          </button>
          <button
            className={`price-text-btn ${priceFilter === 'PAID' ? 'active' : ''}`}
            onClick={() => setPriceFilter('PAID')}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}
        >
          <Ticket size={44} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', marginBottom: '0.35rem', fontWeight: 700 }}>No events match your criteria</h2>
          <p style={{ fontSize: '0.85rem' }}>Try clearing your search or category filters.</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => {
            const venue = getVenue(event.Venue_ID);
            const category = getCategory(event.Category_ID);
            const maxCap = Number(event.Max_Capacity || event.max_capacity || 1);
            const curEnrolled = Number(event.Current_Enrolled ?? event.current_enrolled ?? 0);
            const isFull = curEnrolled >= maxCap;
            const isPaid = Number(event.Ticket_Price ?? event.ticket_price ?? 0) > 0;
            const fillPercentage = Math.min(100, Math.round((curEnrolled / maxCap) * 100));

            // Check if active user already registered
            const userRegistration = getUserEventRegistration(event.Event_ID, currentUser.User_ID);

            // Category style helper
            const catName = category?.Category_Name?.toLowerCase() || '';
            let badgeClass = 'badge-technical';
            if (catName.includes('cultural')) badgeClass = 'badge-cultural';
            else if (catName.includes('hackathon')) badgeClass = 'badge-hackathon';
            else if (catName.includes('workshop')) badgeClass = 'badge-workshop';
            else if (catName.includes('symposium')) badgeClass = 'badge-symposium';

            // Format date
            const dateObj = new Date(event.Event_Date);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div key={event.Event_ID} className="event-card">
                {/* Header: Category Badge & Ticket Price */}
                <div className="card-header-bar">
                  <span className={`badge-category ${badgeClass}`}>
                    {category?.Category_Name || 'General'}
                  </span>

                  <div className="price-tag">
                    {isPaid ? (
                      <span className="price-paid">
                        ₹{event.Ticket_Price}
                      </span>
                    ) : (
                      <span className="price-free">Free</span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="event-card-body">
                  <h2
                    className="event-card-title"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectEvent(event)}
                    title="Click for full event details"
                  >
                    {event.Title}
                  </h2>

                  <div className="event-meta-list">
                    <div className="event-meta-item">
                      <Calendar size={14} />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="event-meta-item">
                      <MapPin size={14} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {venue?.Venue_Name || 'Campus Venue'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Visualizer */}
                <div className="capacity-box">
                  <div className="capacity-labels">
                    <span className="capacity-title">Capacity Allocation</span>
                    <span className={`capacity-stats ${isFull ? 'full' : 'available'}`}>
                      {isFull ? (
                        `${maxCap} / ${maxCap} (Waitlist Open)`
                      ) : (
                        `${curEnrolled} / ${maxCap} Enrolled`
                      )}
                    </span>
                  </div>

                  <div className="capacity-track">
                    <div
                      className={`capacity-fill ${isFull ? 'amber' : 'dark'}`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons & Status */}
                <div className="card-actions" style={{ minHeight: '38px' }}>
                  {userRegistration ? (
                    // Registered State (Exact 38px height, perfectly stable grid layout)
                    <div style={{ height: '38px' }}>
                      {(userRegistration.is_cancelled || userRegistration.Registration_Status === 'Rejected' || userRegistration.registration_status === 'Rejected') ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '38px', padding: '0 0.65rem', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fee2e2', boxSizing: 'border-box' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <XCircle size={14} color="#ef4444" />
                            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#991b1b' }}>
                              Seat Not Admitted
                            </span>
                          </div>
                          {(!userRegistration.retry_count || userRegistration.retry_count < 1) ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.5rem' }}
                              onClick={() => retryRegistration(userRegistration.Registration_ID || userRegistration.registration_id)}
                            >
                              Retry (1 left)
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: '#b91c1c' }}>No retries left</span>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            height: '38px',
                            padding: '0 0.65rem',
                            borderRadius: '6px',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {(userRegistration.Registration_Status === 'Enrolled' || userRegistration.registration_status === 'Enrolled') && (
                              <>
                                <CheckCircle2 size={15} color="var(--emerald-text)" />
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--emerald-text)' }}>
                                  Enrolled
                                </span>
                              </>
                            )}
                            {(userRegistration.Registration_Status === 'Waitlisted' || userRegistration.registration_status === 'Waitlisted') && (
                              <>
                                <Clock3 size={15} color="var(--amber-text)" />
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--amber-text)' }}>
                                  Waitlist #{userRegistration.Waitlist_Position || userRegistration.waitlist_position}
                                </span>
                              </>
                            )}
                            {(userRegistration.Registration_Status === 'Pending_Payment' || userRegistration.registration_status === 'Pending_Payment') && (
                              <>
                                <AlertCircle size={15} color="#854d0e" />
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#854d0e' }}>
                                  Pending Payment
                                </span>
                              </>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            {userRegistration.Registration_Status === 'Pending_Payment' ? (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.5rem' }}
                                onClick={() => onInitiatePayment(event, userRegistration)}
                              >
                                Pay ₹{event.Ticket_Price || event.ticket_price}
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.5rem' }}
                                onClick={() => onSelectEvent(event)}
                              >
                                View
                              </button>
                            )}
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.5rem', color: 'var(--rose-text)' }}
                              onClick={() => cancelRegistration(userRegistration.Registration_ID || userRegistration.registration_id)}
                              title="Cancel registration"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Not Registered State
                    <div style={{ height: '38px' }}>
                      {(() => {
                        const status = String(event.Status || event.status || '').toLowerCase();
                        const evtRegs = (registrations || []).filter(r => 
                          (String(r.Event_ID || r.event_id) === String(event.Event_ID || event.event_id)) && 
                          !r.is_cancelled && r.Registration_Status !== 'Rejected' && r.registration_status !== 'Rejected'
                        );
                        const waitlistCount = evtRegs.filter(r => r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted').length;
                        const pendingPaymentCount = evtRegs.filter(r => r.Registration_Status === 'Pending_Payment' || r.registration_status === 'Pending_Payment').length;
                        const enrolledCount = evtRegs.filter(r => r.Registration_Status === 'Enrolled' || r.registration_status === 'Enrolled').length;

                        const isClosed = status === 'closed' || status === 'completed' || status === 'cancelled' || 
                                         event.registration_closed || event.is_registration_closed || event.waitlist_closed ||
                                         (event.has_admitted_waitlist && waitlistCount === 0 && pendingPaymentCount === 0) ||
                                         (maxCap > 0 && (curEnrolled >= maxCap || enrolledCount >= maxCap) && waitlistCount === 0 && pendingPaymentCount === 0 && event.has_admitted_waitlist);

                        if (isClosed) {
                          return (
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                width: '100%',
                                height: '38px',
                                boxSizing: 'border-box',
                                opacity: 0.65,
                                cursor: 'not-allowed',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)',
                                fontWeight: 600
                              }}
                              disabled
                            >
                              Sorry, registrations closed
                            </button>
                          );
                        }

                        if (isFull) {
                          return (
                            <button
                              className="btn btn-waitlist"
                              style={{ width: '100%', height: '38px', boxSizing: 'border-box' }}
                              onClick={() => handleJoinWaitlist(event.Event_ID)}
                            >
                              <Clock3 size={16} />
                              <span>Join Waitlist Queue</span>
                            </button>
                          );
                        }

                        if (isPaid) {
                          return (
                            <button
                              className="btn btn-primary"
                              style={{ width: '100%', height: '38px', boxSizing: 'border-box' }}
                              onClick={() => onInitiatePayment(event)}
                            >
                              <span>Complete Enrollment (₹{event.Ticket_Price})</span>
                              <ArrowRight size={16} />
                            </button>
                          );
                        }

                        return (
                          <button
                            className="btn btn-primary"
                            style={{ width: '100%', height: '38px', boxSizing: 'border-box' }}
                            onClick={() => handleRegisterFree(event.Event_ID)}
                          >
                            <span>Instant Register (Free)</span>
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
