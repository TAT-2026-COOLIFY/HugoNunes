import api from "../services/api";

// Traz os dados para a tabela de pedidos (Busca as OS do Back)
export const listarPedidosFábrica = () => {
    return api.get("/ordemServicos");
};

// Ação do botão: Transforma a OS concluída em uma Ordem de Entrega
export const gerarOrdemEntrega = (ordemServicoId) => {
    return api.post(`/ordementrega/${ordemServicoId}`);
};

// Abre o PDF da entrega em uma nova aba
export const visualizarPdfEntrega = (ordemEntregaId) => {
    window.open(`${api.defaults.baseURL}/ordementrega/${ordemEntregaId}/pdf`, "_blank");
};