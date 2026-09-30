import { GoogleCalendarItem, GoogleCalendarEvent, NewCalendarEventData } from '../types/calendar';
import { getAccessToken } from './googleAuth';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

async function authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No active Google authentication token. Please sign in with Google first.');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = `Google Calendar API error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) {
        errorMessage = errData.error.message;
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }

  return response;
}

/**
 * Lists the user's calendars
 */
export async function listUserCalendars(): Promise<GoogleCalendarItem[]> {
  const response = await authenticatedFetch('/users/me/calendarList');
  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    primary: item.primary || false,
    backgroundColor: item.backgroundColor,
    foregroundColor: item.foregroundColor,
    accessRole: item.accessRole
  }));
}

/**
 * Lists events for a given calendar within an optional date range
 */
export async function listCalendarEvents(
  calendarId = 'primary',
  timeMin?: string,
  timeMax?: string,
  maxResults = 100
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: maxResults.toString()
  });

  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);

  const response = await authenticatedFetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`);
  const data = await response.json();
  return data.items || [];
}

/**
 * Creates a new event on the specified Google Calendar
 */
export async function createCalendarEvent(
  calendarId = 'primary',
  eventData: NewCalendarEventData
): Promise<GoogleCalendarEvent> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney';

  const payload: any = {
    summary: eventData.summary,
    description: eventData.description || '',
    location: eventData.location || 'CheapLoot Central Warehouse, Dock 3 (Geelong VIC 3215)',
    start: {
      dateTime: eventData.startDateTime,
      timeZone
    },
    end: {
      dateTime: eventData.endDateTime,
      timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 120 }
      ]
    },
    extendedProperties: {
      shared: {
        app: 'CheapLoot',
        scheduleType: eventData.scheduleType || 'custom',
        referenceId: eventData.referenceId || ''
      }
    }
  };

  const response = await authenticatedFetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return await response.json();
}

/**
 * Updates an existing calendar event (Requires explicit user confirmation before calling)
 */
export async function updateCalendarEvent(
  calendarId = 'primary',
  eventId: string,
  eventData: Partial<NewCalendarEventData>
): Promise<GoogleCalendarEvent> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney';

  const patchBody: any = {};
  if (eventData.summary !== undefined) patchBody.summary = eventData.summary;
  if (eventData.description !== undefined) patchBody.description = eventData.description;
  if (eventData.location !== undefined) patchBody.location = eventData.location;
  if (eventData.startDateTime) {
    patchBody.start = { dateTime: eventData.startDateTime, timeZone };
  }
  if (eventData.endDateTime) {
    patchBody.end = { dateTime: eventData.endDateTime, timeZone };
  }

  const response = await authenticatedFetch(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patchBody)
  });

  return await response.json();
}

/**
 * Deletes a calendar event (Requires explicit user confirmation dialog before calling)
 */
export async function deleteCalendarEvent(
  calendarId = 'primary',
  eventId: string
): Promise<void> {
  await authenticatedFetch(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE'
  });
}

/**
 * Helper to create a Click & Collect Pickup appointment on Google Calendar
 */
export async function scheduleClickAndCollectEvent(
  orderId: string,
  customerName: string,
  pickupDateTimeIso: string,
  itemsSummary: string
): Promise<GoogleCalendarEvent> {
  const startDate = new Date(pickupDateTimeIso);
  const endDate = new Date(startDate.getTime() + 45 * 60 * 1000); // 45 min slot

  return await createCalendarEvent('primary', {
    summary: `📦 CheapLoot Click & Collect: Order #${orderId}`,
    description: `Warehouse Collection Appointment\n\nOrder: #${orderId}\nCustomer: ${customerName}\nItems: ${itemsSummary}\n\nPlease bring Photo ID and Order Confirmation email to Dispatch Dock 3.`,
    location: 'CheapLoot Liquidation Hub - Dock 3, 110 Corio Quay Rd, North Geelong VIC 3215',
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    scheduleType: 'pickup',
    referenceId: orderId
  });
}

/**
 * Helper to create a Supplier Lot Delivery & Unloading slot
 */
export async function scheduleSupplierLotIntakeEvent(
  lotReference: string,
  supplierName: string,
  palletCount: number,
  intakeDateTimeIso: string
): Promise<GoogleCalendarEvent> {
  const startDate = new Date(intakeDateTimeIso);
  const endDate = new Date(startDate.getTime() + 90 * 60 * 1000); // 90 min slot

  return await createCalendarEvent('primary', {
    summary: `🚚 Lot Intake: ${supplierName} (${palletCount} Pallets)`,
    description: `Supplier Inbound Delivery & Verification\n\nLot Reference: ${lotReference}\nSupplier: ${supplierName}\nPallet Count: ${palletCount}\nAssigned Bay: Inbound Bay B\nInspection Checklist: Barcode scan, weight audit, packaging condition`,
    location: 'CheapLoot Inbound Receiving Bay B, 110 Corio Quay Rd, North Geelong VIC 3215',
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    scheduleType: 'intake',
    referenceId: lotReference
  });
}

/**
 * Helper to schedule a Flash Sale / Loot Drop reminder event
 */
export async function scheduleLootDropReminderEvent(
  productTitle: string,
  sku: string,
  dropDateTimeIso: string,
  price: number
): Promise<GoogleCalendarEvent> {
  const startDate = new Date(dropDateTimeIso);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hr window

  return await createCalendarEvent('primary', {
    summary: `🔥 CheapLoot Flash Drop: ${productTitle}`,
    description: `Exclusive Warehouse Liquidation Drop Live Event!\n\nProduct: ${productTitle}\nSKU: ${sku}\nPrice Smash: $${price.toFixed(2)} AUD\nLimited units available until sold out.`,
    location: 'https://cheaploot.com.au (Online Warehouse)',
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    scheduleType: 'loot_drop',
    referenceId: sku
  });
}
