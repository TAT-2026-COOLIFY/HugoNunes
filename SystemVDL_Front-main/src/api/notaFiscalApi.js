import api from "../services/api";

export const statusBling = () => api.get("/notaFiscal/bling/status");

export const urlAutorizacaoBling = () => api.get("/notaFiscal/bling/url-autorizacao");

export const listarNotasFiscais = () => api.get("/notaFiscal");

export const emitirNotaFiscal = (codigoOs) => api.post(`/notaFiscal/emitir/${codigoOs}`);

export const consultarNotaFiscal = (codigoOs) => api.get(`/notaFiscal/${codigoOs}`);