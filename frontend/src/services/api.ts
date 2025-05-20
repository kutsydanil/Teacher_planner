import axios from 'axios';
import { ApiResponse, User, Subject, Group, Event, Plan, CreatePlanDto, UpdatePlanDto, CreateEventDto } from '../types';

import { handleError} from '../utils/errorHandler';


import 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Блокируем повторный retry для эндпоинтов /auth/
    if (originalRequest.url.includes('/auth/')) {
      return Promise.reject(error);
    }

    if ([401, 403].includes(error.response?.status) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post('/api/auth/refresh/');
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  googleLogin: async (code: string): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post<ApiResponse<User>>('/api/auth/google/', { code });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  refreshToken: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post('/api/auth/refresh/');
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  logout: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post('/api/auth/logout/');
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  getUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get<ApiResponse<User>>('/api/auth/user/');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

export const subjectsApi = {
  getAll: async (): Promise<ApiResponse<Subject[]>> => {
    const response = await api.get('/api/subjects/');
  return { data: response.data.results };
},
  
  getById: async (id: string): Promise<ApiResponse<Subject>> => {
    const response = await api.get<ApiResponse<Subject>>(`/api/subjects/${id}/`);
    return response.data;
  },
  
  create: async (data: Omit<Subject, 'id' | 'created_at'>): Promise<ApiResponse<Subject>> => {
    const response = await api.post<ApiResponse<Subject>>('/api/subjects/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Omit<Subject, 'id' | 'created_at'>>): Promise<ApiResponse<Subject>> => {
    const response = await api.put<ApiResponse<Subject>>(`/api/subjects/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/subjects/${id}/`);
  },
};

export const groupsApi = {
  getAll: async (): Promise<ApiResponse<Group[]>> => {
    const response = await api.get('/api/groups/');
    return { data: response.data.results };
  },
  
  getById: async (id: string): Promise<ApiResponse<Group>> => {
    const response = await api.get<ApiResponse<Group>>(`/api/groups/${id}/`);
    return response.data;
  },
  
  create: async (data: Omit<Group, 'id' | 'created_at'>): Promise<ApiResponse<Group>> => {
    const response = await api.post<ApiResponse<Group>>('/api/groups/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Omit<Group, 'id' | 'created_at'>>): Promise<ApiResponse<Group>> => {
    const response = await api.put<ApiResponse<Group>>(`/api/groups/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/groups/${id}/`);
  },
};

export const eventsApi = {
  getAll: async (): Promise<ApiResponse<Event[]>> => {
    const response = await api.get('/api/events/');
    return { data: response.data.results }; 
  },
  
  getById: async (id: string): Promise<ApiResponse<Event>> => {
    const response = await api.get<ApiResponse<Event>>(`/api/events/${id}/`);
    return response.data;
  },
  
  getByDateRange: async (start: string, end: string): Promise<ApiResponse<Event[]>> => {
    const response = await api.get<ApiResponse<Event[]>>('/api/events/by-date-range/', {
      params: { start, end }
    });
    return response.data;
  },
  
  create: async (data: CreateEventDto): Promise<ApiResponse<Event>> => {
    const response = await api.post<ApiResponse<Event>>('/api/events/', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Omit<Event, 'id' | 'created_at'>>): Promise<ApiResponse<Event>> => {
    const response = await api.put<ApiResponse<Event>>(`/api/events/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/events/${id}/`);
  },
};

export const plansApi = {
  getAll: async (): Promise<ApiResponse<Plan[]>> => {
    const response = await api.get('/api/plans/');
    return { data: response.data.results };
  },
  getById: async (id: string): Promise<ApiResponse<Plan>> => {
    const response = await api.get<ApiResponse<Plan>>(`/api/plans/${id}/`);
    return response.data;
  },
  create: async (data: CreatePlanDto): Promise<ApiResponse<Plan>> => {
    const response = await api.post<ApiResponse<Plan>>('/api/plans/', data);
    return response.data;
  },
  update: async (id: string, data: UpdatePlanDto): Promise<ApiResponse<Plan>> => {
    const response = await api.put<ApiResponse<Plan>>(`/api/plans/${id}/`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/plans/${id}/`);
  },
};

export const statsApi = {
  getAll: async () => api.get('/api/stats/'),
  getByMonth: async (month: number, year: number) => 
    api.get(`/api/stats/by_month/?month=${month}&year=${year}`),
};