import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login    from './pages/Login';
import Register from './pages/Register';
import Profile  from './pages/Profile';
import FoodLog  from './pages/FoodLog';

function ComingSoon({ label = 'Feature' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-4xl">🚧</p>
      <p className="text-lg font-semibold text-gray-700">{label}</p>
      <p className="text-gray-400">Coming soon…</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/"         element={<ComingSoon label="Dashboard" />} />
            <Route path="/food-log" element={<FoodLog />} />
            <Route path="/profile"  element={<Profile />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  );
}
