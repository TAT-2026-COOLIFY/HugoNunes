import api from "../services/api";

export const criarOrdemCompra = (orcamentoId, dados) => {
    return api.post(`/ordemcompras/${orcamentoId}`, dados);
};

export const listarOrdensCompra = () => {
    return api.get("/ordemcompras");
};

export const gerarPdfOrdemCompra = (id) => {
    return api.get(`/ordemcompras/${id}/pdf`, { responseType: "blob" });
};

export const buscarOrdemCompraPorId = (id) => {
    return api.get(`/ordemcompras/${id}`);
};