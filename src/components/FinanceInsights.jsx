import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { isEventAdmin } from '../lib/accessControl';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  Search,
  Receipt,
  Phone,
  Calendar,
  Layers,
  RefreshCw
} from 'lucide-react';

export const FinanceInsights = () => {
  const {
    payments,
    registrations,
    events,
    allEvents,
    users,
    venues,
    verifyPayment,
    currentUser
  } = useApp();

  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Verified' | 'Failed'
  const [searchTerm, setSearchTerm] = useState('');

  // Financial KPI Calculations
  const verifiedPayments = payments.filter(p => p.Payment_Status === 'Verified' || p.payment_status === 'Verified');
  const pendingPayments = payments.filter(p => p.Payment_Status === 'Pending' || p.payment_status === 'Pending');

  const pendingRegistrations = registrations.filter(r => {
    if (r.is_cancelled) return false;
    const status = r.Registration_Status || r.registration_status;
    if (status === 'Pending_Payment') return true;
    const p = payments.find(pay => 
      String(pay.Registration_ID || pay.registration_id) === String(r.Registration_ID || r.registration_id)
    );
    return p && (p.Payment_Status === 'Pending' || p.payment_status === 'Pending');
  });
  const pendingPeopleCount = pendingRegistrations.length;

  const totalVerifiedRevenue = verifiedPayments.reduce((sum, p) => sum + Number(p.Amount || p.amount || 0), 0);
  const totalPendingRevenue = pendingPayments.reduce((sum, p) => sum + Number(p.Amount || p.amount || 0), 0);

  // Live computation matching view_finance_and_insights schema with reactive updates (instant synchronous sync with top KPI)
  const insightsViewData = events.map(evt => {
    const evtId = evt.Event_ID || evt.event_id;
    const evtRegs = registrations.filter(r => 
      (String(r.Event_ID) === String(evtId) || String(r.event_id) === String(evtId)) && 
      !r.is_cancelled
    );
    const evtRegIds = new Set(evtRegs.map(r => String(r.Registration_ID || r.registration_id)));

    // Pending count directly synchronized with pendingRegistrations list
    const pendingCount = pendingRegistrations.filter(r => 
      String(r.Event_ID || r.event_id) === String(evtId)
    ).length;

    // Verified revenue for this specific event
    const verifiedEvtPayments = payments.filter(p => {
      const isVerified = p.Payment_Status === 'Verified' || p.payment_status === 'Verified';
      if (!isVerified) return false;
      if (evtRegIds.has(String(p.Registration_ID || p.registration_id))) return true;
      if (p.Event_ID && String(p.Event_ID) === String(evtId)) return true;
      if (p.event_id && String(p.event_id) === String(evtId)) return true;
      return false;
    });
    const eventRevenue = verifiedEvtPayments.reduce((sum, p) => sum + Number(p.Amount || p.amount || 0), 0);

    const verifiedWithDate = verifiedEvtPayments
      .filter(p => p.Verified_At || p.verified_at)
      .sort((a, b) => new Date(b.Verified_At || b.verified_at) - new Date(a.Verified_At || a.verified_at));

    const org = users.find(u => String(u.User_ID) === String(evt.Organizer_ID || evt.organizer_id));

    return {
      event_id: evtId,
      event_title: evt.Title || evt.title,
      organizer_name: org?.Full_Name || org?.full_name || 'Campus Lead',
      admin_contact_number: evt.admin_contact || evt.Admin_Contact || '9876543210',
      revenue: eventRevenue,
      pending_verifications_count: pendingCount,
      last_verification_time: verifiedWithDate[0]?.Verified_At || verifiedWithDate[0]?.verified_at || null
    };
  });

  const filteredViewData = insightsViewData.filter(item => {
    const title = (item.event_title || '').toLowerCase();
    const org = (item.organizer_name || '').toLowerCase();
    const s = searchTerm.toLowerCase();
    return title.includes(s) || org.includes(s);
  });

  const filteredPayments = payments.filter(p => {
    const reg = registrations.find(r => String(r.Registration_ID) === String(p.Registration_ID) || String(r.registration_id) === String(p.registration_id));
    const user = users.find(u => String(u.User_ID) === String(reg?.User_ID || reg?.user_id));
    const event = (allEvents || events).find(e => String(e.Event_ID) === String(reg?.Event_ID || reg?.event_id));

    const status = p.Payment_Status || p.payment_status;
    const matchesFilter = paymentFilter === 'ALL' || status === paymentFilter;
    const s = searchTerm.toLowerCase();
    const ref = (p.Transaction_Reference || p.transaction_reference || '').toLowerCase();
    const userName = (user?.Full_Name || user?.full_name || '').toLowerCase();
    const eventName = (event?.Title || event?.title || '').toLowerCase();

    return matchesFilter && (ref.includes(s) || userName.includes(s) || eventName.includes(s));
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Finance & Insights Dashboard</h1>
            <p className="page-description">
              Supervise transactional settlements, audit fee receipts, and monitor the PostgreSQL database view.
            </p>
          </div>

          <div className="search-input-box">
            <Search size={16} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search event or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-text">
            <span className="stat-card-label">Pending Verifications</span>
            <span className="stat-card-value">{pendingPeopleCount} {pendingPeopleCount === 1 ? 'Person' : 'People'}</span>
            <span className="stat-card-sub">₹{totalPendingRevenue.toLocaleString()} Awaiting Approval</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'var(--amber-bg)', color: 'var(--amber-text)' }}>
            <Clock size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-text">
            <span className="stat-card-label">Monitored Events</span>
            <span className="stat-card-value">{insightsViewData.length}</span>
            <span className="stat-card-sub">Active Scheduled Events</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <Layers size={20} />
          </div>
        </div>
      </div>

      {/* PostgreSQL Database View Table: view_finance_and_insights */}
      <div className="table-card" style={{ marginBottom: '1.75rem' }}>
        <div className="table-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} />
            <h3 className="table-header-title">Event Finance & Insights Summary</h3>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Organizer</th>
                <th>Admin Helpline</th>
                <th>Verified Revenue</th>
                <th>Pending Verifications</th>
                <th>Last Verification Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredViewData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No event insight records found.
                  </td>
                </tr>
              ) : (
                filteredViewData.map((row, idx) => {
                  const lastTimeFormatted = row.last_verification_time
                    ? new Date(row.last_verification_time).toLocaleString()
                    : 'None yet';

                  return (
                    <tr key={row.event_id || idx}>
                      {/* Event Name (event_title) */}
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {row.event_title}
                        </span>
                      </td>

                      {/* Organizer (organizer_name) */}
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {row.organizer_name || 'Staff Lead'}
                      </td>

                      {/* Admin Helpline (admin_contact_number) */}
                      <td>
                        {row.admin_contact_number ? (
                          <a
                            href={`tel:${row.admin_contact_number}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              textDecoration: 'underline'
                            }}
                          >
                            <Phone size={12} color="var(--emerald-text)" />
                            {row.admin_contact_number}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>

                      {/* Verified Revenue */}
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--emerald-text)', fontSize: '0.84rem' }}>
                          ₹{Number(row.revenue || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Pending Verifications (pending_verifications_count) */}
                      <td>
                        <span
                          className={`status-pill ${
                            row.pending_verifications_count > 0 ? 'status-pending' : 'status-enrolled'
                          }`}
                          style={{ fontSize: '0.82rem' }}
                        >
                          {row.pending_verifications_count} Pending
                        </span>
                      </td>

                      {/* Last Verification Time (last_verification_time) */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {lastTimeFormatted}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Transaction Verification Queue with Action Buttons */}
      <div className="table-card">
        <div className="table-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={16} />
            <h3 className="table-header-title">Live Transaction Queue & Verifications</h3>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['ALL', 'Pending', 'Verified', 'Failed'].map(status => (
              <button
                key={status}
                className={`filter-chip ${paymentFilter === status ? 'active' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                onClick={() => setPaymentFilter(status)}
              >
                {status === 'ALL' ? 'All Transactions' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn Reference & Payment ID</th>
                <th>Attendee</th>
                <th>Event</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Verified At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No payment records found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => {
                  const reg = registrations.find(r => String(r.Registration_ID) === String(payment.Registration_ID) || String(r.registration_id) === String(payment.registration_id));
                  const user = users.find(u => String(u.User_ID) === String(reg?.User_ID || reg?.user_id));
                  const event = events.find(e => String(e.Event_ID) === String(reg?.Event_ID || reg?.event_id));
                  const status = payment.Payment_Status || payment.payment_status;

                  return (
                    <tr key={payment.Payment_ID || payment.payment_id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {payment.Transaction_Reference || payment.transaction_reference}
                          </span>
                          <span className="table-cell-mono">{payment.Payment_ID || payment.payment_id}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img
                            src={user?.Avatar || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                            alt={user?.Full_Name || user?.full_name}
                            style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.Full_Name || user?.full_name || 'Unknown User'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.Email || user?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {event?.Title || event?.title || 'Event'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          ₹{payment.Amount || payment.amount}
                        </span>
                      </td>

                      <td>
                        {status === 'Verified' && (
                          <span className="status-pill status-enrolled">
                            <CheckCircle2 size={13} />
                            Verified
                          </span>
                        )}
                        {status === 'Pending' && (
                          <span className="status-pill status-pending">
                            <Clock size={13} />
                            Pending Verification
                          </span>
                        )}
                        {status === 'Failed' && (
                          <span className="status-pill status-cancelled">
                            <XCircle size={13} />
                            Failed
                          </span>
                        )}
                      </td>

                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {(payment.Verified_At || payment.verified_at) ? new Date(payment.Verified_At || payment.verified_at).toLocaleString() : '—'}
                      </td>

                      <td>
                        {status === 'Pending' ? (
                          isEventAdmin(event, currentUser) ? (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => verifyPayment(payment.Payment_ID || payment.payment_id, true)}
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              >
                                <CheckCircle2 size={13} />
                                <span>Verify & Enroll</span>
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => verifyPayment(payment.Payment_ID || payment.payment_id, false)}
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              >
                                <XCircle size={13} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                              Admin only
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
