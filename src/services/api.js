import axios from 'axios';

// el "túnel" que conecta React con Node.js
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://apggestor-backend.onrender.com/api',
});

// Interceptor para adjuntar automáticamente el token JWT guardado en localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Función para hacer el Login (Envía nombre y password)
export const loginRequest = (credentials) => API.post('/auth/login', credentials);
// Función para registrar un cliente nuevo
export const createCustomerRequest = (customerData) => API.post('/customers', customerData);
// Función para registrar una nueva orden de trabajo en la base de datos
export const createJobRequest = (jobData) => API.post('/jobs', jobData);

export const getJobs = () => API.get('/jobs');
export const getOperators = () => API.get('/operators');
export const getCustomers = () => API.get('/customers');
export const createCustomer = (customerData) => API.post('/customers', customerData);
export const updateJobStatus = (id, statusData) => API.patch(`/jobs/${id}`, statusData);
export const updateJob = (id, jobData) => API.patch(`/jobs/${id}`, jobData);

// Peticiones específicas para la operativa ampliada
export const addMaterialAlert = (id, texto) => API.patch(`/jobs/${id}`, { alertaMaterialTexto: texto });
export const addJobDocument = (id, nuevoDocumento) => API.patch(`/jobs/${id}`, { nuevoDocumento });
export const addJobPartida = (id, nuevaPartida) => API.patch(`/jobs/${id}`, { nuevaPartida });

export default API;