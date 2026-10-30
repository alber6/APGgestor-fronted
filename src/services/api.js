import axios from 'axios';

// el "túnel" que conecta React con Node.js
// const API = axios.create({
//   CAMBIAR CUANDO SE SUBA A PRODUCCION
//   baseURL: import.meta.env.VITE_API_URL || 'https://apggestor-backend.onrender.com/api',
//   baseURL: 'http://localhost:5000/api',

// });
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // En entorno local (localhost), conectar al backend local de Node en el puerto 5000
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  // En producción (Render/Vercel)
  return 'https://apggestor-backend.onrender.com/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
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
export const generateJobDocs = (id) => API.post(`/jobs/${id}/generate-docs`, {}, { responseType: 'blob' });
export const generateMemoriaPDF = (id) => API.get(`/jobs/${id}/generate-memoria`, { responseType: 'blob' });

// ----------------------------------------------------
// 👥 CLIENTES (CUSTOMERS) - CRUD COMPLETO
// ----------------------------------------------------
export const getCustomers = () => API.get('/customers');
export const createCustomer = (customerData) => API.post('/customers', customerData);
export const createCustomerRequest = createCustomer;
export const updateCustomer = (id, customerData) => API.put(`/customers/${id}`, customerData);
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);

// ----------------------------------------------------
// 👤 USUARIOS / OPERARIOS (USERS) - CRUD COMPLETO
// ----------------------------------------------------
export const getUsers = (rol) => API.get('/users' + (rol ? `?rol=${rol}` : ''));
export const createUser = (userData) => API.post('/users', userData);
export const updateUser = (id, userData) => API.put(`/users/${id}`, userData);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Alias para mantener compatibilidad
export const getOperators = () => getUsers('operario');
export const createOperator = (operatorData) => createUser({ ...operatorData, rol: 'operario' });
export const updateOperator = (id, operatorData) => updateUser(id, operatorData);
export const deleteOperator = (id) => deleteUser(id);

// ----------------------------------------------------
// ⏰ CONTROL HORARIO / REGISTRO DE JORNADA (RD-ley 8/2019)
// ----------------------------------------------------
export const punchTimeRecord = (punchData) => API.post('/time-records', punchData);
export const getCurrentTimeState = () => API.get('/time-records/estado-actual');
export const getMyTimeRecords = (params) => API.get('/time-records/mis-registros', { params });
export const getAllTimeRecords = (params) => API.get('/time-records', { params });
export const createManualTimeRecord = (recordData) => API.post('/time-records/manual', recordData);
export const updateTimeRecord = (id, updateData) => API.put(`/time-records/${id}`, updateData);
export const exportTimeRecordsCSV = (params) => API.get('/time-records/export/csv', { params, responseType: 'blob' });
export const exportTimeRecordsPDF = (params) => API.get('/time-records/export/pdf', { params, responseType: 'blob' });

// ----------------------------------------------------
// 🏖️ GESTIÓN DE VACACIONES Y PERMISOS
// ----------------------------------------------------
export const createLeaveRequest = (data) => API.post('/leave-requests', data);
export const getMyLeaveRequests = () => API.get('/leave-requests/mis-solicitudes');
export const cancelLeaveRequest = (id) => API.delete(`/leave-requests/${id}`);
export const getAllLeaveRequests = (params) => API.get('/leave-requests', { params });
export const updateLeaveRequestStatus = (id, data) => API.patch(`/leave-requests/${id}/estado`, data);

export default API;


