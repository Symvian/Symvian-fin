import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Building2,
  Tag,
  Users,
  AlertTriangle,
  Info,
  ShieldCheck,
  Phone,
  CreditCard,
  X
} from 'lucide-react';

export const CreateEventModal = ({ onClose }) => {
  const { categories, venues, createEventWithAdmins, currentUser, setCurrentUser } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.Category_ID || '1');
  const [venueId, setVenueId] = useState(venues[0]?.Venue_ID || '1');
  const [eventDate, setEventDate] = useState('2026-11-15T10:00');
  const [ticketPrice, setTicketPrice] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [upiId, setUpiId] = useState('anirudh@okhdfcbank');
  const [adminContact, setAdminContact] = useState(currentUser?.Phone || currentUser?.phone || '9876543210');
  const [coAdminsInput, setCoAdminsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVenue = venues.find(v => v.Venue_ID === venueId || String(v.venue_id) === String(venueId));
  const isExceedingVenue = selectedVenue && Number(maxCapacity) > Number(selectedVenue.Total_Capacity);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isExceedingVenue || isSubmitting) return;

    setIsSubmitting(true);

    const adminEmails = coAdminsInput
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    const formData = {
      title,
      description,
      category_id: categoryId,
      venue_id: venueId,
      upi_id: upiId,
      admin_contact: adminContact || currentUser?.Phone || currentUser?.phone || '9876543210',
      event_date: new Date(eventDate).toISOString(),
      ticket_price: ticketPrice,
      max_capacity: maxCapacity
    };

    const res = await createEventWithAdmins({
      title: formData.title,
      description: formData.description,
      categoryId: formData.category_id,
      venueId: formData.venue_id,
      eventDate: formData.event_date,
      ticketPrice: formData.ticket_price,
      maxCapacity: formData.max_capacity,
      upiId: formData.upi_id,
      adminContact: formData.admin_contact,
      adminEmails
    });

    setIsSubmitting(false);

    if (res?.success) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-subtle)' }}>
              <ShieldCheck size={18} color="var(--accent-primary, #6366f1)" />
            </div>
            <div>
              <h3 className="modal-title">Schedule New Event</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Configure capacity limits, UPI payment details, and assign co-administrators.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Event Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. National Robotics & DBMS Symposium 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description & Agenda</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Enter event overview, target participants, prerequisites, and itinerary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Category & Venue Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.Category_ID || cat.category_id} value={cat.Category_ID || cat.category_id}>
                      {cat.Category_Name || cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Assigned Venue</span>
                  {selectedVenue && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Max Cap: {selectedVenue.Total_Capacity || selectedVenue.total_capacity}
                    </span>
                  )}
                </label>
                <select
                  className="form-select"
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  required
                >
                  {venues.map(v => (
                    <option key={v.Venue_ID || v.venue_id} value={v.Venue_ID || v.venue_id}>
                      {v.Venue_Name || v.venue_name} (Total Cap: {v.Total_Capacity || v.total_capacity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date, Ticket Price, and Capacity Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ticket Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  className="form-input"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="0 for Free"
                  required
                />
                <span className="form-hint">{Number(ticketPrice) === 0 ? 'Free Event' : `Paid Ticket: ₹${ticketPrice}`}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Max Seat Capacity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedVenue?.Total_Capacity || selectedVenue?.total_capacity || 5000}
                  className="form-input"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  required
                />
                <span className="form-hint">Must not exceed venue capacity</span>
              </div>
            </div>

            {/* Payment & Contact Info Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CreditCard size={14} />
                  <span>Organizer UPI ID (for Ticket Payments)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. anirudh@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
                <span className="form-hint">Attendees transfer ticket fee directly to this UPI address</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} />
                  <span>Admin Support Contact</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={adminContact}
                  onChange={(e) => setAdminContact(e.target.value)}
                  required
                />
                <span className="form-hint">Emergency helpline displayed to attendees</span>
              </div>
            </div>

            {/* Requirement 3: Add Co-Admins (Comma-separated emails) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Add Co-Admins (Comma-separated emails)</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Grants strict event-level administrative powers
                </span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="devan@symvian.edu, sriram@symvian.edu"
                value={coAdminsInput}
                onChange={(e) => setCoAdminsInput(e.target.value)}
              />
              <span className="form-hint">
                Co-admins will have this event added to their <code>admin_event_ids</code> and gain privileges to verify payments, admit waitlists, and cancel seats.
              </span>
            </div>

            {/* Capacity Control Alert if limit violated */}
            {isExceedingVenue && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fb7185', fontSize: '0.82rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Capacity Violation (Business Rule 1):</strong> Event capacity ({maxCapacity}) exceeds maximum venue allowance ({selectedVenue.Total_Capacity || selectedVenue.total_capacity}) for {selectedVenue.Venue_Name || selectedVenue.venue_name}.
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isExceedingVenue || !title.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating Event...' : 'Publish Event & Assign Admins'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
