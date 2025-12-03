import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api', // La dirección backend
  withCredentials: true // Para manejar cookies si fuera necesario a futuro
});

export default instance;