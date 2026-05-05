import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',         label: 'Sedentary (desk job, no exercise)' },
  { value: 'lightly_active',    label: 'Lightly active (1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately active (3-5 days/week)' },
  { value: 'very_active',       label: 'Very active (6-7 days/week)' },
  { value: 'extra_active',      label: 'Extra active (physical job + exercise)' },
];

const GOAL_OPTIONS = [
  { value: 'fat_loss',    label: '🔥 Fat loss — calorie deficit' },
  { value: 'maintenance', label: '⚖️  Maintenance — stay the same' },
  { value: 'bulking',     label: '💪 Bulking — build muscle mass' },
];

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    gender: 'male', age: '', weight_kg: '', height_cm: '',
    activity_level: 'moderately_active', goal: 'maintenance',
  });
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  function handle(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.register({
        ...form,
        age:       Number(form.age),
        weight_kg: Number(form.weight_kg),
        height_cm: Number(form.height_cm),
      });
      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
               || err.response?.data?.message
               || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🥗</div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">We use your stats to personalise your daily targets</p>
        </div>

        <div className="card space-y-5">
          <form onSubmit={submit} className="space-y-5">
            {/* Personal info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full name</label>
                <input className="input" name="name" value={form.name} onChange={handle} required />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input className="input" type="email" name="email" value={form.email} onChange={handle} required />
              </div>
              <div className="col-span-2">
                <label className="label">Password</label>
                <input className="input" type="password" name="password" value={form.password} onChange={handle} required minLength={6} />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Body stats */}
            <p className="text-sm font-semibold text-gray-700">Body stats</p>
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

            <hr className="border-gray-100" />

            {/* Goal & activity */}
            <p className="text-sm font-semibold text-gray-700">Lifestyle</p>
            <div>
              <label className="label">Activity level</label>
              <select className="input" name="activity_level" value={form.activity_level} onChange={handle}>
                {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Goal</label>
              <div className="grid grid-cols-1 gap-2">
                {GOAL_OPTIONS.map(o => (
                  <label key={o.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.goal === o.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="goal" value={o.value} checked={form.goal === o.value} onChange={handle} className="accent-brand-600" />
                    <span className="text-sm font-medium">{o.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
