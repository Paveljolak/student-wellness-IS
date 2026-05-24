import { useState } from 'react';
import toast from 'react-hot-toast';

function getSettings() {
  return {
    enabled:       localStorage.getItem('notif_enabled') === 'true',
    intervalHours: Number(localStorage.getItem('notif_interval_hours')) || 3,
  };
}

export default function NotificationSettings() {
  const [permission, setPermission] = useState(() => Notification.permission);
  const [settings,   setSettings]   = useState(getSettings);

  function save(updates) {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem('notif_enabled',        String(next.enabled));
    localStorage.setItem('notif_interval_hours', String(next.intervalHours));
    toast.success('Notification settings saved');
  }

  async function requestPermission() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success('Notifications enabled!');
    } else {
      toast.error('Permission denied — check your browser settings');
    }
  }

  const active = permission === 'granted' && settings.enabled;

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Reminder Notifications
      </h3>

      {permission === 'denied' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          Notifications are blocked in your browser. Open browser settings to allow them for this site.
        </div>
      )}

      {permission === 'default' && (
        <button onClick={requestPermission} className="btn-primary w-full mb-4">
          Allow browser notifications
        </button>
      )}

      {permission === 'granted' && (
        <p className="text-xs text-brand-600 font-medium mb-4">
          Browser notifications are allowed.
        </p>
      )}

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={e => save({ enabled: e.target.checked })}
            disabled={permission !== 'granted'}
            className="w-4 h-4 accent-brand-600 disabled:opacity-40"
          />
          <span className="text-sm text-gray-700">
            Remind me when food or water hasn't been logged
          </span>
        </label>

        <div>
          <label className="label">Remind me after (hours of inactivity)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="12"
              value={settings.intervalHours}
              onChange={e =>
                save({ intervalHours: Math.max(1, Math.min(12, Number(e.target.value))) })
              }
              disabled={!active}
              className="input w-24 disabled:opacity-40"
            />
            <span className="text-sm text-gray-400">
              hour{settings.intervalHours !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            A notification appears if no food or water is logged within this window.
            Checks run every 15 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
