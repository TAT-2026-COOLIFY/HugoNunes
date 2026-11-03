import api from "../services/api";

const API_URL = "/ordemServicos";

export const gerarOrdemServico = (ordemCompraId) => {
    return api.post(`${API_URL}/gerar/${ordemCompraId}`);
};

// Nova função para abrir o PDF com autenticação:
export const visualizarPdfOrdemServico = async (ordemCompraId, codigoOs) => {
    // Busca o arquivo PDF passando o token no header via Axios
    const response = await api.get(`${API_URL}/${ordemCompraId}/pdf`, {
        responseType: "blob",
    });

    // Baixa o arquivo com o código real da OS (ex: OS-0007), se disponível
    const file = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OrdemServico_${codigoOs || ordemCompraId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};