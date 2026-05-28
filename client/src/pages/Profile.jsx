import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Award, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Profile</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your account information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="card md:col-span-1 flex flex-col items-center text-center space-y-4"
        >
          <div className="w-24 h-24 bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 rounded-full flex items-center justify-center text-3xl font-bold shadow-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mt-1">
              <Mail size={14} /> {user.email}
            </p>
          </div>
          <div className="w-full pt-4 border-t border-slate-100 dark:border-dark-border mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Shield size={12} className="mr-1" /> Active Account
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="card md:col-span-2 space-y-6"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-dark-border">
              Account Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-dark-border">
                  <User size={18} className="text-primary-500" />
                  {user.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-dark-border">
                  <Mail size={18} className="text-primary-500" />
                  {user.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Member Since</label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-dark-border">
                  <Calendar size={18} className="text-primary-500" />
                  {formatDate(user.createdAt)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Subscription Plan</label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-dark-border">
                  <Award size={18} className="text-primary-500" />
                  Free (Alpha)
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
