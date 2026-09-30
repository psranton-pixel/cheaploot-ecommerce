import React, { useState } from 'react';
import { Calendar, Check, Plus, Loader2 } from 'lucide-react';
import { getAccessToken, googleSignIn } from '../../lib/googleAuth';
import { createCalendarEvent } from '../../lib/googleCalendar';
import { NewCalendarEventData } from '../../types/calendar';

interface Props {
  eventData: NewCalendarEventData;
  label?: string;
  buttonClass?: string;
  onSuccess?: () => void;
}

export const AddToCalendarButton: React.FC<Props> = ({
  eventData,
  label = 'Add to Google Calendar',
  buttonClass = 'px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-[#B8E62E] text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors',
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        // Trigger Google Sign In flow
        const result = await googleSignIn();
        token = result.accessToken;
      }

      await createCalendarEvent('primary', eventData);
      setAdded(true);
      if (onSuccess) onSuccess();
      setTimeout(() => setAdded(false), 4000);
    } catch (err: any) {
      console.error('Failed to add to Google Calendar:', err);
      setError(err.message || 'Failed to sync with Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleAddToCalendar}
        disabled={loading || added}
        className={buttonClass}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : added ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Calendar className="w-3.5 h-3.5" />
        )}
        <span>{added ? 'Added to Google Calendar!' : label}</span>
      </button>

      {error && (
        <span className="text-[10px] text-red-400 font-mono">
          {error}
        </span>
      )}
    </div>
  );
};
