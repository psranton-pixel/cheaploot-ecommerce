export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
  colorId?: string;
  eventType?: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation';
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
}

export type WarehouseScheduleEventType = 
  | 'pickup'           // Customer Click & Collect Pickup
  | 'intake'           // Supplier Bulk Lot Intake & Unloading
  | 'loot_drop'        // Flash Sale / Loot Drop Launch Time
  | 'inventory_audit'  // Warehouse Stocktake & Bin Audit
  | 'custom';          // Custom General Meeting / Note

export interface NewCalendarEventData {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  scheduleType?: WarehouseScheduleEventType;
  referenceId?: string;  // Order ID, Lot ID, SKU
}
