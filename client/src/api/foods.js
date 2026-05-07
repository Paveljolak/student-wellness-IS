import api from './axios';

export const foodsApi = {
  search: (q = '') => api.get('/foods', { params: { q } }),
  get:    (id)     => api.get(`/foods/${id}`),
};
