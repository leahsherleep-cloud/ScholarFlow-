import api from './api';

export const documentService = {
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getByApplication: (applicationId) => api.get(`/documents/${applicationId}`),
  verify: (id) => api.patch(`/documents/${id}/verify`),
  reject: (id, rejectionReason) => api.patch(`/documents/${id}/reject`, { rejectionReason }),
};
