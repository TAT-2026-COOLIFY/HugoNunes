import axios from "axios";

// 1. Instância base da API
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

// 2. Interceptor: injeta o Token JWT em TODAS as requisições automaticamente
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. Função de Login
export const loginApi = async (username, password) => {
    const response = await api.post("/auth/login", {
        username,
        password
    });
    return response.data;
};

export default api;