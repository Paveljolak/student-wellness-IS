import api from './axios';

export const foodLogsApi = {
  getByDate: (date) => api.get('/food-logs', { params: { date } }),
  add:       (data) => api.post('/food-logs', data),
  delete:    (id)   => api.delete(`/food-logs/${id}`),
};
