import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Building2,
  Mail,
  UserCheck,
  CheckCircle2,
  Clock3,
  QrCode,
  ShieldCheck,
  XCircle,
  Tag,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const EventDetailsModal = ({ event, onClose, onInitiatePayment }) => {
  const {
    venues,
    categories,
    users,
    eventVolunteers,
    currentUser,
    registrations,
    payments,
    getUserEventRegistration,
    registerForEvent,
    cancelRegistration,
    markNotificationRead,
    retryRegistration
  } = useApp();

  if (!event) return null;

  const venue = venues.find(v => v.Venue_ID === event.Venue_ID);
  const category = categories.find(c => c.Category_ID === event.Category_ID);
  const organizer = users.find(u => u.User_ID === event.Organizer_ID);
  const volunteers = eventVolunteers.filter(v => v.Event_ID === event.Event_ID);

  const userReg = getUserEventRegistration(event.Event_ID, currentUser.User_ID);
  const userPayment = payments.find(p => p.Registration_ID === userReg?.Registration_ID || p.registration_id === userReg?.registration_id);
  const adminContact = event.admin_contact || event.Admin_Contact || '9876543210';
  const isFull = event.Current_Enrolled >= event.Max_Capacity;
  const isPaid = Number(event.Ticket_Price) > 0;
  const fillPercentage = Math.min(100, Math.round((event.Current_Enrolled / event.Max_Capacity) * 100));

  const handleRegisterFree = () => {
    const res = registerForEvent({ eventId: event.Event_ID, userId: currentUser.User_ID });
    if (res.success && res.status === 'Enrolled') {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleJoinWaitlist = () => {
    registerForEvent({ eventId: event.Event_ID, userId: currentUser.User_ID });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        {/* Cover image header */}
        <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
          <img
            src={event.Cover_Image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
            alt={event.Title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)'
            }}
          />
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff' }}
          >
            <X size={16} />
          </button>

          <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {category?.Category_Name}
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
                {event.Title}
              </h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                {isPaid ? `₹${event.Ticket_Price}` : 'Free Admission'}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {/* Key Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Date & Time</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(event.Event_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Venue</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{venue?.Venue_Name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={16} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Location</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{venue?.Location_Address}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Organizer</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{organizer?.Full_Name || 'Staff Lead'}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              About this Event
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {event.Description}
            </p>
          </div>

          {/* Capacity Progress Visualizer */}
          <div className="capacity-box" style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div className="capacity-labels">
              <span className="capacity-title">Real-time Seat Reservation Status</span>
              <span className={`capacity-stats ${isFull ? 'full' : 'available'}`}>
                {isFull ? `${event.Max_Capacity} / ${event.Max_Capacity} (Full - Waitlist Open)` : `${event.Current_Enrolled} / ${event.Max_Capacity} Confirmed`}
              </span>
            </div>
            <div className="capacity-track" style={{ height: '6px' }}>
              <div
                className={`capacity-fill ${isFull ? 'amber' : 'dark'}`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>

          {/* Attendee Status Gate: Cancellation & Rejected Notification Card */}
          {userReg && (userReg.Registration_Status === 'Rejected' || userReg.registration_status === 'Rejected' || userReg.is_cancelled) && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '1rem', color: '#991b1b' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <XCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      Sorry, you could not be admitted
                    </span>
                    {!userReg.notification_read && (
                      <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#fecaca', color: '#7f1d1d', fontWeight: 600 }}>
                        Cancellation Notice
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: '#b91c1c' }}>
                    <strong>Reason:</strong> {userReg.cancellation_reason || 'Seat cancelled by event administrator'}
                  </div>
                  <div style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span>Helpline Contact:</span>
                    <a href={`tel:${userReg.cancelled_by_contact || adminContact}`} style={{ color: '#7f1d1d', textDecoration: 'underline', fontWeight: 700 }}>
                      {userReg.cancelled_by_contact || adminContact}
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {!userReg.notification_read && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem', background: '#ffffff', borderColor: '#fca5a5', color: '#991b1b' }}
                        onClick={() => markNotificationRead(userReg.Registration_ID || userReg.registration_id)}
                      >
                        Mark Notification as Read
                      </button>
                    )}
                    {(!userReg.retry_count || userReg.retry_count < 1) ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem' }}
                        onClick={() => {
                          retryRegistration(userReg.Registration_ID || userReg.registration_id);
                          onClose();
                        }}
                      >
                        Retry Enrollment (1 left)
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 500 }}>
                        No retries remaining
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mandated Seat Fee for Promoted Waitlist Candidate */}
          {userReg && (userReg.Registration_Status === 'Pending_Payment' || userReg.registration_status === 'Pending_Payment') && (!userReg.is_cancelled && userReg.Registration_Status !== 'Rejected') && (!userPayment || userPayment.Payment_Status !== 'Verified') && (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '0.9rem 1rem', color: '#854d0e' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#713f12' }}>
                    Waitlist Promotion Accepted — Payment Mandated
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#854d0e' }}>
                    Your waitlist queue entry has gone through! You are mandated to submit payment of ₹{event.Ticket_Price || event.ticket_price} to confirm admission.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ height: '30px', fontSize: '0.76rem', padding: '0 0.75rem' }}
                  onClick={() => {
                    onClose();
                    onInitiatePayment(event, userReg);
                  }}
                >
                  Pay ₹{event.Ticket_Price || event.ticket_price} Now
                </button>
              </div>
            </div>
          )}

          {/* Attendee Status Gate: Payment Pending Notification */}
          {userPayment && (userPayment.Payment_Status === 'Pending' || userPayment.payment_status === 'Pending') && (!userReg || (!userReg.is_cancelled && userReg.Registration_Status !== 'Rejected')) && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#92400e' }}>
              <Clock size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                Payment verification pending approval. Contact Admin:{' '}
                <a href={`tel:${adminContact}`} style={{ color: '#92400e', textDecoration: 'underline', fontWeight: 700 }}>
                  {adminContact}
                </a>
              </span>
            </div>
          )}

          {/* Digital Admission Pass (if Enrolled) */}
          {userReg && (userReg.Registration_Status === 'Enrolled' || userReg.registration_status === 'Enrolled') && (!userReg.is_cancelled) && (!userPayment || userPayment.Payment_Status === 'Verified' || userPayment.payment_status === 'Verified') && (
            <div style={{ background: 'var(--emerald-bg)', border: '1px solid var(--emerald-border)', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--emerald-text)', fontWeight: 600, fontSize: '0.82rem' }}>
                  <CheckCircle2 size={15} />
                  <span>Digital Admission Pass Active</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Pass Holder: <strong style={{ color: 'var(--text-primary)' }}>{currentUser.Full_Name}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: {userReg.Registration_ID} • Registered: {new Date(userReg.Registered_At).toLocaleDateString()}
                </div>
              </div>

              <div style={{ width: '56px', height: '56px', background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <QrCode size={48} color="#18181b" />
              </div>
            </div>
          )}

          {/* Volunteer Desk Contacts */}
          {volunteers.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Event Field Coordinators & Volunteers ({volunteers.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {volunteers.map(v => {
                  const volUser = users.find(u => u.User_ID === v.User_ID);
                  return (
                    <div
                      key={v.Assignment_ID}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.35rem 0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.76rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{volUser?.Full_Name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>• {v.Assigned_Role}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer">
          {userReg ? (
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Status:{' '}
                <strong style={{
                  color: (userReg.is_cancelled || userReg.Registration_Status === 'Rejected')
                    ? '#ef4444'
                    : userReg.Registration_Status === 'Enrolled'
                      ? '#34d399'
                      : '#fbbf24'
                }}>
                  {(userReg.is_cancelled || userReg.Registration_Status === 'Rejected') ? 'Cancelled' : userReg.Registration_Status}
                </strong>
              </span>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {(userReg.Registration_Status === 'Pending_Payment' || userReg.registration_status === 'Pending_Payment') && !userReg.is_cancelled && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      onClose();
                      onInitiatePayment(event, userReg);
                    }}
                  >
                    Pay Seat Fee (₹{event.Ticket_Price || event.ticket_price})
                  </button>
                )}
                {(userReg.is_cancelled || userReg.Registration_Status === 'Rejected' || userReg.registration_status === 'Rejected') && (!userReg.retry_count || userReg.retry_count < 1) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      retryRegistration(userReg.Registration_ID || userReg.registration_id);
                      onClose();
                    }}
                  >
                    Retry Enrollment (1 left)
                  </button>
                )}
                {(!userReg.is_cancelled && userReg.Registration_Status !== 'Rejected' && userReg.registration_status !== 'Rejected') && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      cancelRegistration(userReg.Registration_ID || userReg.registration_id);
                      onClose();
                    }}
                  >
                    Cancel Registration (Promotes Waitlist)
                  </button>
                )}
                <button className="btn btn-outline btn-sm" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={onClose}>
                Close
              </button>
              {(() => {
                const status = String(event.Status || event.status || '').toLowerCase();
                const evtRegs = (registrations || []).filter(r => 
                  (String(r.Event_ID || r.event_id) === String(event.Event_ID || event.event_id)) && 
                  !r.is_cancelled && r.Registration_Status !== 'Rejected' && r.registration_status !== 'Rejected'
                );
                const waitlistCount = evtRegs.filter(r => r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted').length;
                const pendingPaymentCount = evtRegs.filter(r => r.Registration_Status === 'Pending_Payment' || r.registration_status === 'Pending_Payment').length;
                const enrolledCount = evtRegs.filter(r => r.Registration_Status === 'Enrolled' || r.registration_status === 'Enrolled').length;
                const maxCap = Number(event.Max_Capacity || event.max_capacity || 0);
                const curEnrolled = Number(event.Current_Enrolled || event.current_enrolled || 0);

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
                      onClick={() => {
                        handleJoinWaitlist();
                        onClose();
                      }}
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
                      onClick={() => {
                        onClose();
                        onInitiatePayment(event);
                      }}
                    >
                      <span>Proceed to Payment (₹{event.Ticket_Price})</span>
                    </button>
                  );
                }

                return (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleRegisterFree();
                      onClose();
                    }}
                  >
                    <span>Instant Register (Free)</span>
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
