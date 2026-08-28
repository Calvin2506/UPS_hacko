import axios from 'axios';
import { networkStats } from './networkStats';

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

client.interceptors.response.use((response) => {
  networkStats.record(response.data);
  return response;
});

export default client;
