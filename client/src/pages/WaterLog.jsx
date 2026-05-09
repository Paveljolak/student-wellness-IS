import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { waterLogsApi } from '../api/waterLogs';
import { useAuth }      from '../context/AuthContext';
import WaterWidget      from '../components/WaterWidget';

const QUICK_AMOUNTS = [150, 250, 330, 500, 750];

function todayStr() { return new Date().toISOString().split('T')[0]; }
function shiftDate(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function WaterLog() {
  const { user }   = useAuth();
  const targetMl   = user?.targets?.water_ml || 2000;

  const [date,      setDate]      = useState(todayStr());
  const [logs,      setLogs]      = useState([]);
  const [totalMl,   setTotalMl]   = useState(0);
  const [custom,    setCustom]    = useState('');
  const [loading,   setLoading]   = useState(false);

  const loadLogs = useCallback(async (d) => {
    setLoading(true);
    try {
      const { data } = await waterLogsApi.getByDate(d);
      setLogs(data.logs);
      setTotalMl(data.total_ml);
    } catch { toast.error('Failed to load water logs'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { loadLogs(date); }, [date, loadLogs]);

  async function addWater(ml) {
    if (!ml || ml <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      const { data } = await waterLogsApi.add(ml, date);
      setLogs(prev => [...prev, data.log]);
      setTotalMl(prev => prev + ml);
      toast.success(`+${ml} ml logged`);
    } catch { toast.error('Failed to log water'); }
  }

  async function removeLog(id, ml) {
    try {
      await waterLogsApi.delete(id);
      setLogs(prev => prev.filter(l => l.id !== id));
      setTotalMl(prev => prev - ml);
      toast.success('Entry removed');
    } catch { toast.error('Failed to delete'); }
  }

  function handleCustom(e) {
    e.preventDefault();
    const ml = Number(custom);
    if (!ml || ml <= 0) { toast.error('Enter a valid ml amount'); return; }
    addWater(ml);
    setCustom('');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header + date nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Water Intake</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(d => shiftDate(d, -1))} className="btn-secondary px-3 py-1.5 text-sm">‹</button>
          <input
            type="date"
            value={date}
            max={todayStr()}
            onChange={e => setDate(e.target.value)}
            className="input w-auto text-sm"
          />
          <button
            onClick={() => setDate(d => shiftDate(d, 1))}
            disabled={date >= todayStr()}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
          >›</button>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Daily Progress</h3>
        <WaterWidget consumedMl={totalMl} targetMl={targetMl} />

        {/* Water glass visual */}
        <div className="flex justify-center mt-6">
          <div className="relative w-20 h-32 border-4 border-blue-300 rounded-b-xl overflow-hidden bg-blue-50">
            <div
              className="absolute bottom-0 left-0 right-0 bg-blue-400 transition-all duration-700"
              style={{ height: `${Math.min((totalMl / targetMl) * 100, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow">{Math.round((totalMl / targetMl) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick add */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Add</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_AMOUNTS.map(ml => (
            <button key={ml} onClick={() => addWater(ml)} className="btn-secondary text-sm">
              💧 {ml} ml
            </button>
          ))}
        </div>
        <form onSubmit={handleCustom} className="flex gap-2">
          <input
            className="input flex-1"
            type="number"
            min="10"
            max="5000"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Custom amount (ml)"
          />
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </div>

      {/* Log list */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Log Entries ({logs.length})
        </h3>
        {loading ? (
          <div className="text-center text-gray-400 py-6">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-3xl mb-2">💧</p>
            <p>No water logged for this day yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {[...logs].reverse().map(l => (
              <li key={l.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-blue-400 text-lg">💧</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-600">{l.amount_ml} ml</p>
                    <p className="text-xs text-gray-400">{fmtTime(l.created_at)}</p>
                  </div>
                </div>
                <button onClick={() => removeLog(l.id, l.amount_ml)} className="btn-danger">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Daily target info */}
      <div className="card bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>Your daily target:</strong> {(targetMl / 1000).toFixed(1)} L
          — calculated from your weight ({user?.weight_kg} kg) and activity level.
        </p>
      </div>
    </div>
  );
}
