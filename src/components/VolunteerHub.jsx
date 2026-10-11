import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSupabaseClient } from '../lib/supabaseClient';
import {
  Users,
  ShieldCheck,
  Calendar,
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  MapPin,
  Tag,
  Phone,
  X,
  AlertTriangle
} from 'lucide-react';

export const VolunteerHub = () => {
  const {
    events,
    users,
    venues,
    eventVolunteers,
    assignVolunteer,
    removeVolunteerAssignment,
    currentUser,
    volunteerNotifications,
    markVolunteerNotificationRead
  } = useApp();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.Event_ID || '');
  const [selectedUserId, setSelectedUserId] = useState(users.find(u => u.Role === 'Volunteer')?.User_ID || users[0]?.User_ID || '');
  const [assignedRole, setAssignedRole] = useState('Registration Desk & Crowd Control');
  const [customRole, setCustomRole] = useState('');

  // Admin deletion with message modal state
  const [removingTarget, setRemovingTarget] = useState(null); // { asg, event, volUser }
  const [removalReasonInput, setRemovalReasonInput] = useState('Duty reassigned by event administrator');
  const [isSubmittingRemoval, setIsSubmittingRemoval] = useState(false);

  const myDismissalNotifications = (volunteerNotifications || []).filter(n =>
    String(n.user_id) === String(currentUser?.User_ID || currentUser?.user_id) && !n.read
  );

  // Requirement 4: Query event_volunteer joined with "USER"
  const [supabaseVolunteers, setSupabaseVolunteers] = useState([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);

  useEffect(() => {
    const fetchVolunteers = async () => {
      const client = getSupabaseClient();
      if (!client) return;

      setIsLoadingSupabase(true);
      try {
        // Query event_volunteer joined with users table
        const { data: usersData, error: uErr } = await client
          .from('event_volunteer')
          .select('assigned_role, event(title), users(full_name, phone)');

        if (usersData && !uErr && usersData.length > 0) {
          setSupabaseVolunteers(usersData.map(v => ({
            assigned_role: v.assigned_role,
            event: v.event,
            users: v.users || { full_name: 'Field Volunteer', phone: '9876543213' }
          })));
        }
      } catch (err) {
        console.error('Supabase volunteer join notice:', err);
      } finally {
        setIsLoadingSupabase(false);
      }
    };

    fetchVolunteers();
  }, []);

  const volunteerUsers = users.filter(u => u.Role === 'Volunteer' || u.Role === 'Attendee');

  const predefinedRoles = [
    'Registration Desk & Crowd Control',
    'Technical Lead & AV Coordinator',
    'Stage Manager',
    'Hospitality & Logistics Coordinator',
    'Security & Emergency Protocol',
    'Social Media & Live Coverage',
    'Custom Role...'
  ];

  // Assemble unified list of volunteer contacts (Name & Phone Number)
  // Strictly derived from active eventVolunteers assignments so that removing a volunteer immediately removes them from this contacts table
  const volunteerContacts = (() => {
    const contactMap = new Map();

    // All active volunteers currently assigned in eventVolunteers
    eventVolunteers.forEach(asg => {
      const u = users.find(user => String(user.User_ID || user.user_id) === String(asg.User_ID || asg.user_id));
      if (u) {
        const name = u.Full_Name || u.full_name;
        const phone = u.Phone || u.phone;
        const key = String(u.User_ID || u.user_id || name).toLowerCase();
        if (!contactMap.has(key)) {
          contactMap.set(key, { name, phone: phone || 'No phone recorded' });
        }
      }
    });

    return Array.from(contactMap.values());
  })();

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const finalRole = assignedRole === 'Custom Role...' ? customRole : assignedRole;
    if (!finalRole.trim()) return;

    assignVolunteer({
      eventId: selectedEventId,
      userId: selectedUserId,
      assignedRole: finalRole
    });

    setIsAssignModalOpen(false);
    setCustomRole('');
  };

  const handleQuickVolunteer = (eventId) => {
    assignVolunteer({
      eventId,
      userId: currentUser.User_ID,
      assignedRole: 'General Event Support & Logistics'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Volunteer Allocation Hub</h1>
            <p className="page-description">
              Assign operational duties, manage stage coordinators, and coordinate event field teams.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setIsAssignModalOpen(true)}
          >
            <Plus size={18} />
            <span>Assign Volunteer Duty</span>
          </button>
        </div>
      </div>

      {/* Volunteer Duty Removal Notification Banners */}
      {myDismissalNotifications.length > 0 && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {myDismissalNotifications.map(n => (
            <div
              key={n.id}
              style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                padding: '0.9rem 1.1rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <AlertTriangle size={18} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#991b1b' }}>
                    Volunteer Assignment Removed — {n.event_title}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: '#7f1d1d' }}>
                    <strong>Reason from Coordinator:</strong> {n.reason}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#b91c1c', marginTop: '0.25rem' }}>
                    Duty Role: {n.role} • {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', background: '#ffffff', borderColor: '#fca5a5', color: '#991b1b', flexShrink: 0 }}
                onClick={() => markVolunteerNotificationRead(n.id)}
              >
                Mark as Read
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Volunteer Contacts Table */}
      <div className="table-card" style={{ marginBottom: '1.75rem' }}>
        <div className="table-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} />
            <h3 className="table-header-title">Volunteer Contacts</h3>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Volunteer Name</th>
                <th>Phone Number</th>
              </tr>
            </thead>
            <tbody>
              {volunteerContacts.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    No volunteer contacts recorded.
                  </td>
                </tr>
              ) : (
                volunteerContacts.map((contact, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {contact.name}
                      </span>
                    </td>
                    <td>
                      {contact.phone && contact.phone !== 'No phone recorded' ? (
                        <a
                          href={`tel:${contact.phone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            textDecoration: 'underline'
                          }}
                        >
                          <Phone size={12} color="var(--emerald-text)" />
                          {contact.phone}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No phone recorded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volunteer Duty Matrix & Assigned Staff */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {events.map(event => {
          const venue = venues.find(v => v.Venue_ID === event.Venue_ID);
          const assignments = eventVolunteers.filter(v => 
            String(v.Event_ID || v.event_id) === String(event.Event_ID || event.event_id)
          );
          const isCurrentUserAssigned = assignments.some(a => 
            String(a.User_ID || a.user_id) === String(currentUser.User_ID || currentUser.user_id)
          );

          // Head of this particular event (Organizer of this event, or co-admin in admin_event_ids, or system Admin)
          const isEventHead = 
            String(event.Organizer_ID || event.organizer_id) === String(currentUser.User_ID || currentUser.user_id) ||
            currentUser.admin_event_ids?.map(String).includes(String(event.Event_ID || event.event_id)) ||
            currentUser.Role === 'Admin' || currentUser.role === 'Admin';

          // Volunteer for this particular event
          const isThisEventsVolunteer = isCurrentUserAssigned;

          // Power to remove volunteers from this event:
          // Strictly restricted to that particular event's volunteer and head
          const canManageEventVolunteers = isEventHead || isThisEventsVolunteer;

          return (
            <div key={event.Event_ID} className="event-card">
              <div className="card-header-bar">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', fontWeight: 600, color: 'var(--bronze-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Briefcase size={13} />
                  <span>{assignments.length} Volunteer{assignments.length === 1 ? '' : 's'} Assigned</span>
                </span>

                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {new Date(event.Event_Date).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h3 className="event-card-title">{event.Title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <MapPin size={13} />
                  <span>{venue?.Venue_Name}</span>
                </div>
              </div>

              {/* Roster of Volunteers for this event */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Allocated Operational Staff
                </div>

                {assignments.length === 0 ? (
                  <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px dashed var(--border-subtle)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    No volunteers assigned yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {assignments.map(asg => {
                      const volUser = users.find(u => 
                        String(u.User_ID || u.user_id) === String(asg.User_ID || asg.user_id)
                      );
                      const phone = volUser?.Phone || volUser?.phone;

                      return (
                        <div
                          key={asg.Assignment_ID || asg.assignment_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-subtle)',
                            padding: '0.5rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img
                              src={volUser?.Avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                              alt={volUser?.Full_Name || volUser?.full_name}
                              style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                            />
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {volUser?.Full_Name || volUser?.full_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>{asg.Assigned_Role}</span>
                                {phone && (
                                  <>
                                    <span>•</span>
                                    <a
                                      href={`tel:${phone}`}
                                      style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}
                                    >
                                      {phone}
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {canManageEventVolunteers && (
                            <button
                              onClick={() => {
                                setRemovingTarget({ asg, event, volUser });
                                setRemovalReasonInput('Duty reassigned by event coordinator');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                transition: 'all 0.15s'
                              }}
                              title="Remove volunteer from this event"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                {isCurrentUserAssigned ? (
                  <div
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      background: 'var(--emerald-bg)',
                      border: '1px solid var(--emerald-border)',
                      borderRadius: '6px',
                      color: 'var(--emerald-text)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>You are assigned as a Volunteer</span>
                  </div>
                ) : (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => handleQuickVolunteer(event.Event_ID)}
                  >
                    <ShieldCheck size={14} color="var(--text-primary)" />
                    <span>Volunteer for this Event</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Volunteer Modal */}
      {isAssignModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Allocate Volunteer Duty</h3>
              <button className="modal-close-btn" onClick={() => setIsAssignModalOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Event</label>
                  <select
                    className="form-select"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    required
                  >
                    {events.map(e => (
                      <option key={e.Event_ID} value={e.Event_ID}>
                        {e.Title} ({new Date(e.Event_Date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Volunteer / User</label>
                  <select
                    className="form-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    {volunteerUsers.map(u => (
                      <option key={u.User_ID} value={u.User_ID}>
                        {u.Full_Name} ({u.Role} - {u.Email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Operational Role</label>
                  <select
                    className="form-select"
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                  >
                    {predefinedRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {assignedRole === 'Custom Role...' && (
                  <div className="form-group">
                    <label className="form-label">Custom Role Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. VIP Escort Lead"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Removal Confirmation & Reason Modal */}
      {removingTarget && (
        <div className="modal-backdrop" onClick={() => setRemovingTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Remove Volunteer Duty</h3>
              <button className="modal-close-btn" onClick={() => setRemovingTarget(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isSubmittingRemoval) return;
              setIsSubmittingRemoval(true);
              await removeVolunteerAssignment(
                removingTarget.asg.Assignment_ID || removingTarget.asg.assignment_id,
                removalReasonInput.trim()
              );
              setIsSubmittingRemoval(false);
              setRemovingTarget(null);
            }}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {removingTarget.volUser?.Full_Name || removingTarget.volUser?.full_name || 'Volunteer'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Event: {removingTarget.event?.Title} • Role: {removingTarget.asg.Assigned_Role}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Reason for Removal</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={removalReasonInput}
                    onChange={(e) => setRemovalReasonInput(e.target.value)}
                    placeholder="Explain why this volunteer is being removed (notification to user)..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setRemovingTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={isSubmittingRemoval || !removalReasonInput.trim()}>
                  {isSubmittingRemoval ? 'Removing...' : 'Confirm Removal & Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
