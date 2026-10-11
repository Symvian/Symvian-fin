/**
 * Strict Event Administrative Access Control
 * 
 * Access Rule:
 * (currentUser?.admin_event_ids && currentUser.admin_event_ids.includes(event.event_id))
 * OR
 * event.organizer_id === currentUser?.user_id
 */
export const isEventAdmin = (event, user) => {
  if (!event || !user) return false;

  const eventId = event.event_id ?? event.Event_ID;
  const orgId = event.organizer_id ?? event.Organizer_ID;
  const userId = user.user_id ?? user.User_ID;

  // 1. Strict Check: currentUser.admin_event_ids && currentUser.admin_event_ids.includes(event.event_id)
  const adminEventIds = Array.isArray(user.admin_event_ids) ? user.admin_event_ids : [];
  const hasInAdminList = adminEventIds.some(aid => 
    String(aid) === String(eventId) || Number(aid) === Number(eventId)
  );

  // 2. Strict Check: event.organizer_id === currentUser.user_id
  const isOrganizer = (orgId !== undefined && userId !== undefined) && (
    String(orgId) === String(userId) ||
    Number(orgId) === Number(userId)
  );

  // 3. System Admin override
  const isSystemAdmin = user.role === 'Admin' || user.Role === 'Admin';

  return Boolean(hasInAdminList || isOrganizer || isSystemAdmin);
};

export const canManageEvent = isEventAdmin;
