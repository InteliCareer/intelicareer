import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth helpers
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
}

// User helpers
export const userApi = {
  me: () => api.get('/users/me'),
  update: (data: Record<string, unknown>) => api.put('/users/me', data),
  skills: () => api.get('/users/me/skills'),
  addSkill: (data: { skillId: string; level?: string; yearsUsed?: number }) =>
    api.post('/users/me/skills', data),
  removeSkill: (skillId: string) => api.delete(`/users/me/skills/${skillId}`),
}

// Applications helpers
export const appsApi = {
  list: (params?: Record<string, string>) => api.get('/applications', { params }),
  create: (data: Record<string, unknown>) => api.post('/applications', data),
  get: (id: string) => api.get(`/applications/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/applications/${id}`, data),
  updateStage: (id: string, stage: string) => api.patch(`/applications/${id}/stage`, { stage }),
  delete: (id: string) => api.delete(`/applications/${id}`),
  addNote: (id: string, content: string) => api.post(`/applications/${id}/notes`, { content }),
  addContact: (id: string, data: Record<string, unknown>) =>
    api.post(`/applications/${id}/contacts`, data),
  stats: () => api.get('/applications/stats/summary'),
}

// Skills helpers
export const skillsApi = {
  list: () => api.get('/skills'),
  search: (q: string) => api.get('/skills/search', { params: { q } }),
}

// Market helpers
export const marketApi = {
  topSkills: (role?: string, days?: number) =>
    api.get('/market/top-skills', { params: { role, days } }),
  recentJobs: (role?: string, remote?: boolean) =>
    api.get('/market/recent-jobs', { params: { role, remote } }),
  skillGap: (role?: string) =>
    api.get('/market/skill-gap', { params: { role } }),
  salaryRanges: (role?: string) =>
    api.get('/market/salary-ranges', { params: { role } }),
}

// Resume helpers
export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('resume', file)
    return api.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  info: () => api.get('/resume'),
  download: () => api.get('/resume/download', { responseType: 'blob' }),
  remove: () => api.delete('/resume'),
}

// Scraper helpers
export const scraperApi = {
  run: (mode?: 'europe' | 'global') => api.post('/scraper/run', { mode: mode || 'europe' }),
  jobs: (params?: Record<string, string>) => api.get('/scraper/jobs', { params }),
  stats: () => api.get('/scraper/stats'),
}

// Auto-apply helpers
export const autoApplyApi = {
  apply: (jobId: string, coverLetter?: string) =>
    api.post(`/auto-apply/${jobId}`, { coverLetter }),
  bulkApply: (jobIds: string[]) => api.post('/auto-apply', { jobIds }),
  stats: () => api.get('/auto-apply/stats'),
  history: (params?: Record<string, string>) => api.get('/auto-apply/history', { params }),
  eligible: () => api.get('/auto-apply/eligible'),
  skip: (jobId: string) => api.patch(`/auto-apply/${jobId}/skip`),
}
