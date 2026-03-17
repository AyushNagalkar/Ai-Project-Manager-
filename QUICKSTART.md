# 🚀 SmartPM Quick Start Guide

## ⚡ Get Started in 5 Minutes

### Step 1: Environment Setup (2 minutes)

1. **Copy environment file:**
   ```bash
   Copy-Item .env.example .env
   ```

2. **Edit `.env` and add your credentials:**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smartpm?retryWrites=true&w=majority
   PLANNER_API_KEY=sk-your-openai-key
   RESEARCH_API_KEY=sk-your-openai-key
   MONITOR_API_KEY=sk-your-openai-key
   DOC_API_KEY=sk-your-openai-key
   JWT_SECRET=your-random-secret-string
   ```

### Step 2: Install Dependencies (2 minutes)

Run the installation script:
```powershell
.\install-all.ps1
```

Or manually:
```bash
# Backend
cd backend-node
npm install

# Frontend
cd ../frontend
npm install

# Python agents
pip install -r agents/planner/requirements.txt
pip install -r agents/research/requirements.txt
pip install -r agents/monitor/requirements.txt
pip install -r agents/documentation/requirements.txt
pip install -r orchestrator/requirements.txt
```

### Step 3: Start All Services (1 minute)

**Option A - Automated (Windows):**
```powershell
.\start-all.ps1
```

**Option B - Manual (7 terminals):**

Terminal 1 - Backend:
```bash
cd backend-node
npm run dev
```

Terminal 2 - Orchestrator:
```bash
cd orchestrator
python main.py
```

Terminal 3-6 - Agents:
```bash
# Terminal 3
cd agents/planner
python main.py

# Terminal 4
cd agents/research
python main.py

# Terminal 5
cd agents/monitor
python main.py

# Terminal 6
cd agents/documentation
python main.py
```

Terminal 7 - Frontend:
```bash
cd frontend
npm run dev
```

### Step 4: Access the Application

Open your browser and navigate to:
**http://localhost:3000**

### Step 5: Create Your First Project

1. **Register** a new account
2. **Login** with your credentials
3. Click **"New Project"**
4. Fill in:
   - Project Title: "AI Chatbot"
   - Domain: "Artificial Intelligence"
   - Problem Statement: "Build an intelligent chatbot using NLP"
5. Click **"Run Planner Agent"** to generate tasks
6. Click **"Run Research Agent"** to gather resources
7. View results in **Agent Outputs** panel

---

## 🧪 Testing the System

### Test Backend API
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"ok","message":"SmartPM Backend is running"}`

### Test Orchestrator
```bash
curl http://localhost:8000/health
```

### Test All Agents
```bash
curl http://localhost:8001/
curl http://localhost:8002/
curl http://localhost:8003/
curl http://localhost:8004/
```

---

## 📋 Common Issues & Solutions

### Issue: MongoDB Connection Error
**Solution:**
- Check MongoDB URI in `.env`
- Whitelist your IP in MongoDB Atlas (0.0.0.0/0 for testing)
- Verify database user has read/write permissions

### Issue: Agent Not Responding
**Solution:**
- Verify OpenAI API key in `.env`
- Check terminal logs for errors
- Ensure port is not already in use

### Issue: Frontend Can't Connect
**Solution:**
- Verify backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in frontend/.env.local
- Clear browser cache

### Issue: "Module not found" Error
**Solution:**
```bash
# For Node.js
cd backend-node
npm install

cd ../frontend
npm install

# For Python
pip install -r requirements.txt
```

---

## 🎯 What's Next?

After setup, you can:

1. **Create multiple projects** and organize your work
2. **Assign tasks** to team members
3. **Run agents** to automate planning and research
4. **Monitor progress** with the Monitor Agent
5. **Generate documentation** for your projects

---

## 📞 Need Help?

- Check [README.md](README.md) for detailed documentation
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Follow [SETUP-CHECKLIST.md](SETUP-CHECKLIST.md) step by step

---

## 🎉 You're Ready!

Your SmartPM system is now running. Start managing projects with AI! 🚀

**Happy AI Project Managing! 🤖✨**
