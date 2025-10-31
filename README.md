# WhiteWhale AI - Workflow Management Platform

A powerful AI-powered workflow management platform built with React frontend and Node.js backend, integrated with Google Gemini API.

## 🚀 Features

- **Visual Workflow Builder**: Drag and drop interface for creating AI workflows
- **Google Gemini Integration**: Powered by Google's advanced AI models
- **Real-time Execution**: Execute workflows with live feedback
- **Flexible Node System**: Input, Output, LLM, and various processing nodes
- **Production Ready**: Configured for deployment on major cloud platforms

## 📁 Project Structure

\`\`\`
WhiteWhaleAi 4.0/
├── backend/          # Node.js Express API server
│   ├── server.js     # Main server file
│   ├── package.json  # Backend dependencies
│   └── .env         # Backend environment variables
├── ui/              # React frontend application
│   ├── src/         # React source code
│   ├── public/      # Static assets
│   ├── package.json # Frontend dependencies
│   └── .env         # Frontend environment variables
└── DEPLOYMENT_GUIDE.md  # Detailed deployment instructions
\`\`\`

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google API key for Gemini

### Backend Setup
\`\`\`bash
cd backend
npm install
# Set up your .env file with GOOGLE_API_KEY
npm start
\`\`\`

### Frontend Setup
\`\`\`bash
cd ui
npm install
npm start
\`\`\`

## 🌐 Deployment

This project is configured for deployment on:
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Render.com, Vercel, Railway, or any Node.js hosting

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🔧 Environment Variables

### Backend
\`\`\`bash
PORT=8000
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=production
\`\`\`

### Frontend
\`\`\`bash
REACT_APP_API_URL=https://your-backend-url.com
\`\`\`

## 🏗️ Architecture

- **Frontend**: React with Zustand for state management, ReactFlow for workflow visualization
- **Backend**: Express.js with Google Gemini API integration
- **Communication**: RESTful API with CORS configuration for cross-origin requests

## 📚 API Endpoints

- `GET /health` - Health check endpoint
- `GET /test` - CORS test endpoint  
- `POST /run-workflow` - Execute workflow with AI processing
- `POST /pipelines/parse` - Parse and validate workflow structure

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🔗 Links

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
