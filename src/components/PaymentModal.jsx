import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  QrCode,
  Copy,
  Check,
  PhoneCall,
  ArrowRight,
  ShieldAlert,
  Send,
  CreditCard,
  X
} from 'lucide-react';

export const PaymentModal = ({ event, onClose }) => {
  const { submitManualUpiPayment, currentUser } = useApp();

  const [utrRef, setUtrRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const upiId = event?.upi_id || event?.UPI_ID || 'anirudh@okhdfcbank';
  const ticketPrice = Number(event?.ticket_price ?? event?.Ticket_Price ?? 0);
  const adminContact = event?.admin_contact || event?.Admin_Contact || '9876543210';
  const eventId = event?.event_id || event?.Event_ID;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!utrRef.trim()) {
      setErrorMsg('Please enter your 12-digit UPI UTR / Transaction Reference number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await submitManualUpiPayment({
        eventId: eventId,
        utrReference: utrRef.trim()
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg('Failed to submit payment reference. Please try again.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="modal-title">Manual UPI Payment</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Direct UPI Transfer • Verified by Event Organizer
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Event & Amount Banner */}
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Event Admission Fee
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ₹{ticketPrice}
                </span>
              </div>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, margin: '0.2rem 0' }}>
                {event?.Title || event?.title}
              </h4>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Attendee: <strong>{currentUser?.Full_Name || currentUser?.full_name}</strong> ({currentUser?.Email || currentUser?.email})
              </div>
            </div>

            {/* UPI ID Transfer Display Card */}
            <div style={{ border: '1px dashed var(--border-strong)', borderRadius: '10px', padding: '1rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Organizer UPI ID
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--emerald-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <QrCode size={13} /> Active VPA
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem' }}
                >
                  {copied ? (
                    <>
                      <Check size={12} color="#16a34a" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Open any UPI application (GPay, PhonePe, Paytm, BHIM), transfer <strong>₹{ticketPrice}</strong> to <strong>{upiId}</strong>, and enter the transaction reference below.
              </p>
            </div>

            {/* Attendee UPI UTR Input Field */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="upi-utr-input">
                Attendee UPI UTR / Transaction Reference <span style={{ color: 'var(--rose-text)' }}>*</span>
              </label>
              <input
                id="upi-utr-input"
                type="text"
                className="form-input"
                placeholder="e.g. 428910284912 or UPI Ref #"
                value={utrRef}
                onChange={(e) => setUtrRef(e.target.value)}
                required
                autoFocus
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Found in your banking app's payment confirmation receipt.
              </span>
            </div>

            {errorMsg && (
              <div className="login-error-alert" style={{ margin: 0 }}>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Organizer Emergency Support Text */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem 0.85rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', fontSize: '0.8rem' }}>
              <PhoneCall size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Need non-UPI or urgent payment support? Call:{' '}
                <a
                  href={`tel:${adminContact}`}
                  style={{ color: '#991b1b', fontWeight: 700, textDecoration: 'underline' }}
                >
                  {adminContact}
                </a>
              </div>
            </div>
          </div>

          {/* Modal Footer with "Payment sent, send request" Button */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !utrRef.trim()}
            >
              {isSubmitting ? (
                <span>Submitting Request...</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Payment sent, send request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
