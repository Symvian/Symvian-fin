import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_USERS,
  INITIAL_VENUES,
  INITIAL_CATEGORIES,
  INITIAL_EVENTS,
  INITIAL_REGISTRATIONS,
  INITIAL_PAYMENTS,
  INITIAL_VOLUNTEERS
} from '../data/initialData';
import { getSupabaseClient, testSupabaseConnection } from '../lib/supabaseClient';
import { isEventAdmin } from '../lib/accessControl';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Persistence key prefix
  const STORAGE_KEY = 'SYMVIAN_APP_STATE_V1';

  // Load initial or persisted state
  const loadInitialState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingEmails = new Set((parsed.users || []).map(u => (u.Email || '').toLowerCase()));
        const missingUsers = INITIAL_USERS.filter(u => !existingEmails.has(u.Email.toLowerCase()));
        const mergedUsers = [...missingUsers, ...(parsed.users || [])].map(u => {
          const seedMatch = INITIAL_USERS.find(iu => iu.Email.toLowerCase() === (u.Email || '').toLowerCase());
          return {
            ...u,
            admin_event_ids: u.admin_event_ids || seedMatch?.admin_event_ids || []
          };
        });
        return {
          ...parsed,
          users: mergedUsers
        };
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    return {
      users: INITIAL_USERS,
      venues: INITIAL_VENUES,
      categories: INITIAL_CATEGORIES,
      events: INITIAL_EVENTS,
      registrations: INITIAL_REGISTRATIONS,
      payments: INITIAL_PAYMENTS,
      eventVolunteers: INITIAL_VOLUNTEERS
    };
  };

  const initial = loadInitialState();

  const [users, setUsers] = useState(initial.users);
  const [venues, setVenues] = useState(initial.venues);
  const [categories, setCategories] = useState(initial.categories);
  const [events, setEvents] = useState(initial.events);
  const [registrations, setRegistrations] = useState(initial.registrations);
  const [payments, setPayments] = useState(initial.payments);
  const [eventVolunteers, setEventVolunteers] = useState(initial.eventVolunteers);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('discover');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const savedSession = localStorage.getItem('SYMVIAN_AUTH_SESSION');
      return !!savedSession;
    } catch {
      return false;
    }
  });

  // Active user ID (from saved session or default)
  const [currentUserId, setCurrentUserId] = useState(() => {
    try {
      const savedSession = localStorage.getItem('SYMVIAN_AUTH_SESSION');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.userId) return parsed.userId;
      }
    } catch {
      // ignore
    }
    return initial.users[0]?.User_ID || 'usr_001';
  });

  // Supabase Configuration state with default project credentials
  const [supabaseConfig, setSupabaseConfig] = useState({
    url: 'https://efgulsgqbkqzcdmuycgg.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZ3Vsc2dxYmtxemNkbXV5Y2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTYwODksImV4cCI6MjEwNzEzMjA4OX0.o1Cl_d-uuwEHyLsW-BZr6ONzbN2LGYQRmbt7xhDqqVg',
    isConnected: true,
    syncMode: 'live'
  });

  // Toast Notification System
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Persistent Volunteer Dismissal Notifications
  const [volunteerNotifications, setVolunteerNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('SYMVIAN_VOLUNTEER_NOTIFICATIONS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('SYMVIAN_VOLUNTEER_NOTIFICATIONS', JSON.stringify(volunteerNotifications));
    } catch (e) {
      console.warn('Failed to persist volunteer notifications:', e);
    }
  }, [volunteerNotifications]);

  const markVolunteerNotificationRead = (notificationId) => {
    setVolunteerNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  // Save changes to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        users,
        venues,
        categories,
        events,
        registrations,
        payments,
        eventVolunteers
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to persist to localStorage:', e);
    }
  }, [users, venues, categories, events, registrations, payments, eventVolunteers]);

  // Current active user object
  const currentUser = users.find(u => u.User_ID === currentUserId) || users[0];

  // Update current user state and persist session
  const setCurrentUser = (updater) => {
    setUsers(prevUsers => {
      const current = prevUsers.find(u => u.User_ID === currentUserId || String(u.user_id) === String(currentUserId)) || prevUsers[0];
      const updated = typeof updater === 'function' ? updater(current) : updater;
      const newUsers = prevUsers.map(u => (u.User_ID === current.User_ID ? { ...u, ...updated } : u));

      try {
        const saved = localStorage.getItem('SYMVIAN_AUTH_SESSION');
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem('SYMVIAN_AUTH_SESSION', JSON.stringify({ ...parsed, ...updated }));
        }
      } catch (e) {
        console.warn('Failed to update session:', e);
      }

      return newUsers;
    });
  };

  // Helper getters
  const getUserRegistrations = (userId) => {
    return registrations.filter(r => r.User_ID === userId && r.Registration_Status !== 'Cancelled');
  };

  const getEventRegistrations = (eventId) => {
    return registrations.filter(r => r.Event_ID === eventId);
  };

  const getEventWaitlist = (eventId) => {
    return registrations
      .filter(r => r.Event_ID === eventId && r.Registration_Status === 'Waitlisted')
      .sort((a, b) => (a.Waitlist_Position || 999) - (b.Waitlist_Position || 999));
  };

  const getUserEventRegistration = (eventId, userId) => {
    return registrations.find(r => 
      (String(r.Event_ID) === String(eventId) || String(r.event_id) === String(eventId)) && 
      (String(r.User_ID) === String(userId) || String(r.user_id) === String(userId)) && 
      r.Registration_Status !== 'Cancelled' &&
      r.registration_status !== 'Cancelled'
    );
  };

  const getRegistrationPayment = (registrationId) => {
    return payments.find(p => p.Registration_ID === registrationId);
  };

  // =========================================================================
  // CORE BUSINESS LOGIC & ATOMIC OPERATIONS
  // =========================================================================

  // 1. ATOMIC EVENT REGISTRATION
  const registerForEvent = ({ eventId, userId, paymentData = null }) => {
    const event = events.find(e => e.Event_ID === eventId);
    const user = users.find(u => u.User_ID === userId);

    if (!event) {
      addToast('Registration Failed', 'Event not found in system.', 'error');
      return { success: false, error: 'Event not found' };
    }

    if (event.Status === 'Cancelled' || event.Status === 'Completed') {
      addToast('Event Unavailable', `Cannot register for a ${event.Status.toLowerCase()} event.`, 'error');
      return { success: false, error: 'Event is not active' };
    }

    // Business Rule 2: Registration Uniqueness (Event_ID, User_ID)
    const existing = getUserEventRegistration(eventId, userId);
    if (existing) {
      addToast(
        'Already Registered',
        `You already hold an active registration (${existing.Registration_Status}${existing.Waitlist_Position ? ` #${existing.Waitlist_Position}` : ''}) for this event.`,
        'warning'
      );
      return { success: false, error: 'Duplicate registration constraint violated', existing };
    }

    const regId = 'reg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const isFree = Number(event.Ticket_Price) === 0;

    // Capacity Control & Dynamic Waitlist logic
    if (event.Current_Enrolled < event.Max_Capacity) {
      // Seat available
      if (isFree) {
        const pastReg = registrations.find(r => 
          (String(r.Event_ID) === String(eventId) || String(r.event_id) === String(eventId)) && 
          (String(r.User_ID) === String(userId) || String(r.user_id) === String(userId))
        );
        const retryCount = pastReg ? (pastReg.retry_count || 0) : 0;

        // Direct Enrollment
        const newReg = {
          Registration_ID: regId,
          Event_ID: eventId,
          User_ID: userId,
          Registration_Status: 'Enrolled',
          Waitlist_Position: null,
          Registered_At: new Date().toISOString(),
          retry_count: retryCount
        };

        setRegistrations(prev => [...prev, newReg]);
        setEvents(prev => prev.map(e => 
          (String(e.Event_ID) === String(eventId) || String(e.event_id) === String(eventId))
            ? { 
                ...e, 
                Current_Enrolled: (Number(e.Current_Enrolled ?? e.current_enrolled ?? 0) + 1),
                current_enrolled: (Number(e.current_enrolled ?? e.Current_Enrolled ?? 0) + 1)
              } 
            : e
        ));

        addToast(
          'Registration Confirmed',
          `Successfully enrolled in "${event.Title}". Your seat is reserved.`,
          'success'
        );
        return { success: true, registration: newReg, status: 'Enrolled' };
      } else {
        // Paid Event -> Pending Payment
        const newReg = {
          Registration_ID: regId,
          Event_ID: eventId,
          User_ID: userId,
          Registration_Status: paymentData?.verified ? 'Enrolled' : 'Pending_Payment',
          Waitlist_Position: null,
          Registered_At: new Date().toISOString()
        };

        const paymentId = 'pay_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
        const txnRef = paymentData?.txnRef || 'TXN_' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const newPayment = {
          Payment_ID: paymentId,
          Registration_ID: regId,
          Amount: Number(event.Ticket_Price),
          Payment_Status: paymentData?.verified ? 'Verified' : 'Pending',
          Transaction_Reference: txnRef,
          Verified_At: paymentData?.verified ? new Date().toISOString() : null
        };

        setRegistrations(prev => [...prev, newReg]);
        setPayments(prev => [...prev, newPayment]);

        if (paymentData?.verified) {
          setEvents(prev => prev.map(e => e.Event_ID === eventId ? { ...e, Current_Enrolled: e.Current_Enrolled + 1 } : e));
          addToast('Payment Confirmed', `Payment of ₹${event.Ticket_Price} verified. Seat confirmed for "${event.Title}".`, 'success');
        } else {
          addToast('Payment Initiated', `Registration created. Awaiting payment verification for ₹${event.Ticket_Price}.`, 'info');
        }

        return { success: true, registration: newReg, payment: newPayment, status: newReg.Registration_Status };
      }
    } else {
      // Capacity Reached -> Dynamic Waitlist Allocation
      const currentWaitlist = getEventWaitlist(eventId);
      const nextPosition = currentWaitlist.length + 1;

      const waitlistReg = {
        Registration_ID: regId,
        Event_ID: eventId,
        User_ID: userId,
        Registration_Status: 'Waitlisted',
        Waitlist_Position: nextPosition,
        Registered_At: new Date().toISOString()
      };

      setRegistrations(prev => [...prev, waitlistReg]);

      addToast(
        'Added to Waitlist Queue',
        `Max capacity reached (${event.Max_Capacity}/${event.Max_Capacity}). You are at Waitlist Position #${nextPosition}. You will be automatically enrolled if a seat frees up.`,
        'warning'
      );
      return { success: true, registration: waitlistReg, status: 'Waitlisted', waitlistPosition: nextPosition };
    }
  };

  // 2. ATOMIC CANCELLATION & DYNAMIC WAITLIST PROMOTION
  const cancelRegistration = async (registrationId) => {
    const reg = registrations.find(r => 
      String(r.Registration_ID) === String(registrationId) || 
      String(r.registration_id) === String(registrationId)
    );
    if (!reg) return { success: false, error: 'Registration not found' };

    const event = events.find(e => 
      String(e.Event_ID) === String(reg.Event_ID || reg.event_id) || 
      String(e.event_id) === String(reg.Event_ID || reg.event_id)
    );
    const user = users.find(u => 
      String(u.User_ID) === String(reg.User_ID || reg.user_id) || 
      String(u.user_id) === String(reg.User_ID || reg.user_id)
    );

    const wasEnrolled = reg.Registration_Status === 'Enrolled' || reg.registration_status === 'Enrolled';
    const wasAdmitted = wasEnrolled || reg.Registration_Status === 'Pending_Payment' || reg.registration_status === 'Pending_Payment';
    const wasWaitlisted = reg.Registration_Status === 'Waitlisted' || reg.registration_status === 'Waitlisted';
    const oldPosition = reg.Waitlist_Position || reg.waitlist_position;

    // Update the cancelled registration
    setRegistrations(prev =>
      prev.map(r => 
        (String(r.Registration_ID) === String(registrationId) || String(r.registration_id) === String(registrationId))
          ? { 
              ...r, 
              Registration_Status: 'Cancelled', 
              registration_status: 'Cancelled', 
              is_cancelled: true, 
              Waitlist_Position: null,
              waitlist_position: null 
            } 
          : r
      )
    );

    // Sync to Supabase if connected
    const client = getSupabaseClient();
    if (client) {
      try {
        const numRegId = parseInt(String(reg.registration_id || reg.Registration_ID).replace(/\D/g, '') || '0', 10);
        if (numRegId > 0) {
          const { error } = await client.from('registration').update({
            registration_status: 'Cancelled',
            is_cancelled: true
          }).eq('registration_id', numRegId);
          if (error) {
            console.error('Supabase Mutation Error (registration.update):', error.message, error.details);
          }
        }
      } catch (err) {
        console.error('cancelRegistration supabase update error:', err);
      }
    }

    if (wasAdmitted) {
      // Find candidate at Waitlist Position = 1
      const waitlistCandidates = registrations
        .filter(r => 
          (String(r.Event_ID) === String(reg.Event_ID || reg.event_id) || String(r.event_id) === String(reg.Event_ID || reg.event_id)) && 
          (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted') && 
          !r.is_cancelled &&
          String(r.Registration_ID || r.registration_id) !== String(registrationId)
        )
        .sort((a, b) => (a.Waitlist_Position || a.waitlist_position || 999) - (b.Waitlist_Position || b.waitlist_position || 999));

      const isFree = Number(event?.Ticket_Price || event?.ticket_price || 0) === 0;

      if (waitlistCandidates.length > 0) {
        const topCandidate = waitlistCandidates[0];
        const promotedUser = users.find(u => String(u.User_ID || u.user_id) === String(topCandidate.User_ID || topCandidate.user_id));
        const promotedStatus = isFree ? 'Enrolled' : 'Pending_Payment';

        // Re-index remaining waitlisted items
        setRegistrations(prev =>
          prev.map(r => {
            if (String(r.Registration_ID || r.registration_id) === String(topCandidate.Registration_ID || topCandidate.registration_id)) {
              return { 
                ...r, 
                Registration_Status: promotedStatus, 
                registration_status: promotedStatus, 
                Waitlist_Position: null,
                waitlist_position: null 
              };
            }
            if (
              (String(r.Event_ID) === String(reg.Event_ID || reg.event_id) || String(r.event_id) === String(reg.Event_ID || reg.event_id)) && 
              (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted') && 
              String(r.Registration_ID || r.registration_id) !== String(registrationId)
            ) {
              const pos = r.Waitlist_Position || r.waitlist_position || 1;
              return { 
                ...r, 
                Waitlist_Position: Math.max(1, pos - 1),
                waitlist_position: Math.max(1, pos - 1) 
              };
            }
            return r;
          })
        );

        // If paid event, the candidate was promoted to Pending_Payment (not Enrolled yet),
        // so Current_Enrolled must be decremented!
        if (!isFree) {
          setEvents(prev =>
            prev.map(e => 
              (String(e.Event_ID) === String(reg.Event_ID || reg.event_id) || String(e.event_id) === String(reg.Event_ID || reg.event_id))
                ? { 
                    ...e, 
                    Current_Enrolled: Math.max(0, (e.Current_Enrolled || e.current_enrolled || 1) - 1),
                    current_enrolled: Math.max(0, (e.current_enrolled || e.Current_Enrolled || 1) - 1)
                  } 
                : e
            )
          );
        }

        addToast(
          'Dynamic Waitlist Auto-Promotion',
          `Seat freed up! ${promotedUser ? (promotedUser.Full_Name || promotedUser.full_name) : 'Top waitlisted user'} was automatically promoted from Waitlist #1 to ${promotedStatus}!`,
          'success',
          6000
        );
      } else {
        // No waitlist candidates -> decrement Current_Enrolled
        setEvents(prev =>
          prev.map(e => 
            (String(e.Event_ID) === String(reg.Event_ID || reg.event_id) || String(e.event_id) === String(reg.Event_ID || reg.event_id))
              ? { 
                  ...e, 
                  Current_Enrolled: Math.max(0, (e.Current_Enrolled || e.current_enrolled || 1) - 1),
                  current_enrolled: Math.max(0, (e.current_enrolled || e.Current_Enrolled || 1) - 1)
                } 
              : e
          )
        );
      }

      // Sync event current_enrolled count to Supabase if connected
      if (client && (!waitlistCandidates.length || !isFree)) {
        try {
          const numEvtId = parseInt(String(reg.Event_ID || reg.event_id).replace(/\D/g, '') || '0', 10);
          if (numEvtId > 0) {
            const newCount = Math.max(0, (event?.Current_Enrolled || event?.current_enrolled || 1) - 1);
            const { error: evtErr } = await client.from('event').update({ current_enrolled: newCount }).eq('event_id', numEvtId);
            if (evtErr) {
              console.error('Supabase Mutation Error (event.update):', evtErr.message, evtErr.details);
            }
          }
        } catch (err) {
          console.error('Supabase event count update error:', err);
        }
      }
    } else if (wasWaitlisted && oldPosition) {
      // Shift down positions of subsequent waitlisted items
      setRegistrations(prev =>
        prev.map(r => {
          if (
            (String(r.Event_ID) === String(reg.Event_ID || reg.event_id) || String(r.event_id) === String(reg.Event_ID || reg.event_id)) && 
            (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted') && 
            (r.Waitlist_Position || r.waitlist_position) > oldPosition
          ) {
            const pos = r.Waitlist_Position || r.waitlist_position;
            return { ...r, Waitlist_Position: pos - 1, waitlist_position: pos - 1 };
          }
          return r;
        })
      );
    }

    addToast('Registration Cancelled', `Registration for "${event ? (event.Title || event.title) : 'Event'}" was cancelled.`, 'info');
    return { success: true };
  };

  // 2B. ADMIN SEAT CANCELLATION VIA RPC (Strict Access Control & Attendee Notifications)
  const cancelRegistrationSeat = async ({ registrationId, adminContact, reason }) => {
    const reg = registrations.find(r => 
      String(r.Registration_ID) === String(registrationId) || 
      String(r.registration_id) === String(registrationId)
    );
    if (!reg) return { success: false, error: 'Registration not found' };

    const event = events.find(e => 
      String(e.Event_ID) === String(reg.Event_ID || reg.event_id) || 
      String(e.event_id) === String(reg.Event_ID || reg.event_id)
    );

    // Requirement 3: Event Admin Access Checks
    if (!isEventAdmin(event, currentUser)) {
      addToast('Permission Denied', 'Only event administrators can cancel attendee seats.', 'error');
      return { success: false, error: 'Unauthorized: Only event administrators can cancel seats.' };
    }

    const contact = adminContact || event?.admin_contact || currentUser.Phone || currentUser.phone || '9876543210';
    const cancellationReason = reason || 'Seat cancelled by event administrator';

    // 1. Call Supabase RPC cancel_registration_seat(p_registration_id, p_admin_contact, p_reason)
    const client = getSupabaseClient();
    if (client) {
      try {
        const numRegId = parseInt(String(reg.registration_id || reg.Registration_ID).replace(/\D/g, '') || '0', 10);
        if (numRegId > 0) {
          const { error } = await client.rpc('cancel_registration_seat', {
            p_registration_id: numRegId,
            p_admin_contact: contact,
            p_reason: cancellationReason
          });
          if (error) {
            console.error('Supabase Mutation Error (cancel_registration_seat RPC):', error.message, error.details);
            // Fallback direct update to registration table
            const { error: updateErr } = await client
              .from('registration')
              .update({
                registration_status: 'Rejected',
                is_cancelled: true,
                cancellation_reason: cancellationReason,
                cancelled_by_contact: contact
              })
              .eq('registration_id', numRegId);
            if (updateErr) {
              console.error('Supabase Mutation Error (registration update fallback):', updateErr.message, updateErr.details);
            }
          }
        }
      } catch (err) {
        console.error('RPC cancel_registration_seat error:', err);
      }
    }

    const wasEnrolled = reg.Registration_Status === 'Enrolled' || reg.registration_status === 'Enrolled';
    const wasAdmitted = wasEnrolled || reg.Registration_Status === 'Pending_Payment' || reg.registration_status === 'Pending_Payment';
    const oldPosition = reg.Waitlist_Position || reg.waitlist_position;

    // 2. Update local registration state
    setRegistrations(prev =>
      prev.map(r => {
        if (String(r.Registration_ID) === String(registrationId) || String(r.registration_id) === String(registrationId)) {
          return {
            ...r,
            Registration_Status: 'Rejected',
            registration_status: 'Rejected',
            is_cancelled: true,
            cancellation_reason: cancellationReason,
            cancelled_by_contact: contact,
            notification_read: false,
            Waitlist_Position: null,
            waitlist_position: null
          };
        }
        return r;
      })
    );

    // 3. Trigger dynamic waitlist promotion if an admitted/enrolled seat was freed up
    if (wasAdmitted) {
      const waitlistCandidates = registrations
        .filter(r => 
          (String(r.Event_ID) === String(reg.Event_ID || reg.event_id) || String(r.event_id) === String(reg.Event_ID || reg.event_id)) && 
          (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted') && 
          String(r.Registration_ID || r.registration_id) !== String(registrationId)
        )
        .sort((a, b) => (a.Waitlist_Position || a.waitlist_position || 999) - (b.Waitlist_Position || b.waitlist_position || 999));

      if (waitlistCandidates.length > 0) {
        const topCandidate = waitlistCandidates[0];
        const promotedUser = users.find(u => String(u.User_ID || u.user_id) === String(topCandidate.User_ID || topCandidate.user_id));
        const isFree = Number(event?.Ticket_Price || event?.ticket_price || 0) === 0;
        const promotedStatus = isFree ? 'Enrolled' : 'Pending_Payment';

        setRegistrations(prev =>
          prev.map(r => {
            if (String(r.Registration_ID || r.registration_id) === String(topCandidate.Registration_ID || topCandidate.registration_id)) {
              return {
                ...r,
                Registration_Status: promotedStatus,
                registration_status: promotedStatus,
                Waitlist_Position: null,
                waitlist_position: null
              };
            }
            if (
              (String(r.Event_ID) === String(reg.Event_ID || reg.event_id) || String(r.event_id) === String(reg.Event_ID || reg.event_id)) &&
              (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted') &&
              String(r.Registration_ID || r.registration_id) !== String(registrationId)
            ) {
              const pos = r.Waitlist_Position || r.waitlist_position || 1;
              return {
                ...r,
                Waitlist_Position: Math.max(1, pos - 1),
                waitlist_position: Math.max(1, pos - 1)
              };
            }
            return r;
          })
        );

        // If paid event, the candidate was promoted to Pending_Payment (not Enrolled yet),
        // so Current_Enrolled must be decremented!
        if (!isFree) {
          setEvents(prev =>
            prev.map(e => 
              (String(e.Event_ID) === String(reg.Event_ID || reg.event_id) || String(e.event_id) === String(reg.Event_ID || reg.event_id))
                ? {
                    ...e,
                    Current_Enrolled: Math.max(0, (e.Current_Enrolled || e.current_enrolled || 1) - 1),
                    current_enrolled: Math.max(0, (e.current_enrolled || e.Current_Enrolled || 1) - 1)
                  }
                : e
            )
          );
        }

        addToast(
          'Waitlist Auto-Promoted',
          `Seat freed up! ${promotedUser ? (promotedUser.Full_Name || promotedUser.full_name) : 'Top waitlisted attendee'} automatically promoted to ${promotedStatus}.`,
          'success',
          5000
        );
      } else {
        setEvents(prev =>
          prev.map(e => 
            (String(e.Event_ID) === String(reg.Event_ID || reg.event_id) || String(e.event_id) === String(reg.Event_ID || reg.event_id))
              ? {
                  ...e,
                  Current_Enrolled: Math.max(0, (e.Current_Enrolled || e.current_enrolled || 1) - 1),
                  current_enrolled: Math.max(0, (e.current_enrolled || e.Current_Enrolled || 1) - 1)
                }
              : e
          )
        );
      }

      // Sync event current_enrolled count to Supabase if connected
      if (client && (!waitlistCandidates.length || !isFree)) {
        try {
          const numEvtId = parseInt(String(reg.Event_ID || reg.event_id).replace(/\D/g, '') || '0', 10);
          if (numEvtId > 0) {
            const newCount = Math.max(0, (event?.Current_Enrolled || event?.current_enrolled || 1) - 1);
            const { error: evtErr } = await client.from('event').update({ current_enrolled: newCount }).eq('event_id', numEvtId);
            if (evtErr) {
              console.error('Supabase Mutation Error (event enrolled update):', evtErr.message, evtErr.details);
            }
          }
        } catch (err) {
          console.error('Supabase event count update error:', err);
        }
      }
    } else if (oldPosition) {
      setRegistrations(prev =>
        prev.map(r => {
          if (
            (String(r.Event_ID) === String(reg.Event_ID || reg.event_id) || String(r.event_id) === String(reg.Event_ID || reg.event_id)) &&
            (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted') &&
            (r.Waitlist_Position || r.waitlist_position) > oldPosition
          ) {
            const p = r.Waitlist_Position || r.waitlist_position;
            return { ...r, Waitlist_Position: p - 1, waitlist_position: p - 1 };
          }
          return r;
        })
      );
    }

    addToast('Seat Cancelled', `Seat revoked with notice: "${cancellationReason}". Attendee notified.`, 'warning');
    return { success: true };
  };

  // 2C. ATTENDEE CANCELLATION NOTIFICATION ACKNOWLEDGEMENT
  const markNotificationRead = async (registrationId) => {
    setRegistrations(prev =>
      prev.map(r => {
        if (String(r.Registration_ID) === String(registrationId) || String(r.registration_id) === String(registrationId)) {
          return {
            ...r,
            notification_read: true
          };
        }
        return r;
      })
    );

    const client = getSupabaseClient();
    if (client) {
      try {
        const numRegId = parseInt(String(registrationId).replace(/\D/g, '') || '0', 10);
        if (numRegId > 0) {
          const { error } = await client
            .from('registration')
            .update({ notification_read: true })
            .eq('registration_id', numRegId);
          if (error) {
            console.error('Supabase Mutation Error (registration notification_read update):', error.message, error.details);
          }
        }
      } catch (err) {
        console.error('markNotificationRead notice:', err);
      }
    }
  };

  // 2D. RETRY ENROLLMENT ONCE AFTER REJECTION
  const retryRegistration = (registrationId) => {
    const reg = registrations.find(r => 
      String(r.Registration_ID || r.registration_id) === String(registrationId)
    );
    if (!reg) return { success: false, error: 'Registration not found' };

    const currentRetries = reg.retry_count || 0;
    if (currentRetries >= 1) {
      addToast('Retry Limit Reached', 'You have already used your 1 permitted retry for this event.', 'warning');
      return { success: false, error: 'Maximum retry limit reached' };
    }

    setRegistrations(prev =>
      prev.map(r => {
        if (String(r.Registration_ID || r.registration_id) === String(registrationId)) {
          return {
            ...r,
            Registration_Status: 'Cancelled',
            registration_status: 'Cancelled',
            is_cancelled: true,
            retry_count: currentRetries + 1,
            can_reapply: true
          };
        }
        return r;
      })
    );

    addToast('Ready to Re-apply', 'Rejection cleared. You may now attempt enrollment 1 more time.', 'info');
    return { success: true };
  };

  // 3. PAYMENT VERIFICATION ENGINE
  // 3. PAYMENT VERIFICATION ENGINE & MANUAL UPI WORKFLOW
  const submitManualUpiPayment = async ({ eventId, utrReference }) => {
    const event = events.find(e => String(e.Event_ID) === String(eventId) || String(e.event_id) === String(eventId));
    if (!event) return { success: false, error: 'Event not found' };

    const ticketPrice = Number(event.ticket_price ?? event.Ticket_Price ?? 0);
    const userId = currentUser.User_ID || currentUser.user_id;

    // 1. Local Registration check/upsert: set registration_status to Enrolled
    let reg = registrations.find(r => 
      (String(r.Event_ID) === String(eventId) || String(r.event_id) === String(eventId)) && 
      (String(r.User_ID) === String(userId) || String(r.user_id) === String(userId)) && 
      r.Registration_Status !== 'Cancelled'
    );
    
    let regId = reg?.Registration_ID || reg?.registration_id;
    if (reg) {
      setRegistrations(prev => prev.map(r => 
        (r.Registration_ID === regId || r.registration_id === regId) 
          ? { ...r, Registration_Status: 'Enrolled', registration_status: 'Enrolled' } 
          : r
      ));
    } else {
      const pastReg = registrations.find(r => 
        (String(r.Event_ID) === String(eventId) || String(r.event_id) === String(eventId)) && 
        (String(r.User_ID) === String(userId) || String(r.user_id) === String(userId))
      );
      const retryCount = pastReg ? (pastReg.retry_count || 0) : 0;

      regId = 'reg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const newReg = {
        Registration_ID: regId,
        registration_id: regId,
        Event_ID: eventId,
        event_id: eventId,
        User_ID: userId,
        user_id: userId,
        Registration_Status: 'Enrolled',
        registration_status: 'Enrolled',
        Waitlist_Position: null,
        waitlist_position: null,
        Registered_At: new Date().toISOString(),
        registered_at: new Date().toISOString(),
        retry_count: retryCount
      };
      setRegistrations(prev => [...prev, newReg]);
      setEvents(prev => prev.map(e => 
        (String(e.Event_ID) === String(eventId) || String(e.event_id) === String(eventId))
          ? { 
              ...e, 
              Current_Enrolled: (Number(e.Current_Enrolled ?? e.current_enrolled ?? 0) + 1),
              current_enrolled: (Number(e.current_enrolled ?? e.Current_Enrolled ?? 0) + 1)
            } 
          : e
      ));
      reg = newReg;
    }

    // 2. Insert into payment with status Pending
    const paymentId = 'pay_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newPayment = {
      Payment_ID: paymentId,
      payment_id: paymentId,
      Registration_ID: regId,
      registration_id: regId,
      Amount: ticketPrice,
      amount: ticketPrice,
      Transaction_Reference: utrReference,
      transaction_reference: utrReference,
      Payment_Status: 'Pending',
      payment_status: 'Pending',
      Verified_At: null,
      verified_at: null
    };

    setPayments(prev => [...prev, newPayment]);

    // 3. Sync to Supabase if connected
    const client = getSupabaseClient();
    if (client) {
      try {
        const numEventId = parseInt(String(eventId).replace(/\D/g, '') || '0', 10);
        const numUserId = parseInt(String(userId).replace(/\D/g, '') || '0', 10);

        if (numEventId > 0 && numUserId > 0) {
          // Check if registration exists
          const { data: existingReg, error: selErr } = await client
            .from('registration')
            .select('registration_id')
            .eq('event_id', numEventId)
            .eq('user_id', numUserId)
            .maybeSingle();

          if (selErr) {
            console.error('Supabase Query Error (registration select):', selErr.message, selErr.details);
          }

          let targetRegId = existingReg?.registration_id;

          if (targetRegId) {
            const { error: upErr } = await client
              .from('registration')
              .update({ registration_status: 'Enrolled' })
              .eq('registration_id', targetRegId);
            if (upErr) {
              console.error('Supabase Mutation Error (registration update):', upErr.message, upErr.details);
            }
          } else {
            const { data: insertedReg, error: insErr } = await client
              .from('registration')
              .insert({
                event_id: numEventId,
                user_id: numUserId,
                registration_status: 'Enrolled'
              })
              .select('registration_id')
              .maybeSingle();
            if (insErr) {
              console.error('Supabase Mutation Error (registration insert):', insErr.message, insErr.details);
            }
            if (insertedReg) targetRegId = insertedReg.registration_id;
          }

          if (targetRegId) {
            const { error: payErr } = await client
              .from('payment')
              .insert({
                registration_id: targetRegId,
                amount: parseFloat(ticketPrice || 0),
                transaction_reference: utrReference,
                payment_status: 'Pending'
              });
            if (payErr) {
              console.error('Supabase Mutation Error (payment insert):', payErr.message, payErr.details);
            }
          }
        }
      } catch (err) {
        console.error('Supabase manual UPI sync error:', err);
      }
    }

    addToast('Payment Request Sent', `Submitted UTR "${utrReference}". Awaiting organizer approval.`, 'info');
    return { success: true, registration: reg, payment: newPayment };
  };

  const verifyPayment = async (paymentId, isApproved = true) => {
    const payment = payments.find(p => p.Payment_ID === paymentId || p.payment_id === paymentId);
    if (!payment) return { success: false, error: 'Payment not found' };

    const reg = registrations.find(r => r.Registration_ID === payment.Registration_ID || r.registration_id === payment.registration_id);
    const event = events.find(e => e.Event_ID === reg?.Event_ID || e.event_id === reg?.event_id);

    // Requirement 3: Event Admin Access Checks
    if (!isEventAdmin(event, currentUser)) {
      addToast('Permission Denied', 'Only event administrators can verify or reject payments.', 'error');
      return { success: false, error: 'Unauthorized: Only event administrators can verify payments.' };
    }

    const status = isApproved ? 'Verified' : 'Failed';
    const now = new Date().toISOString();
    const verifierId = currentUser.User_ID || currentUser.user_id;

    // 1. Local update
    setPayments(prev =>
      prev.map(p => (p.Payment_ID === paymentId || p.payment_id === paymentId) ? {
        ...p,
        Payment_Status: status,
        payment_status: status,
        Verified_At: isApproved ? now : null,
        verified_at: isApproved ? now : null,
        Verified_By: isApproved ? verifierId : null,
        verified_by: isApproved ? verifierId : null
      } : p)
    );

    if (isApproved && reg) {
      setRegistrations(prev =>
        prev.map(r => (r.Registration_ID === reg.Registration_ID || r.registration_id === reg.registration_id) ? {
          ...r,
          Registration_Status: 'Enrolled',
          registration_status: 'Enrolled'
        } : r)
      );

      if (event && reg.Registration_Status !== 'Enrolled') {
        setEvents(prev =>
          prev.map(e => (String(e.Event_ID || e.event_id) === String(event.Event_ID || event.event_id)) ? {
            ...e,
            Current_Enrolled: (Number(e.Current_Enrolled ?? e.current_enrolled ?? 0) + 1),
            current_enrolled: (Number(e.current_enrolled ?? e.Current_Enrolled ?? 0) + 1)
          } : e)
        );
      }

      // Check event closure condition: all seats confirmed and all members paid, no waitlist or pending left
      const targetEvtId = String(reg.Event_ID || reg.event_id);
      const evtObj = events.find(e => String(e.Event_ID || e.event_id) === targetEvtId);
      if (evtObj) {
        const maxCap = Number(evtObj.Max_Capacity || evtObj.max_capacity || 0);
        const evtRegs = registrations.filter(r => 
          (String(r.Event_ID || r.event_id) === targetEvtId) && !r.is_cancelled && r.Registration_Status !== 'Rejected' && r.registration_status !== 'Rejected'
        );
        const enrolledCount = evtRegs.filter(r => 
          (r.Registration_Status === 'Enrolled' || r.registration_status === 'Enrolled') ||
          (String(r.Registration_ID || r.registration_id) === String(reg.Registration_ID || reg.registration_id))
        ).length;
        const remainingWaitlist = evtRegs.filter(r => 
          (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted')
        ).length;
        const remainingPending = evtRegs.filter(r => 
          (r.Registration_Status === 'Pending_Payment' || r.registration_status === 'Pending_Payment') &&
          (String(r.Registration_ID || r.registration_id) !== String(reg.Registration_ID || reg.registration_id))
        ).length;

        if (maxCap > 0 && enrolledCount >= maxCap && remainingWaitlist === 0 && remainingPending === 0) {
          setEvents(prev => prev.map(e => 
            (String(e.Event_ID || e.event_id) === targetEvtId)
              ? { ...e, registration_closed: true, waitlist_closed: true, is_registration_closed: true }
              : e
          ));
        }
      }
    } else if (!isApproved && reg) {
      setRegistrations(prev =>
        prev.map(r => (r.Registration_ID === reg.Registration_ID || r.registration_id === reg.registration_id) ? {
          ...r,
          Registration_Status: 'Rejected',
          registration_status: 'Rejected',
          is_cancelled: true,
          cancellation_reason: 'Payment verification rejected by administrator'
        } : r)
      );

      // If the admin rejects that enrollment too, enroll the next in line in waitlist and so on
      const targetEvtId = String(reg.Event_ID || reg.event_id);
      const evtObj = events.find(e => String(e.Event_ID || e.event_id) === targetEvtId);
      const isPaidEvt = Number(evtObj?.Ticket_Price ?? evtObj?.ticket_price ?? 0) > 0;
      const nextPromotedStatus = isPaidEvt ? 'Pending_Payment' : 'Enrolled';

      const waitlistCandidates = registrations
        .filter(r => 
          (String(r.Event_ID || r.event_id) === targetEvtId) &&
          (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted') &&
          String(r.Registration_ID || r.registration_id) !== String(reg.Registration_ID || reg.registration_id)
        )
        .sort((a, b) => (a.Waitlist_Position || a.waitlist_position || 999) - (b.Waitlist_Position || b.waitlist_position || 999));

      if (waitlistCandidates.length > 0) {
        const topCandidate = waitlistCandidates[0];
        const topId = String(topCandidate.Registration_ID || topCandidate.registration_id);

        setRegistrations(prev => prev.map(r => {
          if (String(r.Registration_ID || r.registration_id) === topId) {
            return {
              ...r,
              Registration_Status: nextPromotedStatus,
              registration_status: nextPromotedStatus,
              Waitlist_Position: null,
              waitlist_position: null,
              mandated_payment: isPaidEvt
            };
          }
          if (
            (String(r.Event_ID || r.event_id) === targetEvtId) &&
            (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted') &&
            String(r.Registration_ID || r.registration_id) !== topId
          ) {
            const p = r.Waitlist_Position || r.waitlist_position || 1;
            return { ...r, Waitlist_Position: Math.max(1, p - 1), waitlist_position: Math.max(1, p - 1) };
          }
          return r;
        }));

        addToast(
          'Next Waitlist Promoted',
          `Enrollment rejected. Promoted waitlist candidate #1 to ${nextPromotedStatus === 'Pending_Payment' ? 'Pending Payment (payment mandated)' : 'Enrolled'}.`,
          'info'
        );
      }
    }

    // 2. Supabase mutation on click as required
    const client = getSupabaseClient();
    if (client) {
      try {
        const numPaymentId = parseInt(String(paymentId).replace(/\D/g, '') || '0', 10);
        const numVerifier = parseInt(String(verifierId).replace(/\D/g, '') || '0', 10);

        if (numPaymentId > 0) {
          const { error: payErr } = await client
            .from('payment')
            .update({
              payment_status: status,
              verified_at: isApproved ? now : null,
              verified_by: numVerifier > 0 ? numVerifier : null
            })
            .eq('payment_id', numPaymentId);
          if (payErr) {
            console.error('Supabase Mutation Error (payment update):', payErr.message, payErr.details);
          }
        }

        if (reg) {
          const numRegId = parseInt(String(reg.Registration_ID || reg.registration_id).replace(/\D/g, '') || '0', 10);
          if (numRegId > 0) {
            const { error: regErr } = await client
              .from('registration')
              .update({ registration_status: isApproved ? 'Enrolled' : 'Rejected' })
              .eq('registration_id', numRegId);
            if (regErr) {
              console.error('Supabase Mutation Error (registration update):', regErr.message, regErr.details);
            }
          }
        }
      } catch (err) {
        console.error('Supabase verifyPayment error:', err);
      }
    }

    addToast(
      isApproved ? 'Payment Verified' : 'Payment Rejected',
      isApproved ? `Transaction ${payment.Transaction_Reference || payment.transaction_reference} verified. Enrollment confirmed.` : 'Payment request rejected.',
      isApproved ? 'success' : 'warning'
    );

    return { success: true };
  };

  // 3B. BATCH WAITLIST ADMISSION (ADMIN/ORGANIZER RPC)
  const admitWaitlistedMembers = async ({ eventId, admitCount }) => {
    const targetEvent = events.find(e => String(e.Event_ID || e.event_id) === String(eventId));
    if (!targetEvent) return { success: false, error: 'Event not found' };

    // Requirement 3: Event Admin Access Checks
    if (!isEventAdmin(targetEvent, currentUser)) {
      addToast('Permission Denied', 'Only event administrators can admit waitlisted members.', 'error');
      return { success: false, error: 'Unauthorized: Only event administrators can admit waitlist.' };
    }

    const numLimit = parseInt(admitCount, 10);
    if (isNaN(numLimit) || numLimit <= 0) {
      addToast('Invalid Input', 'Please enter a valid count of members to admit.', 'warning');
      return { success: false, error: 'Invalid count' };
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const numEventId = parseInt(String(eventId).replace(/\D/g, '') || '0', 10);
        if (numEventId > 0) {
          const { error: rpcErr } = await client.rpc('admit_waitlisted_members', {
            target_event_id: numEventId,
            admit_limit: numLimit
          });
          if (rpcErr) {
            console.error('Supabase Mutation Error (admit_waitlisted_members RPC):', rpcErr.message, rpcErr.details);
          }
        }
      } catch (err) {
        console.error('RPC admit_waitlisted_members error:', err);
      }
    }

    // Local dynamic waitlist promotion
    const waitlisted = registrations
      .filter(r => (String(r.Event_ID) === String(eventId) || String(r.event_id) === String(eventId)) && (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted'))
      .sort((a, b) => ((a.Waitlist_Position || a.waitlist_position || 999) - (b.Waitlist_Position || b.waitlist_position || 999)));

    const toAdmit = waitlisted.slice(0, numLimit);
    const toAdmitIds = new Set(toAdmit.map(r => String(r.Registration_ID || r.registration_id)));
    const isPaid = Number(targetEvent?.Ticket_Price ?? targetEvent?.ticket_price ?? 0) > 0;
    const promotedStatus = isPaid ? 'Pending_Payment' : 'Enrolled';

    if (toAdmit.length > 0) {
      setRegistrations(prev => prev.map(r => {
        const id = String(r.Registration_ID || r.registration_id);
        if (toAdmitIds.has(id)) {
          return {
            ...r,
            Registration_Status: promotedStatus,
            registration_status: promotedStatus,
            Waitlist_Position: null,
            waitlist_position: null,
            mandated_payment: isPaid
          };
        }
        return r;
      }));

      // Re-index remaining waitlisted items
      setRegistrations(prev => {
        const remaining = prev
          .filter(r => (String(r.Event_ID) === String(eventId) || String(r.event_id) === String(eventId)) && (r.Registration_Status === 'Waitlisted' || r.registration_status === 'Waitlisted'))
          .sort((a, b) => ((a.Waitlist_Position || a.waitlist_position || 999) - (b.Waitlist_Position || b.waitlist_position || 999)));

        return prev.map(r => {
          const idx = remaining.findIndex(item => String(item.Registration_ID || item.registration_id) === String(r.Registration_ID || r.registration_id));
          if (idx !== -1) {
            return {
              ...r,
              Waitlist_Position: idx + 1,
              waitlist_position: idx + 1
            };
          }
          return r;
        });
      });

      setEvents(prev => prev.map(e => (String(e.Event_ID) === String(eventId) || String(e.event_id) === String(eventId)) ? {
        ...e,
        has_admitted_waitlist: true,
        ...(!isPaid ? {
          Current_Enrolled: (Number(e.Current_Enrolled ?? e.current_enrolled ?? 0) + toAdmit.length),
          current_enrolled: (Number(e.current_enrolled ?? e.Current_Enrolled ?? 0) + toAdmit.length)
        } : {})
      } : e));
    }

    // Refresh registrations immediately from Supabase
    if (client) {
      try {
        const { data: dbRegs } = await client.from('registration').select('*');
        if (dbRegs && dbRegs.length > 0) {
          setRegistrations(prev => {
            const map = new Map(prev.map(r => [String(r.Registration_ID || r.registration_id), r]));
            dbRegs.forEach(dr => {
              map.set(String(dr.registration_id), {
                Registration_ID: String(dr.registration_id),
                registration_id: dr.registration_id,
                Event_ID: String(dr.event_id),
                event_id: dr.event_id,
                User_ID: String(dr.user_id),
                user_id: dr.user_id,
                Registration_Status: dr.registration_status,
                registration_status: dr.registration_status,
                Waitlist_Position: dr.waitlist_position,
                waitlist_position: dr.waitlist_position,
                Registered_At: dr.registered_at,
                registered_at: dr.registered_at,
                is_cancelled: dr.is_cancelled || false,
                cancellation_reason: dr.cancellation_reason || null,
                cancelled_by_contact: dr.cancelled_by_contact || null,
                notification_read: dr.notification_read || false
              });
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Sync registration notice:', err);
      }
    }

    addToast('Waitlist Admitted', `Successfully admitted ${toAdmit.length || numLimit} waitlisted members.`, 'success');
    return { success: true, count: toAdmit.length };
  };

  // 4. CREATE EVENT (With Capacity Control Validation)
  const createEvent = (eventData) => {
    const venue = venues.find(v => v.Venue_ID === eventData.Venue_ID);
    if (!venue) {
      addToast('Event Creation Error', 'Selected venue does not exist.', 'error');
      return { success: false, error: 'Invalid venue' };
    }

    // Business Rule 1: Capacity Control (Event Max_Capacity cannot exceed Venue Total_Capacity)
    if (Number(eventData.Max_Capacity) > Number(venue.Total_Capacity)) {
      addToast(
        'Capacity Limit Violation',
        `Event Max Capacity (${eventData.Max_Capacity}) cannot exceed Venue Total Capacity (${venue.Total_Capacity}) for "${venue.Venue_Name}".`,
        'error',
        6000
      );
      return { success: false, error: 'Capacity exceeds venue limit' };
    }

    const newEvent = {
      Event_ID: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      Title: eventData.Title,
      Description: eventData.Description || '',
      Category_ID: eventData.Category_ID,
      Venue_ID: eventData.Venue_ID,
      Organizer_ID: eventData.Organizer_ID || currentUserId,
      Event_Date: eventData.Event_Date,
      Ticket_Price: Number(eventData.Ticket_Price) || 0,
      Max_Capacity: Number(eventData.Max_Capacity),
      Current_Enrolled: 0,
      Status: eventData.Status || 'Published',
      Created_At: new Date().toISOString(),
      Cover_Image: eventData.Cover_Image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'
    };

    setEvents(prev => [newEvent, ...prev]);
    addToast('Event Created', `"${newEvent.Title}" scheduled at ${venue.Venue_Name}.`, 'success');
    return { success: true, event: newEvent };
  };

  // 4B. CREATE EVENT WITH CO-ADMINS (SUPABASE RPC: create_event_with_admins)
  const createEventWithAdmins = async ({
    title,
    description,
    categoryId,
    venueId,
    eventDate,
    ticketPrice,
    maxCapacity,
    upiId,
    adminContact,
    adminEmails = []
  }) => {
    const venue = venues.find(v => v.Venue_ID === venueId || String(v.venue_id) === String(venueId));
    if (venue && Number(maxCapacity) > Number(venue.Total_Capacity)) {
      addToast(
        'Capacity Limit Violation',
        `Event Max Capacity (${maxCapacity}) cannot exceed Venue Total Capacity (${venue.Total_Capacity}) for "${venue.Venue_Name}".`,
        'error',
        6000
      );
      return { success: false, error: 'Capacity exceeds venue limit' };
    }

    const client = getSupabaseClient();
    let newEventId = null;
    const organizerIdNum = parseInt(String(currentUser.user_id || currentUser.User_ID).replace(/\D/g, '') || '1', 10);
    const categoryIdNum = parseInt(String(categoryId).replace(/\D/g, '') || '1', 10);
    const venueIdNum = parseInt(String(venueId).replace(/\D/g, '') || '1', 10);
    const numCapacity = parseInt(maxCapacity, 10);
    const numPrice = parseFloat(ticketPrice || 0);
    const contact = adminContact || currentUser.phone || currentUser.Phone || '9876543210';
    const upi = upiId || 'organizer@upi';

    if (client) {
      try {
        const { data, error } = await client.rpc('create_event_with_admins', {
          p_title: title,
          p_description: description || '',
          p_category_id: categoryIdNum,
          p_venue_id: venueIdNum,
          p_organizer_id: organizerIdNum,
          p_upi_id: upi,
          p_admin_contact: contact,
          p_event_date: eventDate,
          p_ticket_price: numPrice,
          p_max_capacity: numCapacity,
          p_admin_emails: adminEmails
        });

        if (!error && data) {
          newEventId = data;
        } else if (error) {
          console.error('Supabase Mutation Error (create_event_with_admins RPC):', error.message, error.details);
          // Fallback direct insert if stored procedure fails
          const { data: insertedEvent, error: insertErr } = await client
            .from('event')
            .insert({
              title,
              description: description || '',
              category_id: categoryIdNum,
              venue_id: venueIdNum,
              organizer_id: organizerIdNum,
              upi_id: upi,
              admin_contact: contact,
              event_date: eventDate,
              ticket_price: numPrice,
              max_capacity: numCapacity,
              current_enrolled: 0,
              status: 'Upcoming'
            })
            .select('event_id')
            .maybeSingle();

          if (insertErr) {
            console.error('Supabase Mutation Error (event fallback insert):', insertErr.message, insertErr.details);
          } else if (insertedEvent?.event_id) {
            newEventId = insertedEvent.event_id;
            // Also update currentUser.admin_event_ids in users table
            const currentAdminEventIds = currentUser.admin_event_ids || [];
            if (!currentAdminEventIds.includes(newEventId)) {
              const { error: usrErr } = await client
                .from('users')
                .update({
                  admin_event_ids: [...currentAdminEventIds, newEventId]
                })
                .eq('user_id', organizerIdNum);
              if (usrErr) {
                console.error('Supabase Mutation Error (users admin_event_ids update):', usrErr.message, usrErr.details);
              }
            }
          }
        }
      } catch (err) {
        console.error('RPC create_event_with_admins error:', err);
      }
    }

    if (!newEventId) {
      newEventId = Date.now() % 100000;
    }

    const newEventObj = {
      Event_ID: newEventId,
      event_id: newEventId,
      Title: title,
      title: title,
      Description: description || '',
      description: description || '',
      Category_ID: categoryId,
      category_id: categoryIdNum,
      Venue_ID: venueId,
      venue_id: venueIdNum,
      Organizer_ID: currentUser.User_ID || currentUser.user_id,
      organizer_id: organizerIdNum,
      Event_Date: eventDate,
      event_date: eventDate,
      Ticket_Price: numPrice,
      ticket_price: numPrice,
      Max_Capacity: numCapacity,
      max_capacity: numCapacity,
      Current_Enrolled: 0,
      current_enrolled: 0,
      Status: 'Published',
      status: 'Upcoming',
      Created_At: new Date().toISOString(),
      created_at: new Date().toISOString(),
      Cover_Image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      upi_id: upi,
      admin_contact: contact
    };

    setEvents(prev => [newEventObj, ...prev]);

    // Immediately update currentUser state locally so they see admin controls right away:
    setCurrentUser(prev => ({
      ...prev,
      admin_event_ids: [...(prev.admin_event_ids || []), newEventId]
    }));

    // Update co-admins in local users state
    if (adminEmails.length > 0) {
      const emailSet = new Set(adminEmails.map(e => e.toLowerCase()));
      setUsers(prev => prev.map(u => {
        const uEmail = (u.Email || u.email || '').toLowerCase();
        if (emailSet.has(uEmail)) {
          return {
            ...u,
            admin_event_ids: [...(u.admin_event_ids || []), newEventId]
          };
        }
        return u;
      }));
    }

    addToast('Event Created', `"${title}" created and scheduled! Administrative privileges assigned.`, 'success');
    return { success: true, eventId: newEventId, event: newEventObj };
  };

  // 5. UPDATE EVENT
  const updateEvent = async (eventId, updateFields) => {
    const existing = events.find(e => String(e.Event_ID || e.event_id) === String(eventId));
    if (!existing) return { success: false, error: 'Event not found' };

    const venueId = updateFields.Venue_ID || updateFields.venue_id || existing.Venue_ID || existing.venue_id;
    const venue = venues.find(v => String(v.Venue_ID || v.venue_id) === String(venueId));
    const newCap = (updateFields.Max_Capacity || updateFields.max_capacity) ? Number(updateFields.Max_Capacity || updateFields.max_capacity) : (existing.Max_Capacity || existing.max_capacity);

    if (venue && newCap > (venue.Total_Capacity || venue.total_capacity)) {
      addToast('Capacity Violation', `Max Capacity cannot exceed venue limit (${venue.Total_Capacity || venue.total_capacity}).`, 'error');
      return { success: false, error: 'Capacity exceeds venue limit' };
    }

    setEvents(prev =>
      prev.map(e => (String(e.Event_ID || e.event_id) === String(eventId)) ? { ...e, ...updateFields } : e)
    );

    const client = getSupabaseClient();
    if (client) {
      try {
        const numEventId = parseInt(String(eventId).replace(/\D/g, '') || '0', 10);
        if (numEventId > 0) {
          const dbPayload = {};
          if (updateFields.Title || updateFields.title) dbPayload.title = updateFields.Title || updateFields.title;
          if (updateFields.Description !== undefined || updateFields.description !== undefined) dbPayload.description = updateFields.Description ?? updateFields.description;
          if (updateFields.Category_ID || updateFields.category_id) dbPayload.category_id = parseInt(updateFields.Category_ID || updateFields.category_id);
          if (updateFields.Venue_ID || updateFields.venue_id) dbPayload.venue_id = parseInt(updateFields.Venue_ID || updateFields.venue_id);
          if (updateFields.Event_Date || updateFields.event_date) dbPayload.event_date = updateFields.Event_Date || updateFields.event_date;
          if (updateFields.Ticket_Price !== undefined || updateFields.ticket_price !== undefined) dbPayload.ticket_price = parseFloat(updateFields.Ticket_Price ?? updateFields.ticket_price ?? 0);
          if (updateFields.Max_Capacity || updateFields.max_capacity) dbPayload.max_capacity = parseInt(updateFields.Max_Capacity || updateFields.max_capacity);
          if (updateFields.Status || updateFields.status) dbPayload.status = updateFields.Status || updateFields.status;
          if (updateFields.upi_id) dbPayload.upi_id = updateFields.upi_id;
          if (updateFields.admin_contact) dbPayload.admin_contact = updateFields.admin_contact;

          if (Object.keys(dbPayload).length > 0) {
            const { error: evtErr } = await client.from('event').update(dbPayload).eq('event_id', numEventId);
            if (evtErr) {
              console.error('Supabase Mutation Error (event update):', evtErr.message, evtErr.details);
            }
          }
        }
      } catch (err) {
        console.error('Supabase updateEvent error:', err);
      }
    }

    addToast('Event Updated', 'Event details were updated successfully.', 'success');
    return { success: true };
  };

  // 6. DELETE EVENT (Cascade cleanup)
  const deleteEvent = async (eventId) => {
    const event = events.find(e => String(e.Event_ID || e.event_id) === String(eventId));
    setEvents(prev => prev.filter(e => String(e.Event_ID || e.event_id) !== String(eventId)));
    setRegistrations(prev => prev.filter(r => String(r.Event_ID || r.event_id) !== String(eventId)));
    setEventVolunteers(prev => prev.filter(v => String(v.Event_ID || v.event_id) !== String(eventId)));

    const client = getSupabaseClient();
    if (client) {
      try {
        const numEventId = parseInt(String(eventId).replace(/\D/g, '') || '0', 10);
        if (numEventId > 0) {
          const { error: delErr } = await client.from('event').delete().eq('event_id', numEventId);
          if (delErr) {
            console.error('Supabase Mutation Error (event delete):', delErr.message, delErr.details);
          }
        }
      } catch (err) {
        console.error('Supabase deleteEvent error:', err);
      }
    }

    addToast('Event Removed', `"${event ? (event.Title || event.title) : 'Event'}" and all related registrations were deleted.`, 'info');
    return { success: true };
  };

  // 7. VENUE MANAGEMENT
  const createVenue = async (venueData) => {
    const venueName = venueData.Venue_Name || venueData.venue_name;
    const address = venueData.Location_Address || venueData.location_address;
    const capacity = Number(venueData.Total_Capacity || venueData.total_capacity);
    const email = venueData.Contact_Email || venueData.contact_email;

    let venueId = 'ven_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: vData, error: vErr } = await client
          .from('venue')
          .insert({
            venue_name: venueName,
            location_address: address,
            total_capacity: capacity,
            contact_email: email
          })
          .select('venue_id')
          .maybeSingle();

        if (vErr) {
          console.error('Supabase Mutation Error (venue insert):', vErr.message, vErr.details);
        } else if (vData?.venue_id) {
          venueId = vData.venue_id;
        }
      } catch (err) {
        console.error('Supabase createVenue error:', err);
      }
    }

    const newVenue = {
      Venue_ID: venueId,
      venue_id: venueId,
      Venue_Name: venueName,
      venue_name: venueName,
      Location_Address: address,
      location_address: address,
      Total_Capacity: capacity,
      total_capacity: capacity,
      Contact_Email: email,
      contact_email: email,
      Image: venueData.Image || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80'
    };

    setVenues(prev => [...prev, newVenue]);
    addToast('Venue Registered', `"${newVenue.Venue_Name}" (Cap: ${newVenue.Total_Capacity}) added to registry.`, 'success');
    return { success: true, venue: newVenue };
  };

  // 8. VOLUNTEER ALLOCATION
  const assignVolunteer = async ({ eventId, userId, assignedRole }) => {
    const existing = eventVolunteers.find(v => 
      (String(v.Event_ID || v.event_id) === String(eventId)) && 
      (String(v.User_ID || v.user_id) === String(userId))
    );

    if (existing) {
      // Update role
      setEventVolunteers(prev =>
        prev.map(v => (v.Assignment_ID === existing.Assignment_ID || v.assignment_id === existing.assignment_id) ? { ...v, Assigned_Role: assignedRole, assigned_role: assignedRole } : v)
      );

      const client = getSupabaseClient();
      if (client) {
        try {
          const numAsgId = parseInt(String(existing.Assignment_ID || existing.assignment_id).replace(/\D/g, '') || '0', 10);
          if (numAsgId > 0) {
            const { error: asgErr } = await client
              .from('event_volunteer')
              .update({ assigned_role: assignedRole })
              .eq('assignment_id', numAsgId);
            if (asgErr) {
              console.error('Supabase Mutation Error (event_volunteer update):', asgErr.message, asgErr.details);
            }
          }
        } catch (err) {
          console.error('Supabase assignVolunteer update error:', err);
        }
      }

      addToast('Duty Reassigned', `Volunteer duty updated to "${assignedRole}".`, 'info');
      return { success: true };
    }

    let asgId = 'asg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    const client = getSupabaseClient();
    if (client) {
      try {
        const numEventId = parseInt(String(eventId).replace(/\D/g, '') || '0', 10);
        const numUserId = parseInt(String(userId).replace(/\D/g, '') || '0', 10);
        if (numEventId > 0 && numUserId > 0) {
          const { data: asgData, error: asgErr } = await client
            .from('event_volunteer')
            .insert({
              event_id: numEventId,
              user_id: numUserId,
              assigned_role: assignedRole
            })
            .select('assignment_id')
            .maybeSingle();

          if (asgErr) {
            console.error('Supabase Mutation Error (event_volunteer insert):', asgErr.message, asgErr.details);
          } else if (asgData?.assignment_id) {
            asgId = asgData.assignment_id;
          }
        }
      } catch (err) {
        console.error('Supabase assignVolunteer insert error:', err);
      }
    }

    const newAssignment = {
      Assignment_ID: asgId,
      assignment_id: asgId,
      Event_ID: eventId,
      event_id: eventId,
      User_ID: userId,
      user_id: userId,
      Assigned_Role: assignedRole,
      assigned_role: assignedRole
    };

    setEventVolunteers(prev => [...prev, newAssignment]);
    const event = events.find(e => String(e.Event_ID || e.event_id) === String(eventId));
    const user = users.find(u => String(u.User_ID || u.user_id) === String(userId));
    addToast('Volunteer Assigned', `${user?.Full_Name || user?.full_name || 'Volunteer'} allocated to "${event?.Title || event?.title || 'Event'}" as ${assignedRole}.`, 'success');
    return { success: true, assignment: newAssignment };
  };

  const removeVolunteerAssignment = async (assignmentId, reason = '') => {
    const asg = eventVolunteers.find(v => 
      String(v.Assignment_ID || v.assignment_id) === String(assignmentId)
    );
    if (!asg) return { success: false, error: 'Assignment not found' };

    const event = events.find(e => 
      String(e.Event_ID || e.event_id) === String(asg.Event_ID || asg.event_id)
    );

    // Permission check: strictly only that particular event's volunteer or event head can remove
    const isHead = 
      String(event?.Organizer_ID || event?.organizer_id) === String(currentUser.User_ID || currentUser.user_id) ||
      currentUser.admin_event_ids?.map(String).includes(String(event?.Event_ID || event?.event_id)) ||
      currentUser.Role === 'Admin' || currentUser.role === 'Admin';

    const isThisEventsVolunteer = eventVolunteers.some(v => 
      (String(v.Event_ID || v.event_id) === String(asg.Event_ID || asg.event_id)) &&
      (String(v.User_ID || v.user_id) === String(currentUser.User_ID || currentUser.user_id))
    );

    if (!isHead && !isThisEventsVolunteer) {
      addToast('Permission Denied', 'Only that particular event’s volunteer or head has the power to remove a volunteer.', 'error');
      return { success: false, error: 'Unauthorized' };
    }

    const removedUserId = String(asg.User_ID || asg.user_id);
    const eventTitle = event?.Title || event?.title || 'Event';
    const explanationReason = reason && reason.trim() ? reason.trim() : 'Duty unassigned by event coordinator';

    setEventVolunteers(prev => prev.filter(v => 
      String(v.Assignment_ID || v.assignment_id) !== String(assignmentId)
    ));

    // Create persistent volunteer dismissal notification
    const newNotif = {
      id: 'vnt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: removedUserId,
      event_id: String(asg.Event_ID || asg.event_id),
      event_title: eventTitle,
      role: asg.Assigned_Role || asg.assigned_role,
      reason: explanationReason,
      created_at: new Date().toISOString(),
      read: false
    };

    setVolunteerNotifications(prev => [newNotif, ...prev]);

    // If the removed volunteer is the currently logged in user, show immediate toast
    if (String(currentUser.User_ID || currentUser.user_id) === removedUserId) {
      addToast('Volunteer Duty Removed', `You were unassigned from "${eventTitle}". Reason: ${explanationReason}`, 'warning', 8000);
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const numAsgId = parseInt(String(assignmentId).replace(/\D/g, '') || '0', 10);
        if (numAsgId > 0) {
          const { error: delErr } = await client
            .from('event_volunteer')
            .delete()
            .eq('assignment_id', numAsgId);
          if (delErr) {
            console.error('Supabase Mutation Error (event_volunteer delete):', delErr.message, delErr.details);
          }
        }
      } catch (err) {
        console.error('Supabase removeVolunteerAssignment error:', err);
      }
    }

    addToast('Assignment Removed', 'Volunteer unassigned from duty and notification dispatched.', 'info');
    return { success: true };
  };

  // 9. USER ROLE SWITCHER / USER CREATION
  const createUser = (userData) => {
    const exists = users.find(u => u.Email.toLowerCase() === userData.Email.toLowerCase());
    if (exists) {
      addToast('User Exists', 'A user with this email address already exists.', 'error');
      return { success: false, error: 'Email must be unique' };
    }

    const newUser = {
      User_ID: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      Full_Name: userData.Full_Name,
      Email: userData.Email,
      Phone: userData.Phone || '+91 99999 00000',
      Role: userData.Role || 'Attendee',
      Created_At: new Date().toISOString(),
      Avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.Full_Name}`
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.User_ID);
    addToast('Profile Created', `Switched to new user: ${newUser.Full_Name} (${newUser.Role})`, 'success');
    return { success: true, user: newUser };
  };

  // 10. RESET TO SEED DEMO DATA
  const resetDatabaseToSeed = () => {
    setUsers(INITIAL_USERS);
    setVenues(INITIAL_VENUES);
    setCategories(INITIAL_CATEGORIES);
    setEvents(INITIAL_EVENTS);
    setRegistrations(INITIAL_REGISTRATIONS);
    setPayments(INITIAL_PAYMENTS);
    setEventVolunteers(INITIAL_VOLUNTEERS);
    setCurrentUserId(INITIAL_USERS[0].User_ID);
    localStorage.removeItem(STORAGE_KEY);
    addToast('Database Reset', 'All 7 tables reset to initial demonstration state.', 'info');
  };

  // =========================================================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // =========================================================================

  const login = async (email, password = '') => {
    if (!email || !email.trim()) {
      addToast('Input Required', 'Please enter your email address.', 'warning');
      return { success: false, error: 'Email address is required.' };
    }
    if (!password || !password.trim()) {
      addToast('Input Required', 'Please enter your password.', 'warning');
      return { success: false, error: 'Password is required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Query Supabase users table (verified against PostgreSQL schema)
    const client = getSupabaseClient();
    if (client) {
      try {
        let dbUser = null;

        // Query 'users' table directly (not 'USER')
        const { data: usersData, error: usersErr } = await client
          .from('users')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (usersData && !usersErr) {
          dbUser = usersData;
        }

        if (dbUser) {
          const userPassword = dbUser.password ?? dbUser.Password ?? dbUser.password_hash;
          // Verify password from users table
          if (!userPassword || userPassword !== cleanPassword) {
            addToast('Authentication Failed', 'Incorrect password for this account.', 'error');
            return { success: false, error: 'Incorrect password for this account.' };
          }

          const userObj = {
            User_ID: String(dbUser.user_id ?? dbUser.User_ID ?? dbUser.id ?? ('usr_' + Date.now().toString(36))),
            Full_Name: dbUser.full_name || dbUser.Full_Name || dbUser.name || 'User',
            Email: dbUser.email || dbUser.Email || cleanEmail,
            Password: userPassword,
            Phone: dbUser.phone || dbUser.Phone || '',
            Role: dbUser.role || dbUser.Role || 'Attendee',
            admin_event_ids: dbUser.admin_event_ids || [],
            Avatar: dbUser.avatar || dbUser.Avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
            Created_At: dbUser.created_at || dbUser.Created_At || new Date().toISOString()
          };

          setUsers(prev => {
            const exists = prev.some(u => u.User_ID === userObj.User_ID);
            return exists ? prev.map(u => u.User_ID === userObj.User_ID ? userObj : u) : [...prev, userObj];
          });

          setCurrentUserId(userObj.User_ID);
          setIsAuthenticated(true);
          localStorage.setItem('SYMVIAN_AUTH_SESSION', JSON.stringify(userObj));
          localStorage.setItem('SYMVIAN_CURRENT_USER_ID', userObj.User_ID);
          addToast('Welcome to SYMVIAN', `Signed in as ${userObj.Full_Name} (${userObj.Role})`, 'success');
          return { success: true, user: userObj };
        }
      } catch (err) {
        console.warn('Supabase auth query notice, falling back to local users database:', err);
      }
    }

    // 2. Local users table verification
    const matchedUser = users.find(u => u.Email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      const storedPassword = matchedUser.Password || matchedUser.password || 'password123';
      if (cleanPassword !== storedPassword) {
        addToast('Invalid Credentials', 'Incorrect password for this user.', 'error');
        return { success: false, error: 'Incorrect password for this user.' };
      }

      setCurrentUserId(matchedUser.User_ID);
      setIsAuthenticated(true);
      const session = {
        userId: matchedUser.User_ID,
        email: matchedUser.Email,
        fullName: matchedUser.Full_Name,
        role: matchedUser.Role,
        admin_event_ids: matchedUser.admin_event_ids || []
      };
      localStorage.setItem('SYMVIAN_AUTH_SESSION', JSON.stringify(session));
      localStorage.setItem('SYMVIAN_CURRENT_USER_ID', matchedUser.User_ID);
      addToast('Welcome back', `Signed in as ${matchedUser.Full_Name} (${matchedUser.Role})`, 'success');
      return { success: true, user: matchedUser };
    }

    addToast('Account Not Found', `No registered user with email "${cleanEmail}".`, 'error');
    return { success: false, error: `No registered account found with email "${cleanEmail}".` };
  };

  const registerUser = async ({ fullName, email, password, role = 'Attendee', phone = '' }) => {
    if (!email || !email.trim()) {
      addToast('Input Required', 'Please enter your email address.', 'warning');
      return { success: false, error: 'Email address is required.' };
    }
    if (!password || !password.trim()) {
      addToast('Input Required', 'Please enter a password.', 'warning');
      return { success: false, error: 'Password is required.' };
    }
    if (!fullName || !fullName.trim()) {
      addToast('Input Required', 'Please enter your full name.', 'warning');
      return { success: false, error: 'Full name is required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check unique email constraint locally
    if (users.some(u => u.Email.toLowerCase() === cleanEmail)) {
      addToast('Account Exists', 'A user with this email address is already registered.', 'error');
      return { success: false, error: 'A user with this email address is already registered.' };
    }

    let newUserId = 'usr_' + Date.now().toString(36);

    // Persist into Supabase users table if connected
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('users')
          .insert([
            {
              full_name: fullName.trim(),
              email: cleanEmail,
              password: cleanPassword,
              role: role,
              phone: phone.trim() || '+91 98450 00000',
              admin_event_ids: []
            }
          ])
          .select('user_id')
          .maybeSingle();

        if (error) {
          console.error('Supabase Mutation Error (users insert):', error.message, error.details);
        } else if (data) {
          newUserId = String(data.user_id || newUserId);
        }
      } catch (err) {
        console.error('Supabase register error:', err);
      }
    }

    const newUser = {
      User_ID: newUserId,
      Full_Name: fullName.trim(),
      Email: cleanEmail,
      Password: cleanPassword,
      Phone: phone.trim() || '+91 98450 00000',
      Role: role,
      admin_event_ids: [],
      Created_At: new Date().toISOString(),
      Avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName.trim())}`
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.User_ID);
    setIsAuthenticated(true);
    localStorage.setItem('SYMVIAN_AUTH_SESSION', JSON.stringify(newUser));
    localStorage.setItem('SYMVIAN_CURRENT_USER_ID', newUser.User_ID);
    addToast('Account Created', `Welcome to SYMVIAN, ${newUser.Full_Name}! Signed in as ${newUser.Role}.`, 'success');
    return { success: true, user: newUser };
  };

  const loginAsUser = (userId) => {
    const user = users.find(u => u.User_ID === userId) || INITIAL_USERS.find(u => u.User_ID === userId);
    if (user) {
      return login(user.Email, user.Password || 'password123');
    }
    return { success: false, error: 'User ID not found' };
  };

  const updateUserProfile = async ({ phone, fullName }) => {
    if (!currentUser) return { success: false, error: 'No active user' };
    const updates = {};
    if (phone !== undefined) {
      updates.Phone = phone;
      updates.phone = phone;
    }
    if (fullName !== undefined) {
      updates.Full_Name = fullName;
      updates.full_name = fullName;
    }

    setCurrentUser(updates);

    // Sync to Supabase if connected
    const client = getSupabaseClient();
    if (client) {
      try {
        const userId = currentUser.User_ID || currentUser.user_id;
        const numId = parseInt(String(userId).replace(/\D/g, '') || '0', 10);
        const dbUpdates = {};
        if (phone !== undefined) dbUpdates.phone = phone;
        if (fullName !== undefined) dbUpdates.full_name = fullName;

        // Update 'users' table only (not 'USER')
        if (numId > 0) {
          const { error } = await client.from('users').update(dbUpdates).eq('user_id', numId);
          if (error) {
            console.error('Supabase Mutation Error (users update):', error.message, error.details);
          }
        } else if (currentUser.Email || currentUser.email) {
          const { error } = await client.from('users').update(dbUpdates).ilike('email', currentUser.Email || currentUser.email);
          if (error) {
            console.error('Supabase Mutation Error (users email update):', error.message, error.details);
          }
        }
      } catch (err) {
        console.error('Supabase profile update error:', err);
      }
    }

    addToast('Profile Updated', 'Your profile details have been saved successfully.', 'success');
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('SYMVIAN_AUTH_SESSION');
    localStorage.removeItem('SYMVIAN_CURRENT_USER_ID');
    addToast('Signed Out', 'You have been safely signed out of SYMVIAN.', 'info');
  };

  // Supabase live sync or connection tester
  const connectSupabase = async (url, key) => {
    const res = await testSupabaseConnection(url, key);
    if (res.success) {
      setSupabaseConfig({
        url,
        key,
        isConnected: true,
        syncMode: 'live'
      });
      localStorage.setItem('SYMVIAN_SUPABASE_URL', url);
      localStorage.setItem('SYMVIAN_SUPABASE_KEY', key);
      addToast('Supabase Connected', 'Live PostgreSQL connection verified!', 'success');
      return { success: true };
    } else {
      addToast('Supabase Connection Failed', res.message, 'error');
      return { success: false, error: res.message };
    }
  };

  // Filter out events whose date has crossed (past events disappear from all tabs)
  const activeEvents = events.filter(e => {
    const d = e.Event_Date || e.event_date;
    if (!d) return true;
    return new Date(d) >= new Date();
  });

  return (
    <AppContext.Provider
      value={{
        // 7 Tables Data
        users,
        venues,
        categories,
        events: activeEvents,
        allEvents: events,
        registrations,
        payments,
        eventVolunteers,

        // User & Role State & Authentication
        currentUser,
        currentUserId,
        setCurrentUserId,
        setCurrentUser,
        currentRole: currentUser?.Role || 'Attendee',
        createUser,
        registerUser,
        isAuthenticated,
        login,
        loginAsUser,
        logout,
        updateUserProfile,

        // Navigation
        activeTab,
        setActiveTab,

        // Strict Event Access Control
        isEventAdmin: (event, user = currentUser) => isEventAdmin(event, user),

        // Business Operations
        registerForEvent,
        submitManualUpiPayment,
        cancelRegistration,
        cancelRegistrationSeat,
        markNotificationRead,
        retryRegistration,
        verifyPayment,
        admitWaitlistedMembers,
        createEvent,
        createEventWithAdmins,
        updateEvent,
        deleteEvent,
        createVenue,
        assignVolunteer,
        removeVolunteerAssignment,
        resetDatabaseToSeed,

        // Getters
        getUserRegistrations,
        getEventRegistrations,
        getEventWaitlist,
        getUserEventRegistration,
        getRegistrationPayment,

        // Notifications
        toasts,
        addToast,
        removeToast,
        volunteerNotifications,
        markVolunteerNotificationRead,

        // Supabase Integration
        supabaseConfig,
        setSupabaseConfig,
        connectSupabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
