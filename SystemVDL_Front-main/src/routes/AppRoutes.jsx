import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/login/Login"; 
import Dashboard from "../pages/dashboard/Dashboard";
import ListarOrcamentos from "../pages/orcamentos/ListarOrcamentos";
import CriarOrcamento from "../pages/orcamentos/CriarOrcamento";
import DetalheOrcamento from "../pages/orcamentos/DetalheOrcamento";
import CompletarCliente from "../pages/cliente/CompletarCadastro";

import ListarOrdensCompra from "../pages/ordemCompra/ListarOrdensCompra";
import CriarOrdemCompra from "../pages/ordemCompra/CriarOrdemCompra";
import DetalheOrdemCompra from "../pages/ordemCompra/DetalhesOrdemCompra";

import GerarOrdemServico from "../pages/servico/GerarOrdemServico";
import ListarPedidos from "../pages/pedidos/ListarPedidos";

import Cliente from "../pages/cliente/Cliente";
import DetalheCliente from "../pages/cliente/DetalheCliente";
import EditarCliente from "../pages/cliente/EditarCliente";

import PrivateRoute from "../components/PrivateRoute"; 

export default function AppRoutes() {
    return (
        <Routes>
            {/* 🔒 ROTAS PÚBLICAS */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orcamentos" element={<ListarOrcamentos />} />
                
                {/* 📌 ROTAS DE CLIENTES */}
                <Route path="/clientes" element={<Cliente />} />
                <Route path="/clientes/novo" element={<CompletarCliente />} />
                <Route path="/clientes/:id" element={<DetalheCliente />} />
                <Route path="/clientes/editar/:id" element={<EditarCliente />} />
                <Route path="/clientes/completar/:id" element={<CompletarCliente />} />

                <Route path="/orcamentos/novo" element={<CriarOrcamento />} />
                <Route path="/orcamentos/editar/:id" element={<CriarOrcamento />} />
                <Route path="/orcamentos/:id" element={<DetalheOrcamento />} />

                <Route path="/ordens" element={<ListarOrdensCompra />} />
                <Route path="/ordens/novo/:orcamentoId" element={<CriarOrdemCompra />} />
                <Route path="/pedidos/detalhe/:id" element={<DetalheOrdemCompra />} />

                <Route path="/ordem-servico/gerar/:id" element={<GerarOrdemServico />} />
                <Route path="/pedidos" element={<ListarPedidos />} />
            </Route>

            {/* Qualquer rota desconhecida redireciona para o Login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}