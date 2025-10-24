<div align="center">
  <img src="components/btulogo.png" alt="AI Study Buddy Logo" width="200" height="200" />
  
  # 🤖 AI Study Buddy
  
  *Your all-in-one AI companion for productivity, learning, and creativity*
  
  [![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.2.0-purple.svg)](https://vitejs.dev/)
  [![Gemini AI](https://img.shields.io/badge/Gemini-2.5--Pro-green.svg)](https://ai.google.dev/)
  
</div>

---

## ✨ Features

### 🧠 **AI PDF Reading Assistant**
- **Smart Document Analysis**: Upload PDFs and get instant summaries, explanations, and insights
- **Interactive Chat**: Ask questions about your documents with context-aware AI responses
- **Voice Interaction**: Speak with your documents using real-time voice conversations
- **Visual Learning**: Generate mindmaps and flashcards from your content
- **Text-to-Speech**: Listen to AI responses with natural voice synthesis
- **Smart Notes**: Take and download notes while studying

### 📅 **AI Routine Maker**
- **Personalized Schedules**: Generate custom daily and weekly routines based on your goals
- **Multi-modal Input**: Upload calendar images or describe your schedule in text
- **Life Coaching**: Get balanced routines covering work, study, fitness, and relaxation
- **Adaptive Planning**: AI considers your constraints and builds schedules around them

### 🌍 **Language Learning Game**
- **Interactive Exercises**: Multiple game types including sentence scramble, word translation, and fill-in-the-blank
- **Grammar Feedback**: Real-time grammar checking with detailed explanations
- **Pronunciation Practice**: Voice-based pronunciation evaluation
- **Multi-language Support**: Learn any language with AI-powered exercises

### 🎨 **AI Drawing Artist**
- **Co-creation**: Draw sketches and let AI enhance them based on your prompts
- **Creative Collaboration**: Transform your drawings into professional artwork
- **Style Preservation**: Maintain your artistic style while adding AI enhancements

### 🎯 **AI Event Discovery**
- **Smart Recommendations**: Find personalized events happening near you
- **Category Filtering**: Discover events across multiple categories
- **Real-time Data**: Get up-to-date event information with registration links

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Gemini API Key** from [Google AI Studio](https://ai.google.dev/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-study-buddy.git
   cd ai-study-buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   echo "VITE_API_KEY=your_gemini_api_key_here" > .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

---

## 📱 Screenshots

<div align="center">
  <h3>🏠 Main Dashboard</h3>
  <img src="components/img/Screenshot 2025-10-20 at 10.04.03 PM.png" alt="Main Dashboard" width="800" />
  
  <h3>📄 PDF Reading Assistant</h3>
  <img src="components/img/Screenshot 2025-10-20 at 10.05.46 PM.png" alt="PDF Assistant" width="800" />
  
  <h3>🎯 AI Routine Maker</h3>
  <img src="components/img/Screenshot 2025-10-20 at 10.11.28 PM.png" alt="Routine Maker" width="800" />
  
  <h3>🌍 Language Learning</h3>
  <img src="components/img/Screenshot 2025-10-20 at 10.11.46 PM.png" alt="Language Game" width="800" />
  
  <h3>🎨 Drawing Assistant</h3>
  <img src="components/img/Screenshot 2025-10-20 at 10.13.39 PM.png" alt="Drawing Assistant" width="800" />
  
  <h3>🎪 Event Discovery</h3>
  <img src="components/img/Screenshot 2025-10-20 at 10.16.08 PM.png" alt="Event Discovery" width="800" />
  
  <h3>🎨 Drawing Results</h3>
  <img src="components/img/Screenshot 2025-10-20 at 10.17.21 PM.png" alt="Drawing Results" width="800" />
</div>

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - Modern UI framework
- **TypeScript 5.8.2** - Type-safe development
- **Vite 6.2.0** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React PDF** - PDF viewing capabilities
- **React Markdown** - Rich text rendering

### AI & Backend
- **Google Gemini 2.5 Pro** - Advanced AI model for text processing
- **Gemini 2.5 Flash** - Fast AI model for image generation
- **Gemini Live** - Real-time voice conversations
- **Web Audio API** - Audio processing and playback

### Key Features
- **Multi-modal AI** - Text, image, and voice processing
- **Real-time Voice** - Live conversation capabilities
- **PDF Processing** - Document analysis and interaction
- **Image Generation** - AI-powered visual content creation
- **Responsive Design** - Works on desktop and mobile

---

## 🎯 Use Cases

### 📚 **For Students**
- Upload lecture notes and get instant summaries
- Generate study flashcards and mindmaps
- Practice language skills with interactive games
- Create study schedules that balance academics and life

### 💼 **For Professionals**
- Analyze documents and reports quickly
- Generate personalized work routines
- Practice new languages for career growth
- Discover networking events and professional development opportunities

### 🎨 **For Creatives**
- Collaborate with AI on artistic projects
- Transform sketches into professional artwork
- Generate visual content for presentations
- Explore creative event opportunities

---

## 🔧 Configuration

### Environment Variables
```bash
# Required
VITE_API_KEY=your_gemini_api_key_here

# Optional (for advanced features)
VITE_DEBUG=false
VITE_MAX_FILE_SIZE=10485760  # 10MB
```

### API Key Setup
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create a new project
3. Generate an API key
4. Add it to your `.env.local` file

---

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Linting & Formatting
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

---

## 🌟 Key Features Deep Dive

### 🧠 **AI PDF Assistant**
- **Context-Aware Chat**: AI understands the current page and selected text
- **Smart Actions**: One-click summarize, explain, quiz, mindmap, and flashcard generation
- **Voice Integration**: Speak to your documents with real-time transcription
- **Note Management**: Take, save, and download notes while studying

### 📅 **Routine Maker**
- **Goal-Oriented Planning**: AI considers your specific goals and constraints
- **Image Analysis**: Upload calendar screenshots for personalized scheduling
- **Balanced Approach**: Ensures work-life balance in generated routines
- **Practical Tips**: Includes actionable advice for stress reduction and productivity

### 🌍 **Language Learning**
- **Multiple Game Types**: Sentence scramble, word translation, fill-in-the-blank
- **Adaptive Difficulty**: AI adjusts based on your progress
- **Grammar Feedback**: Detailed explanations of language rules
- **Pronunciation Practice**: Voice-based learning with AI feedback

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for providing powerful AI capabilities
- **React Team** for the amazing framework
- **Vite Team** for the lightning-fast build tool
- **Tailwind CSS** for the utility-first styling approach

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-study-buddy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-study-buddy/discussions)
- **Email**: support@aistudybuddy.com

---

<div align="center">
  <p>Made with ❤️ by the AI Study Buddy Team</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>