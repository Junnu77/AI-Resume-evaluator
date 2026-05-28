import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, FileText, Calendar, ChevronRight, Loader2, Award, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await api.get('/evaluations');
        setEvaluations(res.data);
      } catch (err) {
        setError('Failed to fetch evaluation history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvaluations();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  // Calculate summary stats
  const totalEvaluations = evaluations.length;
  const averageScore = totalEvaluations > 0 
    ? Math.round(evaluations.reduce((acc, curr) => acc + curr.score, 0) / totalEvaluations)
    : 0;
  const highestScore = totalEvaluations > 0
    ? Math.max(...evaluations.map(e => e.score))
    : 0;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-dark-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here is the overview of your resume tracking.</p>
        </div>
        <Link to="/upload" className="btn-primary shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
          <Plus size={18} className="mr-2" /> New Evaluation
        </Link>
      </motion.div>

      {/* Summary Widgets */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-l-4 border-l-primary-500">
          <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 flex items-center justify-center mr-4">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Analyzed</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? '-' : totalEvaluations}</h3>
          </div>
        </div>
        
        <div className="card flex items-center p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-l-4 border-l-green-500">
          <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 flex items-center justify-center mr-4">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Score</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? '-' : averageScore}</h3>
          </div>
        </div>

        <div className="card flex items-center p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-l-4 border-l-amber-500">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 flex items-center justify-center mr-4">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Highest Score</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? '-' : highestScore}</h3>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Evaluations</h2>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/50 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
        ) : evaluations.length === 0 ? (
          <div className="card text-center py-16 border-dashed border-2 bg-transparent dark:bg-transparent">
            <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-primary-900/20">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No evaluations yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              Upload your first resume and compare it against a job description to see your score.
            </p>
            <Link to="/upload" className="btn-primary inline-flex">
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluations.map((evaluation) => (
              <motion.div 
                whileHover={{ y: -4 }}
                key={evaluation._id} 
                className="card cursor-pointer group flex flex-col h-full shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-700"
                onClick={() => navigate(`/evaluations/${evaluation._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-500">
                    <Award size={24} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
                    evaluation.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                    evaluation.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  }`}>
                    {evaluation.score}/100
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 mb-6">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1" title={evaluation.jobTitle}>
                    {evaluation.jobTitle}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-1 flex items-center gap-1 font-medium">
                    @ {evaluation.companyName || 'Unknown Company'}
                  </p>
                  <div className="pt-3 text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar size={14} /> {formatDate(evaluation.createdAt)}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-primary-600 dark:text-primary-500 font-semibold group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                  View Full Report
                  <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
