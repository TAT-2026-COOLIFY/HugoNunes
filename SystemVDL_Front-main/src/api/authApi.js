import api from "../services/api";

export const loginApi = async (username, password) => {
    const response = await api.post("/auth/login", {
        username,
        password
    });
    return response.data;
};