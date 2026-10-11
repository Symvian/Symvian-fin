import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, MapPin, Mail, Users, X } from 'lucide-react';

export const CreateVenueModal = ({ onClose }) => {
  const { createVenue } = useApp();

  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState(250);
  const [contactEmail, setContactEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    createVenue({
      Venue_Name: venueName,
      Location_Address: address,
      Total_Capacity: Number(capacity),
      Contact_Email: contactEmail || 'venue.admin@amrita.edu',
      Image: imageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80'
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Register Campus Venue</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Venue Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Visvesvaraya Seminar Hall"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Campus Location / Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Mechanical Block, 3rd Floor"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Total Architectural Capacity</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  className="form-input"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="venue.desk@amrita.edu"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cover Image URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Venue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
