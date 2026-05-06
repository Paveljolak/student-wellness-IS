import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/',        label: 'Dashboard', icon: '📊' },
  { to: '/profile', label: 'Profile',   icon: '👤' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-60 min-h-screen bg-brand-800 flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-brand-700">
        <h1 className="text-white font-bold text-xl">🥗 Wellness</h1>
        <p className="text-brand-200 text-sm mt-1 truncate">{user?.name}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-brand-100 hover:bg-brand-700 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-brand-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-100 hover:bg-brand-700 hover:text-white transition-colors"
        >
          <span>🚪</span> Log out
        </button>
      </div>
    </aside>
  );
}
