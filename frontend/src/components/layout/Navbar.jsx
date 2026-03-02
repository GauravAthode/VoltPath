import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Bell, LogOut, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/route-planner': 'Route Planner',
  '/trip-results': 'Trip Results',
  '/charging-stations': 'Charging Stations',
  '/simulations': 'Simulations',
  '/history': 'Trip History',
  '/profile': 'Profile & Settings',
  '/vehicles': 'EV Vehicle Library',
};

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'VoltPath';

  const handleLogout = async () => {
    try { await logout(); } catch {}
    signOut();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <header className="h-16 border-b dark:border-dark-border border-light-border dark:bg-dark-surface bg-white flex items-center justify-between px-6 flex-shrink-0" data-testid="navbar">
      <div>
        <h1 className="text-lg font-bold dark:text-dark-text text-light-text font-display">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center dark:bg-dark-highlight bg-light-highlight dark:text-dark-muted text-light-muted hover:text-primary transition-colors"
          data-testid="theme-toggle"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>

        {/* Notification */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center dark:bg-dark-highlight bg-light-highlight dark:text-dark-muted text-light-muted hover:text-primary transition-colors relative"
          data-testid="notifications-btn"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        </motion.button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 ml-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-volt flex items-center justify-center font-bold text-dark-bg text-sm">
            {user?.picture
              ? <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-xl object-cover" />
              : getInitials(user?.name || 'U')
            }
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold dark:text-dark-text text-light-text leading-none">{user?.name || 'User'}</p>
            <p className="text-xs dark:text-dark-muted text-light-muted">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl flex items-center justify-center dark:bg-dark-highlight bg-light-highlight text-red-400 hover:bg-red-400/10 transition-colors"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>
    </header>
  );
};

export default Navbar;
