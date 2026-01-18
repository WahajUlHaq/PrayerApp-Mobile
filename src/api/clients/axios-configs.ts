import axios from 'axios';
import { Platform } from 'react-native';

import { serverConfigs } from '@constants/server-config';

const axiosInstance = axios.create({
  baseURL: serverConfigs.baseURL,
  timeout: serverConfigs.timeout,
  headers: {
    ...serverConfigs.headers,
    Platform: Platform.OS,
  },
});

export const get = async <T>(url: string, params?: any): Promise<T> => {
  const response = await axiosInstance.get<T>(url, { params });
  return response.data;
};

export const api = {
  get,
};

export default axiosInstance;
