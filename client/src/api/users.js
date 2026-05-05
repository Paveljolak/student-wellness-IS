import api from './axios';

export const usersApi = {
  updateProfile: (data) => api.put('/users/profile', data),
};
