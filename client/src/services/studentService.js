import api from './api';

export const studentService = {
  getProfile: () => api.get('/students/profile'),
  updateProfile: (data) => api.put('/students/profile', data),
  getMyApplications: () => api.get('/students/applications'),
};
