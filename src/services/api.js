import axios from 'axios';
// el "túnel" que conecta React con Node.js
const API = axios.create({
  baseURL: 'https://apggestor-backend.onrender.com/api',
});

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

export default API;