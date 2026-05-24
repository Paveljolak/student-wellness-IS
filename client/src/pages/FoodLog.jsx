import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { foodLogsApi } from '../api/foodLogs';
import { foodsApi }    from '../api/foods';
import { useAuth }     from '../context/AuthContext';

const MEALS     = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const PAGE_SIZE  = 5;
const CATEGORIES = [
  'Slovenian Traditional','Balkan Dishes','Breads & Pastries',
  'Proteins','Dairy','Grains & Pasta','Vegetables','Fruits',
  'Nuts & Seeds','Legumes','Custom',
];

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

// ─── Custom Food Modal ───────────────────────────────────────────────────────
function CustomFoodModal({ onClose, onAdded }) {
  const empty = {
    name: '', name_sl: '', category: 'Custom',
    calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '',
    fat_per_100g: '', fiber_per_100g: '', sugar_per_100g: '',
  };
  const [form, setForm]     = useState(empty);
  const [loading, setLoading] = useState(false);

  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await foodsApi.create({
        ...form,
        calories_per_100g: Number(form.calories_per_100g),
        protein_per_100g:  Number(form.protein_per_100g)  || 0,
        carbs_per_100g:    Number(form.carbs_per_100g)    || 0,
        fat_per_100g:      Number(form.fat_per_100g)      || 0,
        fiber_per_100g:    Number(form.fiber_per_100g)    || 0,
        sugar_per_100g:    Number(form.sugar_per_100g)    || 0,
      });
      toast.success(`${form.name_sl} added to the database!`);
      onAdded(data.food);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add food');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-900">Add Custom Food</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Slovenian name</label>
              <input className="input" name="name_sl" value={form.name_sl} onChange={handle} required placeholder="npr. Ajdova juha" />
            </div>
            <div>
              <label className="label">English name</label>
              <input className="input" name="name" value={form.name} onChange={handle} required placeholder="e.g. Buckwheat soup" />
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select className="input" name="category" value={form.category} onChange={handle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Macros per 100 g</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'calories_per_100g', label: 'Calories (kcal)', required: true },
              { name: 'protein_per_100g',  label: 'Protein (g)',     required: true },
              { name: 'carbs_per_100g',    label: 'Carbs (g)',       required: true },
              { name: 'fat_per_100g',      label: 'Fat (g)',         required: true },
              { name: 'fiber_per_100g',    label: 'Fiber (g)',       required: false },
              { name: 'sugar_per_100g',    label: 'Sugar (g)',       required: false },
            ].map(({ name, label, required }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input
                  className="input" type="number" step="0.1" min="0"
                  name={name} value={form[name]} onChange={handle}
                  required={required} placeholder="0"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding…' : 'Add food'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Collapsible Meal Section with Pagination ────────────────────────────────
function MealSection({ meal, entries, onDelete }) {
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const paged      = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const mealKcal   = entries.reduce((s, l) => s + Number(l.calories), 0);

  return (
    <div className="card">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <span>{MEAL_ICONS[meal]}</span>
          <h4 className="font-semibold text-gray-700 capitalize">{meal}</h4>
          <span className="text-xs text-gray-400">({entries.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-amber-600">{Math.round(mealKcal)} kcal</span>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <>
          <ul className="divide-y divide-gray-50 mt-3">
            {paged.map(l => (
              <li key={l.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {l.name_sl}
                    {l.is_custom ? <span className="ml-1.5 text-xs bg-violet-100 text-violet-600 rounded px-1">custom</span> : null}
                  </p>
                  <p className="text-xs text-gray-400">
                    {l.grams}g · P {l.protein_g}g · C {l.carbs_g}g · F {l.fat_g}g
                  </p>
                </div>
                <span className="text-sm font-semibold text-amber-600 shrink-0">{Math.round(l.calories)} kcal</span>
                <button onClick={() => onDelete(l.id)} className="btn-danger shrink-0">✕</button>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary text-xs px-3 py-1 disabled:opacity-40"
              >← Prev</button>
              <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="btn-secondary text-xs px-3 py-1 disabled:opacity-40"
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function FoodLog() {
  const { user } = useAuth();
  const targets  = user?.targets || {};

  const [date,       setDate]       = useState(todayStr());
  const [logs,       setLogs]       = useState([]);
  const [allFoods,   setAllFoods]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [mealFilter, setMealFilter] = useState('all');
  const [showCustom, setShowCustom] = useState(false);

  // add-form state
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [showDrop,   setShowDrop]   = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [grams,      setGrams]      = useState('');
  const [mealType,   setMealType]   = useState('lunch');
  const [submitting, setSubmitting] = useState(false);

  const searchTimer = useRef(null);
  const dropRef     = useRef(null);

  const loadLogs = useCallback(async (d) => {
    setLoading(true);
    try {
      const { data } = await foodLogsApi.getByDate(d);
      setLogs(data.logs);
    } catch { toast.error('Failed to load logs'); }
    finally  { setLoading(false); }
  }, []);

  // fetch all foods once for the browse dropdown
  useEffect(() => {
    foodsApi.search('').then(({ data }) => setAllFoods(data.foods)).catch(() => {});
  }, []);

  useEffect(() => { loadLogs(date); }, [date, loadLogs]);

  // close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // debounced search
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

  // group all foods by category for browse view
  const groupedFoods = allFoods.reduce((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {});

  function selectFood(food) {
    setSelected(food);
    setQuery(food.name_sl);
    setShowDrop(false);
  }

  async function addFood(e) {
    e.preventDefault();
    if (!selected)                   { toast.error('Select a food first'); return; }
    if (!grams || Number(grams) <= 0) { toast.error('Enter a valid gram amount'); return; }
    setSubmitting(true);
    try {
      const { data } = await foodLogsApi.add({
        food_id: selected.id, meal_type: mealType, grams: Number(grams), date,
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

  function handleCustomAdded(newFood) {
    setAllFoods(prev => [...prev, newFood]);
    selectFood(newFood);
  }

  const totals       = sumLogs(logs);
  const visibleMeals = mealFilter === 'all' ? MEALS : [mealFilter];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header + date nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Food Log</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(d => shiftDate(d, -1))} className="btn-secondary px-3 py-1.5 text-sm">‹</button>
          <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)} className="input w-auto text-sm" />
          <button onClick={() => setDate(d => shiftDate(d, 1))} disabled={date >= todayStr()} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">›</button>
        </div>
      </div>

      {/* Add food form */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Add Food</h3>
          <button type="button" onClick={() => setShowCustom(true)} className="text-xs text-brand-600 font-medium hover:underline">
            + Add custom food
          </button>
        </div>

        <form onSubmit={addFood} className="space-y-3">
          {/* Search / browse dropdown */}
          <div className="relative" ref={dropRef}>
            <label className="label">Search or browse all foods</label>
            <input
              className="input"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); setShowDrop(true); }}
              onFocus={() => setShowDrop(true)}
              placeholder="Type to search, or click to browse by category…"
              autoComplete="off"
            />

            {showDrop && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
                {query.trim() === '' ? (
                  Object.entries(groupedFoods).map(([cat, foods]) => (
                    <div key={cat}>
                      <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50 sticky top-0">
                        {cat}
                      </div>
                      {foods.map(f => (
                        <button
                          key={f.id} type="button"
                          onClick={() => selectFood(f)}
                          className="w-full text-left px-4 py-2 hover:bg-brand-50 flex justify-between items-center"
                        >
                          <span className="text-sm font-medium text-gray-800">{f.name_sl}</span>
                          <span className="text-xs text-gray-400">{f.calories_per_100g} kcal/100g</span>
                        </button>
                      ))}
                    </div>
                  ))
                ) : results.length > 0 ? (
                  results.map(f => (
                    <button
                      key={f.id} type="button"
                      onClick={() => selectFood(f)}
                      className="w-full text-left px-4 py-2.5 hover:bg-brand-50 flex justify-between items-center"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-800">{f.name_sl}</span>
                        <span className="text-xs text-gray-400 ml-2">{f.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{f.calories_per_100g} kcal/100g</span>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-400">No results for "{query}"</p>
                )}
              </div>
            )}
          </div>

          {/* Selected food macros */}
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
              <input className="input" type="number" min="1" max="2000" value={grams} onChange={e => setGrams(e.target.value)} placeholder="e.g. 150" />
            </div>
            <div>
              <label className="label">Meal</label>
              <select className="input" value={mealType} onChange={e => setMealType(e.target.value)}>
                {MEALS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Live macro preview */}
          {selected && Number(grams) > 0 && (() => {
            const r = Number(grams) / 100;
            return (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 grid grid-cols-4 gap-2">
                <span><strong>{Math.round(selected.calories_per_100g * r)}</strong> kcal</span>
                <span><strong>{(selected.protein_per_100g * r).toFixed(1)}g</strong> protein</span>
                <span><strong>{(selected.carbs_per_100g   * r).toFixed(1)}g</strong> carbs</span>
                <span><strong>{(selected.fat_per_100g     * r).toFixed(1)}g</strong> fat</span>
              </div>
            );
          })()}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Logging…' : '+ Add to log'}
          </button>
        </form>
      </div>

      {/* Day summary cards */}
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

      {/* Meal filter dropdown */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 font-medium shrink-0">Show meal:</label>
          <select className="input w-auto text-sm" value={mealFilter} onChange={e => setMealFilter(e.target.value)}>
            <option value="all">All meals</option>
            {MEALS.map(m => (
              <option key={m} value={m}>{MEAL_ICONS[m]} {m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Collapsible meal sections */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading…</div>
      ) : (
        visibleMeals.map(meal => {
          const entries = logs.filter(l => l.meal_type === meal);
          if (entries.length === 0) return null;
          return <MealSection key={meal} meal={meal} entries={entries} onDelete={removeLog} />;
        })
      )}

      {!loading && logs.length === 0 && (
        <div className="text-center text-gray-400 py-12 card">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">No food logged for {fmtDate(date)}</p>
          <p className="text-sm mt-1">Use the form above to add your meals</p>
        </div>
      )}

      {showCustom && (
        <CustomFoodModal onClose={() => setShowCustom(false)} onAdded={handleCustomAdded} />
      )}
    </div>
  );
}
