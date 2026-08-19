# 🚀 AI Resume Evaluator

An intelligent, full-stack web application that leverages AI to analyze, score, and provide actionable feedback on candidate resumes. Built to help job seekers optimize their resumes for Applicant Tracking Systems (ATS) and improve their chances of landing interviews.

## ✨ Features

- **AI-Powered Analysis:** Uses advanced AI to read, parse, and evaluate resumes against industry standards or specific job descriptions.
- **ATS Scoring:** Calculates an ATS compatibility score based on keywords, formatting, and content structure.
- **Actionable Feedback:** Generates targeted suggestions for improving bullet points, impact metrics, and skills alignment.
- **User Dashboard:** Secure login system to save previous resume evaluations and track improvement over time.
- **PDF Support:** Seamlessly upload and extract text directly from PDF resume files.

## 🛠️ Tech Stack

This project is built using the **MERN** stack along with AI integration:

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI Integration:** LLM API (e.g., Gemini/OpenAI) for resume analysis
- **File Parsing:** PDF extraction libraries (e.g., `pdf-parse`)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- An API Key for your chosen AI Provider

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Junnu77/AI-Resume-evaluator.git
cd AI-Resume-evaluator
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add the following:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
AI_API_KEY=your_ai_provider_api_key
JWT_SECRET=your_jwt_secret_key
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal tab and navigate to the frontend folder:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
REACT_APP_API_URL=http://localhost:5000
```
Start the React application:
```bash
npm start
```

## 📁 Folder Structure

```text
AI-Resume-evaluator/
├── backend/
│   ├── controllers/      # API logic (evaluation, user auth)
│   ├── models/           # MongoDB schemas
│   ├── routes/           # Express routes
│   ├── utils/            # Helper functions (PDF parsing, AI prompts)
│   └── server.js         # Entry point for backend
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main views (Home, Dashboard, Results)
│   │   ├── context/      # React context for state management
│   │   └── App.js        # Main React component
│   └── package.json
└── README.md
```

## 💡 Usage

1. Create an account or log in to the platform.
2. Upload a resume in PDF format.
3. (Optional) Paste a target job description for tailored analysis.
4. Click **Evaluate** and wait for the AI to process the document.
5. Review your ATS score, missing keywords, and detailed suggestions to improve your resume.
