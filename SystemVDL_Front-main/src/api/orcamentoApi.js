import api from "../services/api";

export function listarOrcamentos(page = 0, size = 10, status) {
  return api.get("/orcamentos", {
    params: { page, size, ...(status && { status }) }
  });
}

export function aprovarOrcamento(id) {
  return api.patch(`/orcamentos/${id}/aprovar`);
}

export function reprovarOrcamento(id) {
  return api.patch(`/orcamentos/${id}/reprovar`);
}

export function gerarPdf(id) {
  return api.get(`/orcamentos/${id}/pdf`, {
    responseType: "blob"
  });
}

export function criarOrcamento(data) {
  return api.post("/orcamentos", data);
}

export function buscarOrcamentoPorId(id) {
  return api.get(`/orcamentos/${id}/listar`);
}

export function editarOrcamento(id, data) {
  return api.put(`/orcamentos/${id}/editar`, data);
}

export function vincularCliente(id, data) {
  return api.post(`/orcamentos/${id}/cliente`, data);
}

export const listarGramaturas = () => api.get("/api/gramaturas");

export const buscarClientePorDocumento = (cpfCnpj) => {
    return api.get("/clientes/buscar-por-documento", {
      params: { cpfCnpj }
    });
};