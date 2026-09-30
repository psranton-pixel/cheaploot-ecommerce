import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Plus, RefreshCw, Trash2, 
  Edit3, ExternalLink, AlertTriangle, CheckCircle2, ShieldAlert, 
  Filter, Tag, ChevronLeft, ChevronRight, User as UserIcon, LogOut,
  CalendarCheck, Truck, Package, Flame, Check, HelpCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleCalendarItem, GoogleCalendarEvent, NewCalendarEventData, WarehouseScheduleEventType } from '../../types/calendar';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from '../../lib/googleAuth';
import { 
  listUserCalendars, 
  listCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from '../../lib/googleCalendar';
import { GoogleSignInButton } from './GoogleSignInButton';

export const GoogleCalendarHub: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Calendars & Events State
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter State
  const [typeFilter, setTypeFilter] = useState<'all' | WarehouseScheduleEventType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Event Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState<{
    summary: string;
    description: string;
    location: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    scheduleType: WarehouseScheduleEventType;
    referenceId: string;
  }>({
    summary: '',
    description: '',
    location: 'CheapLoot Warehouse Hub - 110 Corio Quay Rd, North Geelong VIC 3215',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '11:00',
    scheduleType: 'pickup',
    referenceId: ''
  });

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<GoogleCalendarEvent | null>(null);
  const [editFormData, setEditFormData] = useState<{
    summary: string;
    description: string;
    location: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  }>({
    summary: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });

  // Destructive Confirmation Dialog State (MANDATORY per Workspace Skill)
  const [deleteConfirmationEvent, setDeleteConfirmationEvent] = useState<GoogleCalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsAuthLoading(false);
      },
      () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Fetch Calendars and Events when authenticated
  const loadCalendarData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingEvents(true);
    setErrorMessage(null);

    try {
      // List Calendars
      const calList = await listUserCalendars();
      setCalendars(calList);

      // Fetch Events for next 60 days & previous 7 days
      const now = new Date();
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

      const eventList = await listCalendarEvents(selectedCalendarId, timeMin, timeMax);
      setEvents(eventList);
    } catch (err: any) {
      console.error('Failed to load Google Calendar data:', err);
      setErrorMessage(err.message || 'Failed to fetch calendar events from Google Calendar API');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isAuthenticated, selectedCalendarId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCalendarData();
    }
  }, [isAuthenticated, selectedCalendarId, loadCalendarData]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      setSuccessMessage('Successfully connected to Google Calendar!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Sign in failure:', err);
      setErrorMessage(err.message || 'Google Sign In failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    await logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setEvents([]);
    setCalendars([]);
  };

  // Preset Template Helper
  const applyPresetTemplate = (type: WarehouseScheduleEventType) => {
    const today = new Date().toISOString().split('T')[0];
    if (type === 'pickup') {
      setNewEventData({
        summary: '📦 CheapLoot Click & Collect: Order #ORD-8492',
        description: 'Customer pickup at Geelong Warehouse Dispatch Dock 3.\nPlease show photo ID and order barcode upon arrival.',
        location: 'CheapLoot Warehouse - Dispatch Dock 3, 110 Corio Quay Rd, North Geelong VIC 3215',
        startDate: today,
        startTime: '14:00',
        endDate: today,
        endTime: '14:45',
        scheduleType: 'pickup',
        referenceId: 'ORD-8492'
      });
    } else if (type === 'intake') {
      setNewEventData({
        summary: '🚚 Supplier Lot Intake: Inbound Pallet Delivery (4 Pallets)',
        description: 'Inbound freight delivery of liquidation tools & hardware overstock.\nForklift unloading and intake check at Receiving Bay B.',
        location: 'CheapLoot Inbound Receiving Bay B, 110 Corio Quay Rd, North Geelong VIC 3215',
        startDate: today,
        startTime: '09:00',
        endDate: today,
        endTime: '10:30',
        scheduleType: 'intake',
        referenceId: 'LOT-2026-08'
      });
    } else if (type === 'loot_drop') {
      setNewEventData({
        summary: '🔥 Flash Loot Drop: Milwaukee 18V & DeWalt Clearance 70% Off',
        description: 'Exclusive warehouse liquidation drop event goes live on CheapLoot.\nSpecial limited allocations available until sold out.',
        location: 'https://cheaploot.com.au (Online Warehouse)',
        startDate: today,
        startTime: '18:00',
        endDate: today,
        endTime: '19:00',
        scheduleType: 'loot_drop',
        referenceId: 'DROP-DEWALT-70'
      });
    } else if (type === 'inventory_audit') {
      setNewEventData({
        summary: '📋 Warehouse Bin Audit & Stocktake (Aisle W1-A to W1-C)',
        description: 'Scheduled physical inventory count and shelf location verification.',
        location: 'CheapLoot Main Aisle W1, Geelong VIC 3215',
        startDate: today,
        startTime: '08:00',
        endDate: today,
        endTime: '10:00',
        scheduleType: 'inventory_audit',
        referenceId: 'AUDIT-W1'
      });
    }
  };

  // Handle Create Event
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.summary.trim()) return;

    setIsSubmittingNew(true);
    setErrorMessage(null);

    try {
      const startDateTime = new Date(`${newEventData.startDate}T${newEventData.startTime}:00`).toISOString();
      const endDateTime = new Date(`${newEventData.endDate}T${newEventData.endTime}:00`).toISOString();

      await createCalendarEvent(selectedCalendarId, {
        summary: newEventData.summary,
        description: newEventData.description,
        location: newEventData.location,
        startDateTime,
        endDateTime,
        scheduleType: newEventData.scheduleType,
        referenceId: newEventData.referenceId
      });

      setSuccessMessage('Event successfully added to your Google Calendar!');
      setIsCreateModalOpen(false);
      await loadCalendarData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to create calendar event:', err);
      setErrorMessage(err.message || 'Failed to create event in Google Calendar');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (event: GoogleCalendarEvent) => {
    const startStr = event.start?.dateTime || event.start?.date || '';
    const endStr = event.end?.dateTime || event.end?.date || '';

    const startDate = startStr.includes('T') ? startStr.split('T')[0] : startStr;
    const startTime = startStr.includes('T') ? startStr.split('T')[1].substring(0, 5) : '09:00';
    const endDate = endStr.includes('T') ? endStr.split('T')[0] : endStr;
    const endTime = endStr.includes('T') ? endStr.split('T')[1].substring(0, 5) : '10:00';

    setEditingEvent(event);
    setEditFormData({
      summary: event.summary || '',
      description: event.description || '',
      location: event.location || '',
      startDate,
      startTime,
      endDate,
      endTime
    });
  };

  // Handle Update Event (Mutating Action)
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      const startDateTime = new Date(`${editFormData.startDate}T${editFormData.startTime}:00`).toISOString();
      const endDateTime = new Date(`${editFormData.endDate}T${editFormData.endTime}:00`).toISOString();

      await updateCalendarEvent(selectedCalendarId, editingEvent.id, {
        summary: editFormData.summary,
        description: editFormData.description,
        location: editFormData.location,
        startDateTime,
        endDateTime
      });

      setSuccessMessage('Google Calendar event updated successfully!');
      setEditingEvent(null);
      await loadCalendarData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update event:', err);
      setErrorMessage(err.message || 'Failed to update Google Calendar event');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Event with Explicit Confirmation Dialog (Mandatory per Skill)
  const handleConfirmDelete = async () => {
    if (!deleteConfirmationEvent) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteCalendarEvent(selectedCalendarId, deleteConfirmationEvent.id);
      setSuccessMessage(`Deleted "${deleteConfirmationEvent.summary}" from Google Calendar.`);
      setDeleteConfirmationEvent(null);
      await loadCalendarData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      setErrorMessage(err.message || 'Failed to delete event from Google Calendar');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and search events
  const filteredEvents = events.filter(event => {
    const sharedType = event.extendedProperties?.shared?.scheduleType;
    if (typeFilter !== 'all') {
      if (sharedType !== typeFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSummary = (event.summary || '').toLowerCase().includes(q);
      const matchDesc = (event.description || '').toLowerCase().includes(q);
      const matchLoc = (event.location || '').toLowerCase().includes(q);
      if (!matchSummary && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#181a20] border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-[#4285F4] text-white px-2 py-0.5 rounded">
                Google Workspace Integration
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-[#4285F4]" />
                Google Calendar & Warehouse Scheduling Hub
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Sync Click & Collect customer pickups, supplier liquidation lot deliveries, flash sale loot drops, and inventory audit schedules directly to your personal and organizational Google Calendars with real-time two-way synchronization.
            </p>
          </div>

          {/* Auth Controls */}
          <div>
            {isAuthLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin text-[#B8E62E]" />
                Checking Google connection...
              </div>
            ) : isAuthenticated && currentUser ? (
              <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 p-2 rounded-xl">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-8 h-8 rounded-full border border-neutral-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white text-xs font-bold">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold text-white truncate max-w-[140px]">
                      {currentUser.displayName || currentUser.email}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Calendar Synced
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <GoogleSignInButton
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  text={isSigningIn ? 'Connecting to Google...' : 'Connect Google Calendar'}
                />
                <span className="text-[10px] text-gray-400">
                  Authorizes calendar event sync with user permission
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* When Not Authenticated State */}
      {!isAuthenticated && !isAuthLoading && (
        <div className="bg-[#16181D] border border-neutral-800 rounded-2xl p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#4285F4] flex items-center justify-center mx-auto shadow-inner">
            <CalendarIcon className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-black uppercase text-white">Connect Your Google Calendar</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sign in with your Google account to view upcoming warehouse collection slots, automatically sync dispatch appointments, book supplier lot unloading times, and get reminders before liquidation drops go live.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <GoogleSignInButton
              onClick={handleSignIn}
              disabled={isSigningIn}
              text="Sign in with Google to View Calendar"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6 text-left border-t border-neutral-800/80">
            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#B8E62E]" />
                Click & Collect Pickups
              </div>
              <p className="text-[11px] text-gray-400">
                Book a 45-minute dispatch slot at Geelong Warehouse Dock 3 and receive automated calendar notifications.
              </p>
            </div>

            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-400" />
                Supplier Lot Receiving
              </div>
              <p className="text-[11px] text-gray-400">
                Schedule inbound freight delivery windows, pallet unloading slots, and manifest barcode intake audits.
              </p>
            </div>

            <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#E21C21]" />
                Flash Liquidation Drops
              </div>
              <p className="text-[11px] text-gray-400">
                Never miss heavy discount drop events with direct 1-click reminders in your Google Calendar schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Authenticated Calendar Interface */}
      {isAuthenticated && (
        <div className="space-y-6">
          {/* Controls & Quick Actions Bar */}
          <div className="bg-[#181a20] border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            {/* Calendar Selector & Refresh */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-gray-400">Active Calendar:</span>
                <select
                  value={selectedCalendarId}
                  onChange={e => setSelectedCalendarId(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 text-white text-xs font-medium rounded-lg px-3 py-2 focus:outline-none focus:border-[#B8E62E]"
                >
                  <option value="primary">Primary Google Calendar</option>
                  {calendars
                    .filter(c => c.id !== 'primary')
                    .map(cal => (
                      <option key={cal.id} value={cal.id}>
                        {cal.summary} {cal.primary ? '(Primary)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                onClick={loadCalendarData}
                disabled={isLoadingEvents}
                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-gray-300 rounded-lg border border-neutral-700 transition-colors disabled:opacity-50"
                title="Refresh Calendar Events"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingEvents ? 'animate-spin text-[#B8E62E]' : ''}`} />
              </button>
            </div>

            {/* Quick Type Filter & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="bg-neutral-900 border border-neutral-700 text-white text-xs rounded-lg px-3 py-2 pl-8 focus:outline-none focus:border-[#B8E62E] placeholder-gray-500"
                />
                <Filter className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              </div>

              <button
                type="button"
                onClick={() => {
                  applyPresetTemplate('pickup');
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 bg-[#B8E62E] hover:bg-[#a5d126] text-[#14161A] text-xs font-black uppercase rounded-lg flex items-center gap-1.5 transition-colors shadow"
              >
                <Plus className="w-4 h-4" />
                Schedule New Event
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setTypeFilter('pickup')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${
                typeFilter === 'pickup'
                  ? 'bg-[#B8E62E] text-black border-[#B8E62E]'
                  : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Click & Collect Pickups
            </button>
            <button
              onClick={() => setTypeFilter('intake')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${
                typeFilter === 'intake'
                  ? 'bg-sky-400 text-black border-sky-400'
                  : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Supplier Lot Intakes
            </button>
            <button
              onClick={() => setTypeFilter('loot_drop')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${
                typeFilter === 'loot_drop'
                  ? 'bg-[#E21C21] text-white border-[#E21C21]'
                  : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Flash Sale Drops
            </button>
          </div>

          {/* Events List / Timeline */}
          <div className="space-y-3">
            {isLoadingEvents ? (
              <div className="p-16 text-center bg-[#16181D] rounded-2xl border border-neutral-800 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#B8E62E] mx-auto" />
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Syncing with Google Calendar API...
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-12 text-center bg-[#16181D] rounded-2xl border border-neutral-800 space-y-3">
                <CalendarCheck className="w-10 h-10 text-gray-600 mx-auto" />
                <div className="text-sm font-bold text-white">No Google Calendar Events Found</div>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  {searchQuery || typeFilter !== 'all' 
                    ? 'No events match your search or category filter. Try clearing filters.' 
                    : 'Your calendar is currently clear. Click "Schedule New Event" to book a warehouse appointment or drop reminder.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map(event => {
                  const startStr = event.start?.dateTime || event.start?.date || '';
                  const endStr = event.end?.dateTime || event.end?.date || '';
                  const startDate = startStr ? new Date(startStr) : null;
                  const endDate = endStr ? new Date(endStr) : null;

                  const sharedType = event.extendedProperties?.shared?.scheduleType as WarehouseScheduleEventType | undefined;

                  return (
                    <div
                      key={event.id}
                      className="p-5 bg-[#181a20] hover:bg-[#1f222a] border border-neutral-800 rounded-xl transition-all space-y-3 flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        {/* Event Header with Tag & External Link */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {sharedType === 'pickup' ? (
                              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-black uppercase rounded flex items-center gap-1">
                                <Package className="w-3 h-3" /> Pickup
                              </span>
                            ) : sharedType === 'intake' ? (
                              <span className="px-2 py-0.5 bg-sky-950 border border-sky-800 text-sky-300 text-[10px] font-black uppercase rounded flex items-center gap-1">
                                <Truck className="w-3 h-3" /> Intake
                              </span>
                            ) : sharedType === 'loot_drop' ? (
                              <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-300 text-[10px] font-black uppercase rounded flex items-center gap-1">
                                <Flame className="w-3 h-3" /> Flash Drop
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-gray-300 text-[10px] font-black uppercase rounded">
                                Event
                              </span>
                            )}

                            <span className="text-[11px] font-mono text-gray-400">
                              {startDate ? startDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : 'All Day'}
                            </span>
                          </div>

                          {event.htmlLink && (
                            <a
                              href={event.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
                              title="Open in Google Calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-sm text-white leading-snug">
                          {event.summary || '(No title)'}
                        </h3>

                        {/* Timing */}
                        <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
                          <Clock className="w-3.5 h-3.5 text-[#B8E62E] flex-shrink-0" />
                          <span>
                            {startDate ? startDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : ''}
                            {endDate ? ` - ${endDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>

                        {/* Location */}
                        {event.location && (
                          <div className="flex items-start gap-2 text-xs text-gray-400">
                            <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}

                        {/* Description snippet */}
                        {event.description && (
                          <p className="text-xs text-gray-400 line-clamp-2 pt-1 border-t border-neutral-800/60 font-sans">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Action Bar (Edit & Delete with explicit user confirmation) */}
                      <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-gray-500">ID: {event.id.slice(0, 8)}...</span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(event)}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmationEvent(event)}
                            className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/60 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14161A] border border-neutral-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase bg-[#4285F4] text-white px-2 py-0.5 rounded">
                  Google Calendar API
                </span>
                <h2 className="text-base font-black uppercase text-white mt-1">
                  Schedule New Calendar Event
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Quick Template Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-gray-400">Quick Templates:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('pickup')}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left text-xs text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <Package className="w-3.5 h-3.5 text-[#B8E62E]" />
                  <span>Click & Collect</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('intake')}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left text-xs text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Supplier Lot Intake</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('loot_drop')}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left text-xs text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <Flame className="w-3.5 h-3.5 text-[#E21C21]" />
                  <span>Flash Sale Drop</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('inventory_audit')}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left text-xs text-gray-300 hover:text-white flex items-center gap-2"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Warehouse Audit</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Event Summary / Title *</label>
                <input
                  type="text"
                  required
                  value={newEventData.summary}
                  onChange={e => setNewEventData({ ...newEventData, summary: e.target.value })}
                  placeholder="e.g. Click & Collect Pickup: Order #1042"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newEventData.startDate}
                    onChange={e => setNewEventData({ ...newEventData, startDate: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newEventData.startTime}
                    onChange={e => setNewEventData({ ...newEventData, startTime: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newEventData.endDate}
                    onChange={e => setNewEventData({ ...newEventData, endDate: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEventData.endTime}
                    onChange={e => setNewEventData({ ...newEventData, endTime: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Location / Dock Address</label>
                <input
                  type="text"
                  value={newEventData.location}
                  onChange={e => setNewEventData({ ...newEventData, location: e.target.value })}
                  placeholder="e.g. Geelong Warehouse Dock 3"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Description & Instructions</label>
                <textarea
                  rows={3}
                  value={newEventData.description}
                  onChange={e => setNewEventData({ ...newEventData, description: e.target.value })}
                  placeholder="Notes, order reference, checklist..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2 bg-[#B8E62E] hover:bg-[#a5d126] text-[#14161A] font-black uppercase rounded-lg shadow disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Creating in Google Calendar...' : 'Confirm & Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14161A] border border-neutral-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded">
                  Edit Operation
                </span>
                <h2 className="text-base font-black uppercase text-white mt-1">
                  Update Google Calendar Event
                </h2>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-gray-400 hover:text-white text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Event Summary / Title *</label>
                <input
                  type="text"
                  required
                  value={editFormData.summary}
                  onChange={e => setEditFormData({ ...editFormData, summary: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.startDate}
                    onChange={e => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editFormData.startTime}
                    onChange={e => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.endDate}
                    onChange={e => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={editFormData.endTime}
                    onChange={e => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Location</label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={e => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#B8E62E]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase rounded-lg shadow disabled:opacity-50"
                >
                  {isUpdating ? 'Saving to Google...' : 'Save & Sync Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG FOR MUTATION / DELETION (SKILL COMPLIANT) */}
      {deleteConfirmationEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#16181D] border border-red-900/80 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-white">Delete Calendar Event?</h3>
                <p className="text-[11px] text-gray-400">This action will remove the event from your Google Calendar.</p>
              </div>
            </div>

            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
              <div className="font-bold text-white line-clamp-1">{deleteConfirmationEvent.summary}</div>
              {deleteConfirmationEvent.location && (
                <div className="text-gray-400 text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="line-clamp-1">{deleteConfirmationEvent.location}</span>
                </div>
              )}
              <div className="text-[11px] font-mono text-gray-500">
                Calendar: {selectedCalendarId}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationEvent(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded-lg flex items-center gap-1.5 shadow disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
