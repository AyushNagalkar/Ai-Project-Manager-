# SmartPM Setup Checklist

## ✅ Pre-Setup
- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] MongoDB Atlas account created
- [ ] OpenAI API key obtained

## ✅ Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Add MongoDB URI to `.env`
- [ ] Add OpenAI API keys to `.env`
- [ ] Add JWT secret to `.env`

## ✅ Installation
- [ ] Run `.\install-all.ps1` to install all dependencies
- [ ] Verify no installation errors

## ✅ Database Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured (0.0.0.0/0 for testing)
- [ ] Connection string tested

## ✅ Start Services
- [ ] Run `.\start-all.ps1`
- [ ] Verify all 7 services start successfully
- [ ] Check health endpoints:
  - [ ] http://localhost:5000/health
  - [ ] http://localhost:8000/health
  - [ ] http://localhost:8001/
  - [ ] http://localhost:8002/
  - [ ] http://localhost:8003/
  - [ ] http://localhost:8004/
  - [ ] http://localhost:3000

## ✅ Testing
- [ ] Open frontend at http://localhost:3000
- [ ] Register a new user
- [ ] Login successfully
- [ ] Create a new project
- [ ] Test calling Planner Agent
- [ ] Test calling Research Agent

## ❗ Common Issues

### MongoDB Connection Failed
- Check MongoDB URI format
- Verify IP whitelist
- Check database user permissions

### Agent Not Responding
- Verify API keys in .env
- Check agent service logs
- Ensure port is not in use

### Frontend Build Error
- Run `npm install` in frontend folder
- Clear .next folder
- Check Node.js version

## 📝 Notes
- Default ports: Backend (5000), Orchestrator (8000), Agents (8001-8004), Frontend (3000)
- All services must be running for full functionality
- Monitor terminal windows for error messages
