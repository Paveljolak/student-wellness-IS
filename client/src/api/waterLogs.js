import api from './axios';

export const waterLogsApi = {
  getByDate: (date)       => api.get('/water-logs', { params: { date } }),
  add:       (amount_ml, date) => api.post('/water-logs', { amount_ml, date }),
  delete:    (id)         => api.delete(`/water-logs/${id}`),
};
