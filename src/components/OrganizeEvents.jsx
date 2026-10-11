import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
  ArrowUpRight,
  Clock3,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Lock,
  XCircle,
  Phone,
  X
} from 'lucide-react';

export const OrganizeEvents = ({ onOpenCreateModal, onSelectEvent }) => {
  const {
    events,
    venues,
    categories,
    users,
    registrations,
    payments,
    cancelRegistrationSeat,
    verifyPayment,
    admitWaitlistedMembers,
    deleteEvent,
    currentUser,
    isEventAdmin
  } = useApp();

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.Event_ID || events[0]?.event_id || null);
  const [rosterFilter, setRosterFilter] = useState('ALL'); // 'ALL' | 'Enrolled' | 'Waitlisted' | 'Pending_Payment'
  const [admitCount, setAdmitCount] = useState(5);
  const [isAdmitting, setIsAdmitting] = useState(false);

  // Seat cancellation modal state
  const [cancellingSeatTarget, setCancellingSeatTarget] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [isCancellingSeat, setIsCancellingSeat] = useState(false);

  const activeEvent = events.find(e => 
    String(e.Event_ID) === String(selectedEventId) || 
    String(e.event_id) === String(selectedEventId)
  ) || events[0];

  const activeVenue = venues.find(v => 
    String(v.Venue_ID) === String(activeEvent?.Venue_ID || activeEvent?.venue_id) || 
    String(v.venue_id) === String(activeEvent?.Venue_ID || activeEvent?.venue_id)
  );

  const activeCategory = categories.find(c => 
    String(c.Category_ID) === String(activeEvent?.Category_ID || activeEvent?.category_id) || 
    String(c.category_id) === String(activeEvent?.Category_ID || activeEvent?.category_id)
  );

  // Strict Event Admin check for the active event
  const hasAdminPower = isEventAdmin(activeEvent, currentUser);

  // Registrations for the selected active event
  const eventRegistrations = registrations.filter(r => 
    String(r.Event_ID) === String(activeEvent?.Event_ID || activeEvent?.event_id) ||
    String(r.event_id) === String(activeEvent?.Event_ID || activeEvent?.event_id)
  );
  
  const filteredRegistrations = eventRegistrations.filter(r => {
    const status = r.Registration_Status || r.registration_status;
    if (rosterFilter === 'ALL') return status !== 'Cancelled' && !r.is_cancelled;
    return status === rosterFilter;
  });

  // Helper to dynamically calculate active enrolled seats for any event
  const getEventEnrolledCount = (ev) => {
    if (!ev) return 0;
    const targetId = String(ev.Event_ID || ev.event_id);
    return registrations.filter(r => {
      const regEvtId = String(r.Event_ID || r.event_id);
      if (regEvtId !== targetId) return false;
      if (r.is_cancelled) return false;
      const status = r.Registration_Status || r.registration_status;
      return status === 'Enrolled';
    }).length;
  };

  // Calculate stats
  const totalEnrolledAcrossAll = registrations.filter(r => 
    !r.is_cancelled && (r.Registration_Status === 'Enrolled' || r.registration_status === 'Enrolled')
  ).length;
  const totalWaitlistAcrossAll = registrations.filter(r => 
    !r.is_cancelled && (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted')
  ).length;
  const totalRevenue = payments
    .filter(p => (p.Payment_Status === 'Verified' || p.payment_status === 'Verified'))
    .reduce((sum, p) => sum + Number(p.Amount || p.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Event Orchestration & Scheduling</h1>
            <p className="page-description">
              Manage venue capacities, supervise atomic waitlists, and configure ticketing tiers.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={onOpenCreateModal}
          >
            <Plus size={18} />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-text">
            <span className="stat-card-label">Active Events</span>
            <span className="stat-card-value">{events.length}</span>
            <span className="stat-card-sub">Across {venues.length} registered venues</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <Calendar size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-text">
            <span className="stat-card-label">Enrolled Attendees</span>
            <span className="stat-card-value">{totalEnrolledAcrossAll}</span>
            <span className="stat-card-sub">Active confirmed seats</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'var(--emerald-bg)', color: 'var(--emerald-text)' }}>
            <UserCheck size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-text">
            <span className="stat-card-label">Total Waitlisted</span>
            <span className="stat-card-value">{totalWaitlistAcrossAll}</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'var(--amber-bg)', color: 'var(--amber-text)' }}>
            <Clock3 size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-text">
            <span className="stat-card-label">Verified Revenue</span>
            <span className="stat-card-value">₹{totalRevenue.toLocaleString('en-IN')}</span>
            <span className="stat-card-sub">Direct UPI settlements</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Event Selector & Live Roster */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
        {/* Left: Event Selector List */}
        <div className="filter-card">
          <div className="filter-card-header">
            <span className="filter-card-title">Scheduled Events ({events.length})</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Select to manage</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '580px', overflowY: 'auto' }}>
            {events.map(ev => {
              const isSelected = String(ev.Event_ID || ev.event_id) === String(activeEvent?.Event_ID || activeEvent?.event_id);
              const isEventAdminForThis = isEventAdmin(ev, currentUser);
              const evVenue = venues.find(v => String(v.Venue_ID) === String(ev.Venue_ID || ev.venue_id) || String(v.venue_id) === String(ev.Venue_ID || ev.venue_id));
              const evRegs = registrations.filter(r => 
                (String(r.Event_ID) === String(ev.Event_ID || ev.event_id) || String(r.event_id) === String(ev.Event_ID || ev.event_id)) && 
                (r.Registration_Status === 'Enrolled' || r.registration_status === 'Enrolled')
              );

              return (
                <div
                  key={ev.Event_ID || ev.event_id}
                  onClick={() => setSelectedEventId(ev.Event_ID || ev.event_id)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {ev.Title || ev.title}
                      </span>
                      {isEventAdminForThis ? (
                        <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--emerald-bg)', color: 'var(--emerald-text)', fontWeight: 600 }}>
                          Admin
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                          Attendee
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{evVenue?.Venue_Name || evVenue?.venue_name || 'Main Hall'}</span>
                    <span>•</span>
                    <span>{getEventEnrolledCount(ev)} / {ev.Max_Capacity || ev.max_capacity} Seats</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Roster & Dynamic Promotion Demonstration */}
        {activeEvent && (
          <div className="table-card">
            <div className="table-header-bar">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 className="table-header-title">{activeEvent.Title || activeEvent.title}</h2>
                  {hasAdminPower ? (
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--emerald-bg)', color: 'var(--emerald-text)', fontWeight: 600 }}>
                      Administrative Access
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                      Standard Attendee View
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Venue: {activeVenue?.Venue_Name || activeVenue?.venue_name} (Max: {activeEvent.Max_Capacity || activeEvent.max_capacity} / Total: {activeVenue?.Total_Capacity || activeVenue?.total_capacity}) • Seats Filled: {getEventEnrolledCount(activeEvent)} / {activeEvent.Max_Capacity || activeEvent.max_capacity} • Contact: {activeEvent.admin_contact || '9876543210'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onSelectEvent(activeEvent)}
                  title="View Public Details"
                >
                  <ArrowUpRight size={13} />
                  <span>Preview</span>
                </button>
                {hasAdminPower && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteEvent(activeEvent.Event_ID || activeEvent.event_id)}
                    title="Delete Event"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Read-Only Notice if user is NOT an admin for this event */}
            {!hasAdminPower && (
              <div style={{ margin: '0.75rem 1.25rem', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Lock size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Standard Attendee View:</strong> You do not possess administrative permissions for "{activeEvent.Title || activeEvent.title}". Verifying payments, admitting waitlist members, and cancelling seats are restricted strictly to designated event admins.
                </span>
              </div>
            )}

            {/* Roster Controls & Filter */}
            <div style={{ padding: '0.65rem 1.25rem', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['ALL', 'Enrolled', 'Waitlisted', 'Pending_Payment'].map(status => (
                  <button
                    key={status}
                    className={`filter-chip ${rosterFilter === status ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => setRosterFilter(status)}
                  >
                    {status === 'ALL' ? 'All Registrations' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Requirement: Strict Access Control - Only admins can see Batch Waitlist Admission */}
              {hasAdminPower ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Admit Count:
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-input"
                    style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.78rem', height: '28px' }}
                    value={admitCount}
                    onChange={(e) => setAdmitCount(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    disabled={isAdmitting}
                    onClick={async () => {
                      setIsAdmitting(true);
                      await admitWaitlistedMembers({
                        eventId: activeEvent.Event_ID || activeEvent.event_id,
                        admitCount: parseInt(admitCount, 10) || 1
                      });
                      setIsAdmitting(false);
                    }}
                  >
                    <UserCheck size={13} />
                    <span>{isAdmitting ? 'Admitting...' : 'Admit Members'}</span>
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Viewing in Attendee Mode
                </span>
              )}

              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Showing <strong>{filteredRegistrations.length}</strong> entries
              </span>
            </div>

            {/* Registrations Table */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User / Attendee</th>
                    <th>Email / Phone</th>
                    <th>Status</th>
                    <th>Waitlist Pos</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No registrations found under this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map(reg => {
                      const user = users.find(u => 
                        String(u.User_ID) === String(reg.User_ID || reg.user_id) || 
                        String(u.user_id) === String(reg.user_id || reg.User_ID)
                      );
                      const payment = payments.find(p => 
                        String(p.Registration_ID) === String(reg.Registration_ID || reg.registration_id) || 
                        String(p.registration_id) === String(reg.registration_id || reg.Registration_ID)
                      );

                      const regStatus = reg.Registration_Status || reg.registration_status;

                      return (
                        <tr key={reg.Registration_ID || reg.registration_id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <img
                                src={user?.Avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                                alt={user?.Full_Name || user?.full_name}
                                style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.Full_Name || user?.full_name || 'Unknown User'}</span>
                                <span className="table-cell-mono">{reg.Registration_ID || reg.registration_id}</span>
                              </div>
                            </div>
                          </td>

                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div>{user?.Email || user?.email}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user?.Phone || user?.phone}</div>
                          </td>

                          <td>
                            {regStatus === 'Enrolled' && (
                              <span className="status-pill status-enrolled">Enrolled</span>
                            )}
                            {regStatus === 'Waitlisted' && (
                              <span className="status-pill status-waitlisted">Waitlisted</span>
                            )}
                            {regStatus === 'Pending_Payment' && (
                              <span className="status-pill status-pending">Pending Payment</span>
                            )}
                            {regStatus === 'Rejected' && (
                              <span className="status-pill status-cancelled">Cancelled</span>
                            )}
                          </td>

                          <td>
                            {(reg.Waitlist_Position || reg.waitlist_position) ? (
                              <span style={{ fontWeight: 600, color: 'var(--amber-text)' }}>
                                #{reg.Waitlist_Position || reg.waitlist_position}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-dim)' }}>—</span>
                            )}
                          </td>

                          <td>
                            {payment ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                                <span
                                  className={`status-pill ${
                                    (payment.Payment_Status === 'Verified' || payment.payment_status === 'Verified') ? 'status-enrolled' : 'status-pending'
                                  }`}
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  {payment.Payment_Status || payment.payment_status} (₹{payment.Amount || payment.amount})
                                </span>
                                {(payment.Transaction_Reference || payment.transaction_reference) && (
                                  <span
                                    style={{
                                      fontSize: '0.74rem',
                                      fontFamily: 'monospace',
                                      color: 'var(--text-secondary)'
                                    }}
                                    title="Transaction ID / UPI Reference"
                                  >
                                    Txn ID: {payment.Transaction_Reference || payment.transaction_reference}
                                  </span>
                                )}
                              </div>
                            ) : Number(activeEvent.Ticket_Price || activeEvent.ticket_price) === 0 ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Free Event</span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--rose-text)' }}>Unpaid</span>
                            )}
                          </td>

                          <td>
                            {/* Strict Access Control: Admin buttons ONLY for event admins */}
                            {hasAdminPower ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {/* Verify or Reject Payment buttons */}
                                {payment && (payment.Payment_Status === 'Pending' || payment.payment_status === 'Pending') && (
                                  <>
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => verifyPayment(payment.Payment_ID || payment.payment_id, true)}
                                      title="Verify payment and confirm enrollment"
                                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                      <CheckCircle size={12} />
                                      <span>Verify</span>
                                    </button>
                                    <button
                                      className="btn btn-outline btn-sm"
                                      onClick={() => verifyPayment(payment.Payment_ID || payment.payment_id, false)}
                                      title="Reject payment and promote next in line from waitlist"
                                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem', color: '#ef4444', borderColor: '#fee2e2', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                      <XCircle size={12} />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}

                                {/* Cancel Seat button with prompt/modal */}
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => {
                                    setCancellingSeatTarget({ reg, user, event: activeEvent });
                                    setCancelReasonInput('Seat cancelled by event administrator');
                                  }}
                                  title="Cancel seat and trigger automatic waitlist promotion"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                >
                                  <UserX size={12} />
                                  <span>Cancel Seat</span>
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Read-only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Atomic Waitlist Engine Explainer Banner */}
            <div style={{ margin: '0.85rem', padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                <RefreshCw size={14} color="var(--text-primary)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Atomic Dynamic Promotion Trigger & Access Policy
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Administrative privileges are strictly restricted to the event organizer and co-admins configured in <code>admin_event_ids</code>. When an <strong>Enrolled</strong> attendee's seat is cancelled, the backend trigger immediately promotes <strong>Waitlist Position #1</strong> and stores the cancellation explanation for attendee notification.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Reason Modal */}
      {cancellingSeatTarget && (
        <div className="modal-backdrop" onClick={() => setCancellingSeatTarget(null)}>
          <div className="modal-card modal-card-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={18} color="var(--rose-text, #f43f5e)" />
                <h3 className="modal-title">Revoke Attendee Seat</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setCancellingSeatTarget(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsCancellingSeat(true);
              const contact = activeEvent.admin_contact || activeEvent.Admin_Contact || currentUser?.Phone || currentUser?.phone || '9876543210';
              await cancelRegistrationSeat({
                registrationId: cancellingSeatTarget.reg.Registration_ID || cancellingSeatTarget.reg.registration_id,
                adminContact: contact,
                reason: cancelReasonInput.trim() || 'Seat cancelled by event administrator'
              });
              setIsCancellingSeat(false);
              setCancellingSeatTarget(null);
            }}>
              <div className="modal-body">
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  You are revoking the reservation for <strong>{cancellingSeatTarget.user?.Full_Name || cancellingSeatTarget.user?.full_name || 'Attendee'}</strong> (Registration ID: <code>{cancellingSeatTarget.reg.Registration_ID || cancellingSeatTarget.reg.registration_id}</code>).
                </p>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Reason for Cancellation (Required)
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. Failure to submit verified payment / Capacity adjustment / Policy violation"
                    value={cancelReasonInput}
                    onChange={(e) => setCancelReasonInput(e.target.value)}
                    required
                  />
                  <span className="form-hint">
                    This explanation will be stored and presented to the attendee in their cancellation notification.
                  </span>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <strong>Helpline Contact:</strong> {activeEvent.admin_contact || activeEvent.Admin_Contact || currentUser?.Phone || '9876543210'}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCancellingSeatTarget(null)}
                  disabled={isCancellingSeat}
                >
                  Keep Seat
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isCancellingSeat || !cancelReasonInput.trim()}
                >
                  {isCancellingSeat ? 'Revoking Seat...' : 'Revoke Seat & Notify Attendee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
