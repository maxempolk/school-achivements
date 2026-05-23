import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('accessToken');

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

export const innerApi = axios.create({
  baseURL: '',
  withCredentials: true,
});

innerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      window.location.pathname !== '/login'
    ) {
      const loginUrl = new URL('/login', window.location.origin);

      loginUrl.searchParams.set(
        'redirect',
        `${window.location.pathname}${window.location.search}`,
      );

      window.location.replace(loginUrl);
    }

    return Promise.reject(error);
  },
);
