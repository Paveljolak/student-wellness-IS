import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { foodLogsApi } from '../api/foodLogs';
import { waterLogsApi } from '../api/waterLogs';
import MacroRing from '../components/MacroRing';
import WaterWidget from '../components/WaterWidget';
import toast from 'react-hot-toast';

const TODAY = new Date().toISOString().split('T')[0];

function sumLogs(logs) {
  return logs.reduce(
    (acc, l) => ({
      calories:  acc.calories  + Number(l.calories),
      protein_g: acc.protein_g + Number(l.protein_g),
      carbs_g:   acc.carbs_g   + Number(l.carbs_g),
      fat_g:     acc.fat_g     + Number(l.fat_g),
      fiber_g:   acc.fiber_g   + Number(l.fiber_g),
      sugar_g:   acc.sugar_g   + Number(l.sugar_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0 }
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const targets  = user?.targets || {};

  const [logs,     setLogs]     = useState([]);
  const [waterMl,  setWaterMl]  = useState(0);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      foodLogsApi.getByDate(TODAY),
      waterLogsApi.getByDate(TODAY),
    ])
      .then(([fRes, wRes]) => {
        setLogs(fRes.data.logs);
        setWaterMl(wRes.data.total_ml);
      })
      .catch(() => toast.error('Failed to load today\'s data'))
      .finally(() => setLoading(false));
  }, []);

  const totals = sumLogs(logs);
  const recentLogs = logs.slice(-4).reverse();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{greeting()}, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-gray-500 mt-0.5">{formatDate(TODAY)}</p>
      </div>

      {/* Macro rings */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Today's Macros</h3>
        {loading ? (
          <div className="flex justify-center py-8 text-gray-400">Loading…</div>
        ) : (
          <div className="flex flex-wrap justify-around gap-4">
            <MacroRing label="Calories" consumed={totals.calories}  target={targets.calories  || 0} unit="kcal" color="#f59e0b" size={130} />
            <MacroRing label="Protein"  consumed={totals.protein_g} target={targets.protein_g || 0} unit="g"    color="#3b82f6" />
            <MacroRing label="Carbs"    consumed={totals.carbs_g}   target={targets.carbs_g   || 0} unit="g"    color="#f97316" />
            <MacroRing label="Fat"      consumed={totals.fat_g}     target={targets.fat_g     || 0} unit="g"    color="#ec4899" />
            <MacroRing label="Fiber"    consumed={totals.fiber_g}   target={targets.fiber_g   || 0} unit="g"    color="#10b981" />
            <MacroRing label="Sugar"    consumed={totals.sugar_g}   target={targets.sugar_g   || 0} unit="g"    color="#8b5cf6" />
          </div>
        )}
      </div>

      {/* Water */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Water Intake</h3>
          <Link to="/water" className="text-xs text-brand-600 font-medium hover:underline">Manage →</Link>
        </div>
        <WaterWidget consumedMl={waterMl} targetMl={targets.water_ml || 2000} />
      </div>

      {/* Remaining macros */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Remaining Today</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Calories', val: targets.calories  - totals.calories,  unit: 'kcal', color: 'text-amber-600' },
            { label: 'Protein',  val: targets.protein_g - totals.protein_g, unit: 'g',    color: 'text-blue-600' },
            { label: 'Carbs',    val: targets.carbs_g   - totals.carbs_g,   unit: 'g',    color: 'text-orange-500' },
            { label: 'Fat',      val: targets.fat_g     - totals.fat_g,     unit: 'g',    color: 'text-pink-500' },
            { label: 'Fiber',    val: targets.fiber_g   - totals.fiber_g,   unit: 'g',    color: 'text-emerald-600' },
            { label: 'Sugar max',val: targets.sugar_g   - totals.sugar_g,   unit: 'g',    color: 'text-violet-600' },
          ].map(({ label, val, unit, color }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className={`text-lg font-bold ${val < 0 ? 'text-red-500' : color}`}>
                {val < 0 ? '−' : ''}{Math.abs(Math.round(val))}<span className="text-xs font-normal ml-0.5">{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent food entries */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Food Entries</h3>
          <Link to="/food-log" className="text-xs text-brand-600 font-medium hover:underline">Log food →</Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No food logged today yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentLogs.map(l => (
              <li key={l.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">{l.name_sl}</p>
                  <p className="text-xs text-gray-400">{l.grams}g · {l.meal_type}</p>
                </div>
                <span className="text-sm font-semibold text-amber-600">{Math.round(l.calories)} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
