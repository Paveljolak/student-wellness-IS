import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { foodLogsApi } from '../api/foodLogs';
import { foodsApi }    from '../api/foods';
import { useAuth }     from '../context/AuthContext';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

function todayStr() { return new Date().toISOString().split('T')[0]; }
function shiftDate(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function sumLogs(logs) {
  return logs.reduce(
    (a, l) => ({
      calories:  a.calories  + Number(l.calories),
      protein_g: a.protein_g + Number(l.protein_g),
      carbs_g:   a.carbs_g   + Number(l.carbs_g),
      fat_g:     a.fat_g     + Number(l.fat_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

export default function FoodLog() {
  const { user } = useAuth();
  const targets  = user?.targets || {};

  const [date,     setDate]     = useState(todayStr());
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(false);

  // form state
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [grams,       setGrams]       = useState('');
  const [mealType,    setMealType]    = useState('lunch');
  const [submitting,  setSubmitting]  = useState(false);
  const searchTimer = useRef(null);

  const loadLogs = useCallback(async (d) => {
    setLoading(true);
    try {
      const { data } = await foodLogsApi.getByDate(d);
      setLogs(data.logs);
    } catch { toast.error('Failed to load logs'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { loadLogs(date); }, [date, loadLogs]);

  // debounced food search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await foodsApi.search(query);
        setResults(data.foods);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  function selectFood(food) {
    setSelected(food);
    setQuery(food.name_sl);
    setResults([]);
  }

  async function addFood(e) {
    e.preventDefault();
    if (!selected) { toast.error('Select a food first'); return; }
    if (!grams || Number(grams) <= 0) { toast.error('Enter a valid gram amount'); return; }

    setSubmitting(true);
    try {
      const { data } = await foodLogsApi.add({
        food_id:   selected.id,
        meal_type: mealType,
        grams:     Number(grams),
        date,
      });
      setLogs(prev => [...prev, data.log]);
      toast.success(`${selected.name_sl} logged!`);
      setQuery(''); setSelected(null); setGrams('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeLog(id) {
    try {
      await foodLogsApi.delete(id);
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Entry removed');
    } catch { toast.error('Failed to delete'); }
  }

  const totals = sumLogs(logs);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header + date nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Food Log</h2>
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

      {/* Add food form */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Add Food</h3>
        <form onSubmit={addFood} className="space-y-3">
          {/* Food search */}
          <div className="relative">
            <label className="label">Search food</label>
            <input
              className="input"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              placeholder="e.g. Ajdova kaša, Čevapčiči…"
              autoComplete="off"
            />
            {results.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                {results.map(f => (
                  <li
                    key={f.id}
                    onClick={() => selectFood(f)}
                    className="px-4 py-2.5 hover:bg-brand-50 cursor-pointer"
                  >
                    <span className="font-medium text-sm text-gray-800">{f.name_sl}</span>
                    <span className="text-xs text-gray-400 ml-2">{f.name}</span>
                    <span className="text-xs text-gray-400 ml-2">· {f.calories_per_100g} kcal/100g</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected food info */}
          {selected && (
            <div className="bg-brand-50 rounded-lg p-3 text-xs text-gray-600 grid grid-cols-4 gap-2">
              <span><strong>{selected.calories_per_100g}</strong> kcal</span>
              <span><strong>{selected.protein_per_100g}g</strong> protein</span>
              <span><strong>{selected.carbs_per_100g}g</strong> carbs</span>
              <span><strong>{selected.fat_per_100g}g</strong> fat</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Grams</label>
              <input
                className="input"
                type="number"
                min="1"
                max="2000"
                value={grams}
                onChange={e => setGrams(e.target.value)}
                placeholder="e.g. 150"
              />
            </div>
            <div>
              <label className="label">Meal</label>
              <select className="input" value={mealType} onChange={e => setMealType(e.target.value)}>
                {MEALS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Live macro preview */}
          {selected && grams > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 grid grid-cols-4 gap-2">
              {(() => {
                const r = Number(grams) / 100;
                return (
                  <>
                    <span><strong>{Math.round(selected.calories_per_100g * r)}</strong> kcal</span>
                    <span><strong>{(selected.protein_per_100g * r).toFixed(1)}g</strong> protein</span>
                    <span><strong>{(selected.carbs_per_100g   * r).toFixed(1)}g</strong> carbs</span>
                    <span><strong>{(selected.fat_per_100g     * r).toFixed(1)}g</strong> fat</span>
                  </>
                );
              })()}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Logging…' : '+ Add to log'}
          </button>
        </form>
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Calories', val: totals.calories,  target: targets.calories,  unit: 'kcal', color: 'text-amber-600' },
          { label: 'Protein',  val: totals.protein_g, target: targets.protein_g, unit: 'g',    color: 'text-blue-600' },
          { label: 'Carbs',    val: totals.carbs_g,   target: targets.carbs_g,   unit: 'g',    color: 'text-orange-500' },
          { label: 'Fat',      val: totals.fat_g,     target: targets.fat_g,     unit: 'g',    color: 'text-pink-500' },
        ].map(({ label, val, target, unit, color }) => (
          <div key={label} className="card text-center py-3">
            <p className={`text-xl font-bold ${color}`}>{Math.round(val)}<span className="text-xs font-normal">{unit}</span></p>
            <p className="text-xs text-gray-400 mt-0.5">{label} / {target || 0}{unit}</p>
          </div>
        ))}
      </div>

      {/* Log entries by meal */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading…</div>
      ) : (
        MEALS.map(meal => {
          const entries = logs.filter(l => l.meal_type === meal);
          if (entries.length === 0) return null;
          const mealKcal = entries.reduce((s, l) => s + Number(l.calories), 0);
          return (
            <div key={meal} className="card">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-700 capitalize">{meal}</h4>
                <span className="text-sm font-medium text-amber-600">{Math.round(mealKcal)} kcal</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {entries.map(l => (
                  <li key={l.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{l.name_sl}</p>
                      <p className="text-xs text-gray-400">
                        {l.grams}g · P {l.protein_g}g · C {l.carbs_g}g · F {l.fat_g}g
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-600 shrink-0">{Math.round(l.calories)} kcal</span>
                    <button onClick={() => removeLog(l.id)} className="btn-danger shrink-0">✕</button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}

      {!loading && logs.length === 0 && (
        <div className="text-center text-gray-400 py-12 card">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">No food logged for {fmtDate(date)}</p>
          <p className="text-sm mt-1">Use the form above to add your meals</p>
        </div>
      )}
    </div>
  );
}
