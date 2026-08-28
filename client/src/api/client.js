import axios from 'axios';
import { networkStats } from './networkStats';

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
const roleRef = { current: 'dispatcher' };

export const setApiRole = (role) => { roleRef.current = role; };

client.interceptors.request.use((config) => {
  config.headers['X-User-Role'] = roleRef.current;
  return config;
});

client.interceptors.response.use((response) => {
  networkStats.record(response.data);
  return response;
});

export default client;
