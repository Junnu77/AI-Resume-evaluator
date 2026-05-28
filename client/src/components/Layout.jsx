import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, LogOut, Sun, Moon, LayoutDashboard, User } from 'lucide-react';
import { useState, useEffect } from 'react';

const ProtectedRoute = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout />;
};

const Layout = () => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200 dark:bg-dark-surface dark:border-dark-border sticky top-0 z-50 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary-500" />
              <span className="font-bold text-xl tracking-tight hidden sm:block">AI Resume Eval</span>
            </div>
            <div className="flex justify-end items-center gap-4">
              <Link to="/dashboard" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1 font-medium hidden sm:flex">
                 <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link to="/profile" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1 font-medium hidden sm:flex">
                 <User size={18} /> Profile
              </Link>
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={logout} 
                className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors hidden sm:flex font-medium"
              >
                <LogOut size={20} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;
