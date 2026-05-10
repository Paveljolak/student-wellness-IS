import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login    from './pages/Login';
import Register from './pages/Register';
import Profile  from './pages/Profile';
import FoodLog  from './pages/FoodLog';
import WaterLog  from './pages/WaterLog';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/food-log" element={<FoodLog />} />
            <Route path="/water"    element={<WaterLog />} />
            <Route path="/profile"  element={<Profile />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  );
}
