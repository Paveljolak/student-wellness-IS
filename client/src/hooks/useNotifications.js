import { useEffect, useRef } from 'react';
import { foodLogsApi }  from '../api/foodLogs';
import { waterLogsApi } from '../api/waterLogs';

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // poll every 15 minutes

function todayStr() { return new Date().toISOString().split('T')[0]; }

function getSettings() {
  return {
    enabled:       localStorage.getItem('notif_enabled') === 'true',
    intervalHours: Number(localStorage.getItem('notif_interval_hours')) || 3,
  };
}

// Use 7am as baseline when no logs today, so the first reminder fires at 7am + intervalHours
function dayBaseTime() {
  const d = new Date(todayStr() + 'T07:00:00');
  return d.getTime();
}

export function useNotifications() {
  const lastFoodNotif  = useRef(null);
  const lastWaterNotif = useRef(null);

  useEffect(() => {
    async function check() {
      const { enabled, intervalHours } = getSettings();
      if (!enabled || Notification.permission !== 'granted') return;

      const thresholdMs = intervalHours * 60 * 60 * 1000;
      const now = Date.now();

      try {
        const [fRes, wRes] = await Promise.all([
          foodLogsApi.getByDate(todayStr()),
          waterLogsApi.getByDate(todayStr()),
        ]);

        // ── Food check ──
        const foodLogs = fRes.data.logs ?? [];
        const lastFoodTime = foodLogs.length > 0
          ? Math.max(...foodLogs.map(l => new Date(l.created_at).getTime()))
          : dayBaseTime();

        const foodOverdue          = now - lastFoodTime > thresholdMs;
        const foodNotifiedRecently = lastFoodNotif.current && now - lastFoodNotif.current < thresholdMs;

        if (foodOverdue && !foodNotifiedRecently) {
          new Notification('Time to eat! 🍽️', {
            body: `No food logged in the last ${intervalHours}h. Don't forget to track your meals.`,
            icon: '/favicon.ico',
            tag:  'food-reminder',
          });
          lastFoodNotif.current = now;
        }

        // ── Water check ──
        const waterLogs = wRes.data.logs ?? [];
        const lastWaterTime = waterLogs.length > 0
          ? Math.max(...waterLogs.map(l => new Date(l.created_at).getTime()))
          : dayBaseTime();

        const waterOverdue          = now - lastWaterTime > thresholdMs;
        const waterNotifiedRecently = lastWaterNotif.current && now - lastWaterNotif.current < thresholdMs;

        if (waterOverdue && !waterNotifiedRecently) {
          new Notification('Stay hydrated! 💧', {
            body: `No water logged in the last ${intervalHours}h. Remember to drink water.`,
            icon: '/favicon.ico',
            tag:  'water-reminder',
          });
          lastWaterNotif.current = now;
        }
      } catch {
        // notifications are non-critical — fail silently
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
