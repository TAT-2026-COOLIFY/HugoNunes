import api from "../services/api";

// Listar todos com paginação (Spring Data Pageable)
export async function listarClientes(page = 0, size = 10) {
    return await api.get(`/clientes?page=${page}&size=${size}`);
}

// Buscar cliente por ID
export async function buscarClientePorId(id) {
    return await api.get(`/clientes/${id}`);
}

// Buscar por CPF/CNPJ
export async function buscarPorCpfCnpj(cpfCnpj) {
    return await api.get(`/clientes/buscar-por-documento?cpfCnpj=${cpfCnpj}`);
}

// Buscar por Telefone
export async function buscarClientePorTelefone(telefone) {
    return await api.get(`/clientes/buscar-por-telefone?telefone=${telefone}`);
}

// Cadastrar novo cliente
export async function cadastrarCliente(clienteData) {
    return await api.get ? api.post("/clientes", clienteData) : await api.post("/clientes", clienteData);
}

// Atualizar cliente existente
export async function atualizarCliente(id, clienteData) {
    return await api.put(`/clientes/${id}`, clienteData);
}

// Deletar cliente por ID
export async function deletarCliente(id) {
    return await api.delete(`/clientes/${id}`);
}

// Listar orçamentos de um cliente específico
export async function listarOrcamentosDoCliente(id) {
    return await api.get(`/clientes/${id}/orcamentos`);
}