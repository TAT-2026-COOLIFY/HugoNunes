import api from "../services/api";

// Consulta os dados da empresa pelo CNPJ (o backend usa CNPJ.ws / BrasilAPI)
export const consultarCnpj = (cnpj) => api.get(`/consulta-cnpj/${cnpj}`);