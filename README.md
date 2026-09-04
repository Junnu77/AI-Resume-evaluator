# 🚀 AI-Powered Personalized Resume Evaluator

An intelligent, full-stack web application that leverages AI to analyze, score, and provide actionable feedback on candidate resumes. Built to help job seekers optimize their resumes for Applicant Tracking Systems (ATS) and improve their chances of landing interviews.

## ✨ Features

- **AI-Powered Analysis:** Uses advanced AI (Google Gemini) to read, parse, and evaluate resumes against specific job descriptions.
- **ATS Scoring:** Calculates an ATS compatibility score based on keywords, formatting, and content structure.
- **Actionable Feedback:** Generates targeted suggestions for improving bullet points, impact metrics, and skills alignment.
- **User Dashboard:** Secure login system to save previous resume evaluations and track improvement over time.
- **PDF Support:** Seamlessly upload and extract text directly from PDF resume files using `pdfjs-dist`.
- **Eval-on-Eval Judge Engine:** Validates the AI's response for faithfulness and relevance, avoiding hallucinations.
- **Hybrid Semantic Caching:** Saves API costs and latency by caching identical resumes and job descriptions using SHA-256 and text hashing.

## 🛠️ Tech Stack

This project is built using the **MERN** stack along with AI integration:

- **Frontend:** React.js powered by Vite, TailwindCSS, Framer Motion, Recharts
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose (with in-memory fallback for development)
- **AI Integration:** `@google/generative-ai` (Google Gemini API) for resume analysis
- **File Parsing:** `pdfjs-dist` (for extracting text from modern PDFs) & `multer` (for handling file uploads)
- **Authentication:** `bcrypt` (password hashing) & `jsonwebtoken` (JWT for secure sessions)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- A Google Gemini API Key

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Junnu77/AI-Resume-evaluator.git
cd AI-Resume-evaluator
```

### 2. Install Dependencies
Install dependencies for the root, client, and server:
```bash
# Install root dependencies (for running concurrently)
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `server` directory and add the following configuration variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Run the Application
You can start both the frontend and backend servers simultaneously from the root directory:

```bash
# Run from the root directory
cd ..
npm run dev
```

Alternatively, you can run them separately:
* **Start Backend Server:** `cd server && npm run dev`
* **Start Frontend Client:** `cd client && npm run dev`

The client application will typically run on `http://localhost:5173` and the backend server on `http://localhost:5000`.

## 💡 Usage

1. Create an account or log in to the platform.
2. Upload a resume in PDF format.
3. (Optional) Paste a target job description for tailored analysis.
4. Click **Evaluate** and wait for the AI to process the document.
5. Review your ATS score, missing keywords, and detailed suggestions to improve your resume.
