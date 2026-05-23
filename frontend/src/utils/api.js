import axios from 'axios';

// Initialize Axios client with proxy-compatible path or environment fallback
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic request interceptor to inject the JWT auth bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to handle auth token expiration (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and reload if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not on the login page already, redirect or reload
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  register: async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  resetPassword: async (email, newPassword, confirmPassword) => {
    const response = await api.post('/auth/reset-password', { email, newPassword, confirmPassword });
    return response.data;
  }
};

export const productsAPI = {
  getAll: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  getLowStock: async () => {
    const response = await api.get('/products/low-stock');
    return response.data;
  },
  create: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
  update: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

export const suppliersAPI = {
  getAll: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },
  create: async (supplierData) => {
    const response = await api.post('/suppliers', supplierData);
    return response.data;
  }
};

export const transactionsAPI = {
  getAll: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },
  create: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  }
};

export default api;
