import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Loader2, ArrowLeft, Download, CheckCircle, 
  XCircle, AlertTriangle, TrendingUp, Briefcase, User, Building, BarChart2,
  ShieldCheck, ShieldAlert, Zap, Info
} from 'lucide-react';
import { 
  RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';

const EvaluationResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    setExporting(true);
    
    const element = reportRef.current;
    // Add a temporary class to fix any layout issues during PDF generation if needed
    const opt = {
      margin:       0.5,
      filename:     `Resume_Evaluation_${evaluation?.jobTitle?.replace(/\s+/g, '_') || 'Report'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setExporting(false);
    }).catch(err => {
      console.error('PDF Export Error:', err);
      setExporting(false);
    });
  };

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const res = await api.get(`/evaluations/${id}`);
        setEvaluation(res.data);
      } catch (err) {
        setError('Failed to fetch evaluation details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvaluation();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="text-primary-500 mb-4" size={48} />
        </motion.div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white mb-2">Analyzing AI Results...</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Preparing your personalized action plan</p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-100 text-red-500 p-4 rounded-full inline-block mb-4 dark:bg-red-900/30">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Error</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Evaluation not found'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary inline-flex">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const chartData = [
    { name: 'Keyword Match', score: evaluation.keywordMatch, fill: '#f59e0b' }, // Amber
    { name: 'ATS Suitability', score: evaluation.atsScore, fill: '#3b82f6' }, // Blue
    { name: 'Overall Score', score: evaluation.score, fill: evaluation.score >= 80 ? '#10b981' : evaluation.score >= 60 ? '#f59e0b' : '#ef4444' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  // ─── Quality Metrics Helpers ───────────────────────────────────────
  const qm = evaluation.qualityMetrics;
  const hasTrustData = qm && qm.overallTrust !== null && qm.overallTrust !== undefined;
  const trustScore = hasTrustData ? qm.overallTrust : null;
  const isCached = evaluation.cacheMetadata?.cached;

  const getTrustColor = (score) => {
    if (score >= 80) return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800/50' };
    if (score >= 50) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50' };
    return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800/50' };
  };

  const getTrustLabel = (score) => {
    if (score >= 80) return 'High Confidence';
    if (score >= 50) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 max-w-6xl mx-auto pb-12"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-dark-border">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2.5 mt-1 -ml-2 text-slate-500 bg-slate-100/50 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:text-white dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Evaluation Report
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">
                <Briefcase size={14} className="text-primary-500" /> {evaluation.jobTitle}
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">
                <Building size={14} className="text-primary-500" /> {evaluation.companyName || 'General Application'}
              </span>
              {isCached && (
                <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full text-xs border border-purple-200 dark:border-purple-800/50">
                  <Zap size={12} /> Served from cache
                  {evaluation.cacheMetadata?.similarity && (
                    <span className="opacity-75">
                      ({(evaluation.cacheMetadata.similarity * 100).toFixed(1)}% match)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={handleExportPDF} disabled={exporting} className="btn-secondary h-11 hidden sm:flex shadow-sm hover:shadow">
          {exporting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />} 
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </motion.div>

      <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0">
        {/* Left Column: Scores & Visuals */}
        <div className="lg:col-span-4 space-y-8">
          
          <motion.div variants={itemVariants} className="card text-center border-t-8 border-t-primary-500 shadow-lg relative overflow-hidden p-6">
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10"></div>
            
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-4 relative z-10 flex items-center justify-center gap-2">
              <BarChart2 size={16}/> Match Score Analysis
            </h2>
            
            <div className="h-[280px] w-full flex justify-center relative z-10 mt-4 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" cy="45%" innerRadius="55%" outerRadius="85%" 
                  barSize={18} data={chartData} startAngle={90} endAngle={-270}
                >
                  <Tooltip 
                    cursor={{fill: 'transparent'}} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    iconSize={14} 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ 
                      fontSize: '13px', 
                      paddingTop: '20px',
                      lineHeight: '22px'
                    }}
                  />
                  <RadialBar 
                    minAngle={15} 
                    background 
                    clockWise={true} 
                    dataKey="score" 
                    cornerRadius={12}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              
              {/* Center Score Overlay */}
              <div className="absolute inset-x-0 top-0 bottom-[30px] flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-800 dark:text-white leading-none">
                  {evaluation.score}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Overall
                </span>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-dark-bg/50 dark:border-dark-border relative z-10">
              <div className="flex flex-col items-center justify-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Final Decision</span>
                <span className={`px-6 py-2 rounded-full text-sm sm:text-base font-extrabold shadow-sm text-center w-full ${
                  evaluation.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  evaluation.score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {evaluation.score >= 80 ? 'Highly Recommended' : evaluation.score >= 60 ? 'Needs Tweaking' : 'Major Rewrite Needed'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* ─── AI Trust Score Card (Eval-on-Eval) ─────────────────── */}
          {hasTrustData && (
            <motion.div 
              variants={itemVariants} 
              className={`card border shadow-md overflow-hidden ${
                trustScore >= 80 ? 'border-green-200 dark:border-green-800/40 bg-gradient-to-br from-white to-green-50/30 dark:from-dark-surface dark:to-green-900/10' :
                trustScore >= 50 ? 'border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-white to-amber-50/30 dark:from-dark-surface dark:to-amber-900/10' :
                'border-red-200 dark:border-red-800/40 bg-gradient-to-br from-white to-red-50/30 dark:from-dark-surface dark:to-red-900/10'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={20} className={trustScore >= 80 ? 'text-green-500' : trustScore >= 50 ? 'text-amber-500' : 'text-red-500'} />
                  AI Trust Score
                </h3>
                <div className={`px-3 py-1.5 rounded-xl text-lg font-black ${getTrustColor(trustScore).bg} ${getTrustColor(trustScore).text}`}>
                  {trustScore}
                </div>
              </div>

              <div className={`text-center mb-5 px-4 py-2.5 rounded-xl text-sm font-bold ${getTrustColor(trustScore).bg} ${getTrustColor(trustScore).text} ${getTrustColor(trustScore).border} border`}>
                {getTrustLabel(trustScore)}
              </div>

              {/* Faithfulness Metric */}
              <div className="space-y-3">
                <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                  qm.faithfulness?.score 
                    ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-800/30' 
                    : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-800/30'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    qm.faithfulness?.score 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                  }`}>
                    {qm.faithfulness?.score ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">Faithfulness</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        qm.faithfulness?.score 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {qm.faithfulness?.score ? 'PASS' : 'FLAGGED'}
                      </span>
                    </div>
                    {qm.faithfulness?.reasoning && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                        {qm.faithfulness.reasoning}
                      </p>
                    )}
                  </div>
                </div>

                {/* Relevance Metric */}
                <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                  qm.relevance?.score 
                    ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-800/30' 
                    : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-800/30'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    qm.relevance?.score 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                  }`}>
                    {qm.relevance?.score ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">Relevance</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        qm.relevance?.score 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {qm.relevance?.score ? 'PASS' : 'FLAGGED'}
                      </span>
                    </div>
                    {qm.relevance?.reasoning && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                        {qm.relevance.reasoning}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Trust score is generated by a secondary AI judge that verifies the primary evaluation for hallucinations and relevance to the target role.
                </p>
              </div>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className="card border border-red-100 dark:border-red-900/30 bg-gradient-to-br from-white to-red-50/30 dark:from-dark-surface dark:to-red-900/10">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
              <XCircle className="text-red-500" size={20} /> Critical Missing Keywords
            </h3>
            {evaluation.missingSkills && evaluation.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {evaluation.missingSkills.map((skill, index) => (
                  <span key={index} className="px-4 py-1.5 bg-red-100/50 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-lg text-sm font-semibold border border-red-200/50 dark:border-red-800/50 shadow-sm transition-transform hover:-translate-y-0.5">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium flex items-center gap-2">
                 <CheckCircle size={16}/> Perfect match! No core skills missing.
              </div>
            )}
            <p className="text-xs text-slate-500 mt-4 font-medium">Add these exact keywords to bypass ATS filters.</p>
          </motion.div>
        </div>

        {/* Right Column: Detailed Feedback */}
        <div className="lg:col-span-8 space-y-8">
          
          <motion.div variants={itemVariants} className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-xl border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            
            <h2 className="text-xl font-bold flex items-center gap-3 mb-6 relative z-10">
              <Building className="text-primary-200" size={24} /> 
              Company Specific Strategies 
              <span className="text-xs font-semibold bg-primary-900/50 text-primary-200 px-2.5 py-1 rounded-full uppercase tracking-wider ml-auto">
                {evaluation.companyName || 'General'}
              </span>
            </h2>
            
            <div className="relative z-10 space-y-4 text-primary-50">
              <p className="leading-relaxed font-medium">
                Based on historical hiring patterns at <strong>{evaluation.companyName || 'leading tech companies'}</strong> for the <strong>{evaluation.jobTitle}</strong> role, AI suggests the following deep-level strategies:
              </p>
              <ul className="space-y-3 mt-4 list-disc list-inside">
                <li>Demonstrate leadership in ambiguous cross-functional environments.</li>
                <li>Highlight instances where your work led directly to metric-driven impact (e.g. "Increased rendering speed by 25%").</li>
                <li>Ensure formatting is standard plain-text readable to bypass strict internal Applicant Tracking Systems.</li>
              </ul>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card shadow-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-dark-border">
              <TrendingUp className="text-primary-500" size={24} /> General Resume Improvements
            </h2>
            <div className="grid gap-4">
              {evaluation.suggestions && evaluation.suggestions.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 font-extrabold flex-shrink-0 shadow-sm">
                    {index + 1}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed pt-1">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card shadow-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-8">
              <User className="text-primary-500" size={24} /> Section-by-Section Feedback
            </h2>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
              
              {/* Timeline Item */}
              {Object.entries(evaluation.sectionFeedback || {}).map(([key, value], idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  key={key} 
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-dark-bg bg-primary-100 dark:bg-primary-900 text-primary-500 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                    <CheckCircle size={18} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-slate-100 bg-white dark:bg-dark-surface dark:border-dark-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between space-x-2 mb-2">
                      <div className="font-extrabold text-slate-900 dark:text-white capitalize text-lg tracking-tight px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg inline-block">
                        {key}
                      </div>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed px-1">
                      {value}
                    </div>
                  </div>
                </motion.div>
              ))}

            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default EvaluationResults;
