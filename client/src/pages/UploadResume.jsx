import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UploadCloud, File, X, Loader2, Sparkles, AlertCircle, Building, Briefcase, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadResume = () => {
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setFile(selectedFile);
    setError('');
    
    const formData = new FormData();
    formData.append('resume', selectedFile);
    
    setUploading(true);
    try {
      const res = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResumeId(res.data.resume._id);
    } catch (err) {
      // Extract the real server-side error message (not the generic axios 'Network Error')
      const message = err?.response?.data?.message || err?.message || 'Failed to upload resume. Please try again.';
      setError(message);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResumeId(null);
    setError('');
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!resumeId) {
      setError('Please upload a resume first.');
      return;
    }
    
    setEvaluating(true);
    try {
      const res = await api.post('/evaluations/evaluate', {
        resumeId,
        jobTitle,
        companyName,
        jobDescription
      });
      navigate(`/evaluations/${res.data.evaluation._id}`);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to evaluate resume. Please try again.';
      setError(message);
      setEvaluating(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="text-center pb-2">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-200 mb-3">
          Evaluate Your Resume
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Our AI scans your PDF resume against any job description to give you actionable feedback, ATS match rates, and specific improvements.
        </p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl flex items-start gap-3 border border-red-200 dark:border-red-800/50"
        >
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleEvaluate} className="space-y-8 relative">
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-700/50 hidden md:block -z-10"></div>

        {/* Step 1: Upload */}
        <motion.div variants={containerVariants} className="relative">
          <div className="md:flex items-start gap-6">
            <div className="hidden md:flex flex-shrink-0 w-12 h-12 bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400 rounded-full items-center justify-center font-bold text-lg border-4 border-white dark:border-dark-bg z-10 shadow-sm">
              1
            </div>
            <div className="flex-1 card shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-primary-500">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="text-primary-500" size={20} /> Upload Resume (PDF)
              </h2>
              
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div 
                    key="upload-box"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    <div className="text-center group-hover:-translate-y-1 transition-transform duration-300">
                      <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                        {uploading ? <Loader2 className="animate-spin" size={28} /> : <UploadCloud size={28} />}
                      </div>
                      {uploading ? (
                        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">Uploading securely...</p>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click or drag PDF here</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Max size: 5MB</p>
                        </>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="file-box"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="border border-green-200 dark:border-green-900/50 rounded-xl p-4 flex items-center justify-between bg-green-50 dark:bg-green-900/10 shadow-inner"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-dark-surface shadow-sm text-green-600 dark:text-green-500 flex items-center justify-center rounded-lg">
                        <File size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{file.name}</p>
                        <p className="text-xs text-green-600 dark:text-green-500 font-medium">
                          Upload Complete &bull; {file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={clearFile}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Step 2: Job Description */}
        <motion.div 
          variants={containerVariants} 
          className={`relative transition-all duration-500 ${!resumeId ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100 grayscale-0'}`}
        >
          <div className="md:flex items-start gap-6">
            <div className={`hidden md:flex flex-shrink-0 w-12 h-12 rounded-full items-center justify-center font-bold text-lg border-4 border-white dark:border-dark-bg z-10 transition-colors duration-500 ${resumeId ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
              2
            </div>
            <div className="flex-1 card shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-slate-800 dark:border-t-slate-600">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Briefcase className="text-slate-700 dark:text-slate-300" size={20} /> Job Details
              </h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label" htmlFor="jobTitle">Target Job Title</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Briefcase size={16} />
                      </div>
                      <input
                        id="jobTitle"
                        type="text"
                        required
                        className="input-field pl-10 bg-slate-50 dark:bg-slate-900/50"
                        placeholder="e.g. Frontend Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="companyName">Company Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building size={16} />
                      </div>
                      <input
                        id="companyName"
                        type="text"
                        className="input-field pl-10 bg-slate-50 dark:bg-slate-900/50"
                        placeholder="e.g. Google"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="jobDescription">Full Job Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <textarea
                    id="jobDescription"
                    rows={6}
                    className="input-field resize-none py-3 bg-slate-50 dark:bg-slate-900/50"
                    placeholder="Paste requirements here... (If left blank, AI will evaluate against standard industry expectations for this role)"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" /> AI will adapt to either your provided text or standard expectations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div variants={containerVariants} className="flex justify-end pt-2 md:pl-18">
          <button
            type="submit"
            disabled={evaluating || !resumeId || !jobTitle}
            className={`py-4 px-8 text-lg font-bold shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto rounded-xl flex items-center justify-center gap-3 ${
              !resumeId || !jobTitle 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' 
              : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:-translate-y-1'
            }`}
          >
            {evaluating ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Generate Evaluation Report
              </>
            )}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default UploadResume;
