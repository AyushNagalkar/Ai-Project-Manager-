import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { name?: string; age?: number; contact?: string; skills?: string[]; education?: string; experience?: string }) =>
    api.put('/auth/profile', data),
}

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  createWithAgents: (data: any) => api.post('/projects/with-agents', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
}

// Tasks API
export const tasksAPI = {
  getByProject: (projectId: string) => api.get(`/tasks/project/${projectId}`),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  complete: (id: string) => api.patch(`/tasks/${id}/complete`),
  uncomplete: (id: string) => api.patch(`/tasks/${id}/uncomplete`),
  delete: (id: string) => api.delete(`/tasks/${id}`),
}

// Members API
export const membersAPI = {
  add: (projectId: string, data: { name: string; email: string; age?: number; contact?: string; skills?: string[]; password?: string }) =>
    api.post(`/projects/${projectId}/members`, data),
  uploadResume: (projectId: string, file: File) => {
    const formData = new FormData()
    formData.append('resume', file)
    return api.post(`/projects/${projectId}/members/upload-resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getAll: (projectId: string) => api.get(`/projects/${projectId}/members`),
  remove: (projectId: string, userId: string) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
}

// Agents API
export const agentsAPI = {
  callPlanner: (data: any) => api.post('/agents/planner', data),
  callResearch: (data: any) => api.post('/agents/research', data),
  callMonitor: (data: any) => api.post('/agents/monitor', data),
  callDocumentation: (data: any) => api.post('/agents/documentation', data),
  getOutputs: (projectId: string) => api.get(`/agents/outputs/${projectId}`),
  getDocuments: (projectId: string) => api.get(`/agents/documents/${projectId}`),
  getProgressLogs: (projectId: string) => api.get(`/agents/progress/${projectId}`),
}

export default api
