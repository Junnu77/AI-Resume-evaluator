const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://ai-resume-evaluator-sigma.vercel.app', // Deployed frontend
  'http://localhost:5173', // Vite default port (local dev)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'https://ai-resume-evaluator-sigma.vercel.app');
});
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/resumes', require('./routes/resume.routes'));
app.use('/api/evaluations', require('./routes/eval.routes'));

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to MongoDB with fallback
const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resume-evaluator';
const localUri = 'mongodb://127.0.0.1:27017/resume-evaluator';

const connectDB = async () => {
  try {
    await mongoose.connect(primaryUri);
    console.log('Connected to MongoDB (Primary)');
  } catch (err) {
    console.error('Failed to connect to primary MongoDB:', err.message);
    if (primaryUri !== localUri) {
      console.log('Attempting connection to local MongoDB fallback...');
      try {
        await mongoose.connect(localUri);
        console.log('Connected to local MongoDB');
      } catch (localErr) {
        console.error('Failed to connect to local MongoDB:', localErr.message);
        console.log('Starting in-memory MongoDB for development...');
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          const mongoServer = await MongoMemoryServer.create();
          const inMemoryUri = mongoServer.getUri();
          await mongoose.connect(inMemoryUri);
          console.log('Connected to In-Memory MongoDB');
        } catch (memErr) {
          console.error('Failed to connect to In-Memory MongoDB:', memErr.message);
          console.warn('Server running without MongoDB connection. Database dependent operations will fail until DB is available.');
        }
      }
    }
  }
};

connectDB();

