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

// ----------------------------------------------------
// 🔐 AUTENTICACIÓN
// ----------------------------------------------------
export const loginRequest = (credentials) => API.post('/auth/login', credentials);

// ----------------------------------------------------
// 📋 OBRAS / TRABAJOS (JOBS) - CRUD COMPLETO
// ----------------------------------------------------
export const getJobs = () => API.get('/jobs');
export const createJob = (jobData) => API.post('/jobs', jobData);
export const createJobRequest = createJob;
export const updateJob = (id, jobData) => API.patch(`/jobs/${id}`, jobData);
export const updateJobStatus = (id, statusData) => API.patch(`/jobs/${id}`, statusData);
export const deleteJob = (id) => API.delete(`/jobs/${id}`);

// Peticiones de detalle de obra (alertas, documentos, partidas)
export const addMaterialAlert = (id, texto) => API.patch(`/jobs/${id}`, { alertaMaterialTexto: texto });
export const addJobDocument = (id, nuevoDocumento) => API.patch(`/jobs/${id}`, { nuevoDocumento });
export const addJobPartida = (id, nuevaPartida) => API.patch(`/jobs/${id}`, { nuevaPartida });

// ----------------------------------------------------
// 👥 CLIENTES (CUSTOMERS) - CRUD COMPLETO
// ----------------------------------------------------
export const getCustomers = () => API.get('/customers');
export const createCustomer = (customerData) => API.post('/customers', customerData);
export const createCustomerRequest = createCustomer;
export const updateCustomer = (id, customerData) => API.put(`/customers/${id}`, customerData);
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);

// ----------------------------------------------------
// 👷 OPERARIOS (OPERATORS) - CRUD COMPLETO
// ----------------------------------------------------
export const getOperators = () => API.get('/operators');
export const createOperator = (operatorData) => API.post('/operators', operatorData);
export const updateOperator = (id, operatorData) => API.put(`/operators/${id}`, operatorData);
export const deleteOperator = (id) => API.delete(`/operators/${id}`);

export default API;
