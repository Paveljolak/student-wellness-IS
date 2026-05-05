import { useState } from 'react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/users';
import { useAuth }  from '../context/AuthContext';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',         label: 'Sedentary' },
  { value: 'lightly_active',    label: 'Lightly active (1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately active (3-5 days/week)' },
  { value: 'very_active',       label: 'Very active (6-7 days/week)' },
  { value: 'extra_active',      label: 'Extra active (physical job + training)' },
];

const GOAL_OPTIONS = [
  { value: 'fat_loss',    label: '🔥 Fat loss' },
  { value: 'maintenance', label: '⚖️  Maintenance' },
  { value: 'bulking',     label: '💪 Bulking' },
];

function bmi(weight, height) {
  if (!weight || !height) return null;
  const val = weight / ((height / 100) ** 2);
  return val.toFixed(1);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25)   return { label: 'Normal weight', color: 'text-brand-600' };
  if (bmi < 30)   return { label: 'Overweight', color: 'text-amber-500' };
  return               { label: 'Obese', color: 'text-red-500' };
}

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    name:           user?.name           || '',
    gender:         user?.gender         || 'male',
    age:            user?.age            || '',
    weight_kg:      user?.weight_kg      || '',
    height_cm:      user?.height_cm      || '',
    activity_level: user?.activity_level || 'moderately_active',
    goal:           user?.goal           || 'maintenance',
  });
  const [loading, setLoading] = useState(false);

  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await usersApi.updateProfile({
        ...form,
        age:       Number(form.age),
        weight_kg: Number(form.weight_kg),
        height_cm: Number(form.height_cm),
      });
      refreshUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  const targets = user?.targets || {};
  const bmiVal  = bmi(form.weight_kg, form.height_cm);
  const bmiInfo = bmiVal ? bmiCategory(Number(bmiVal)) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Profile</h2>

      {/* BMI card */}
      {bmiVal && (
        <div className="card flex items-center gap-4">
          <div className="text-4xl">📏</div>
          <div>
            <p className="text-sm text-gray-500">Your BMI</p>
            <p className={`text-3xl font-bold ${bmiInfo.color}`}>{bmiVal}</p>
            <p className={`text-sm font-medium ${bmiInfo.color}`}>{bmiInfo.label}</p>
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Edit Profile</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" name="name" value={form.name} onChange={handle} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Gender</label>
              <select className="input" name="gender" value={form.gender} onChange={handle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" name="age" value={form.age} onChange={handle} required min="10" max="120" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input className="input" type="number" step="0.1" name="weight_kg" value={form.weight_kg} onChange={handle} required min="20" />
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input className="input" type="number" step="0.1" name="height_cm" value={form.height_cm} onChange={handle} required min="50" />
            </div>
          </div>

          <div>
            <label className="label">Activity level</label>
            <select className="input" name="activity_level" value={form.activity_level} onChange={handle}>
              {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Goal</label>
            <select className="input" name="goal" value={form.goal} onChange={handle}>
              {GOAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Calculated targets */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Your Daily Targets</h3>
        <p className="text-xs text-gray-400 mb-4">
          Calculated using the Mifflin-St Jeor formula. Targets update when you save profile changes.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Calories',  val: targets.calories,  unit: 'kcal', color: 'bg-amber-50  text-amber-700' },
            { label: 'Protein',   val: targets.protein_g, unit: 'g',    color: 'bg-blue-50   text-blue-700' },
            { label: 'Carbs',     val: targets.carbs_g,   unit: 'g',    color: 'bg-orange-50 text-orange-700' },
            { label: 'Fat',       val: targets.fat_g,     unit: 'g',    color: 'bg-pink-50   text-pink-700' },
            { label: 'Fiber',     val: targets.fiber_g,   unit: 'g',    color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Sugar max', val: targets.sugar_g,   unit: 'g',    color: 'bg-violet-50  text-violet-700' },
            { label: 'Water',     val: targets.water_ml ? (targets.water_ml / 1000).toFixed(1) : 0, unit: 'L', color: 'bg-sky-50 text-sky-700' },
          ].map(({ label, val, unit, color }) => (
            <div key={label} className={`rounded-lg p-3 ${color}`}>
              <p className="text-xs font-medium opacity-70">{label}</p>
              <p className="text-lg font-bold">{val || '—'}<span className="text-xs font-normal ml-0.5">{unit}</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Account</h3>
        <p className="text-sm text-gray-600"><span className="font-medium">Email:</span> {user?.email}</p>
        <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Member since:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '—'}</p>
      </div>
    </div>
  );
}
