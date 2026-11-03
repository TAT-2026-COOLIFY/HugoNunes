import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Typography, Paper, Grid, Stack, Chip,
    CircularProgress, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Divider
} from "@mui/material";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";

import { listarOrcamentos } from "../../api/orcamentoApi";
import { listarOrdensCompra } from "../../api/ordemCompraApi";
import { listarPedidosFábrica } from "../../api/pedidosApi";
import { listarClientes } from "../../api/clienteApi";

const STATUS_ORCAMENTO_CONFIG = {
    PENDENTE: { cor: "#ff9800", label: "Pendente" },
    APROVADO: { cor: "#4caf50", label: "Aprovado" },
    REPROVADO: { cor: "#f44336", label: "Reprovado" },
    FINALIZADO: { cor: "#29b6f6", label: "Finalizado" }
};

export default function Dashboard() {
    const navigate = useNavigate();

    const [carregando, setCarregando] = useState(true);

    const [statusOrcamentos, setStatusOrcamentos] = useState({
        PENDENTE: 0, APROVADO: 0, REPROVADO: 0, FINALIZADO: 0
    });
    const [totalOrcamentos, setTotalOrcamentos] = useState(0);
    const [aguardandoOrdemCompra, setAguardandoOrdemCompra] = useState(0);
    const [orcamentosRecentes, setOrcamentosRecentes] = useState([]);

    const [ordensCompraPendentes, setOrdensCompraPendentes] = useState(0);
    const [totalOrdensCompra, setTotalOrdensCompra] = useState(0);

    const [pedidosEmProducao, setPedidosEmProducao] = useState([]);
    const [pedidosProntos, setPedidosProntos] = useState(0);
    const [totalVendido, setTotalVendido] = useState(0);

    const [totalClientes, setTotalClientes] = useState(0);

    useEffect(() => {
        async function carregarDados() {
            setCarregando(true);

            const [
                resPendente, resAprovado, resReprovado, resFinalizado, resRecentes,
                resOrdensCompra, resPedidos, resClientes
            ] = await Promise.allSettled([
                listarOrcamentos(0, 1, "PENDENTE"),
                listarOrcamentos(0, 200, "APROVADO"),
                listarOrcamentos(0, 1, "REPROVADO"),
                listarOrcamentos(0, 1, "FINALIZADO"),
                listarOrcamentos(0, 100),
                listarOrdensCompra(),
                listarPedidosFábrica(),
                listarClientes(0, 1)
            ]);

            // --- Orçamentos por status ---
            const countPendente = resPendente.status === "fulfilled" ? (resPendente.value.data.totalElements || 0) : 0;
            const aprovadosLista = resAprovado.status === "fulfilled" ? (resAprovado.value.data.content || []) : [];
            const countAprovado = resAprovado.status === "fulfilled" ? (resAprovado.value.data.totalElements || 0) : 0;
            const countReprovado = resReprovado.status === "fulfilled" ? (resReprovado.value.data.totalElements || 0) : 0;
            const countFinalizado = resFinalizado.status === "fulfilled" ? (resFinalizado.value.data.totalElements || 0) : 0;

            setStatusOrcamentos({
                PENDENTE: countPendente,
                APROVADO: countAprovado,
                REPROVADO: countReprovado,
                FINALIZADO: countFinalizado
            });

            setAguardandoOrdemCompra(aprovadosLista.filter((o) => !o.ordemCompraCriada).length);

            if (resRecentes.status === "fulfilled") {
                const lista = resRecentes.value.data.content || [];
                setTotalOrcamentos(resRecentes.value.data.totalElements || lista.length);
                setOrcamentosRecentes([...lista].sort((a, b) => b.id - a.id).slice(0, 5));
            }

            // --- Ordens de compra ---
            if (resOrdensCompra.status === "fulfilled") {
                const lista = resOrdensCompra.value.data || [];
                setTotalOrdensCompra(lista.length);
                setOrdensCompraPendentes(lista.filter((o) => o.status === "PENDENTE").length);
            }

            // --- Pedidos (ordens de serviço), agrupados por código do lote ---
            if (resPedidos.status === "fulfilled") {
                const itens = resPedidos.value.data || [];

                const somaVendido = itens
                    .filter((it) => it.statusProducao === "ENTREGUE")
                    .reduce((soma, it) => soma + Number(it.ordemCompraItem?.valorTotal || 0), 0);
                setTotalVendido(somaVendido);

                const grupos = itens.reduce((acc, item) => {
                    if (!item?.codigo) return acc;
                    if (!acc[item.codigo]) acc[item.codigo] = [];
                    acc[item.codigo].push(item);
                    return acc;
                }, {});

                const emProducao = [];
                let prontosCount = 0;

                Object.keys(grupos).forEach((codigo) => {
                    const itensDoLote = grupos[codigo];
                    const possuiEmProducao = itensDoLote.some((it) => it.statusProducao === "EM_PRODUCAO");
                    const todosEntregues = itensDoLote.every((it) => it.statusProducao === "ENTREGUE");

                    if (possuiEmProducao) {
                        emProducao.push({
                            codigo,
                            cliente: itensDoLote[0]?.ordemCompra?.cliente?.nomeCliente || "Não informado",
                            quantidadeItens: itensDoLote.length
                        });
                    } else if (!todosEntregues) {
                        prontosCount++;
                    }
                });

                setPedidosEmProducao(emProducao.slice(0, 5));
                setPedidosProntos(prontosCount);
            }

            // --- Clientes ---
            if (resClientes.status === "fulfilled") {
                setTotalClientes(resClientes.value.data.totalElements || 0);
            }

            setCarregando(false);
        }

        carregarDados();
    }, []);

    const totalStatusBar = Object.values(statusOrcamentos).reduce((a, b) => a + b, 0);

    if (carregando) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: "1300px", mx: "auto", pb: 6 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                    Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                    Visão geral do sistema
                </Typography>
            </Box>

            {/* KPIs */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <CartaoKpi
                        titulo="Total vendido (entregues)"
                        valor={totalVendido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        icone={<PaidOutlinedIcon />}
                        cor="#2e7d32"
                        onClick={() => navigate("/pedidos")}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <CartaoKpi
                        titulo="Orçamentos pendentes"
                        valor={statusOrcamentos.PENDENTE}
                        icone={<DescriptionOutlinedIcon />}
                        cor="#ff9800"
                        onClick={() => navigate("/orcamentos")}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <CartaoKpi
                        titulo="Aguardando ordem de compra"
                        valor={aguardandoOrdemCompra}
                        icone={<ThumbUpAltOutlinedIcon />}
                        cor="#4caf50"
                        onClick={() => navigate("/orcamentos")}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <CartaoKpi
                        titulo="Pedidos em produção"
                        valor={pedidosEmProducao.length}
                        icone={<PrecisionManufacturingOutlinedIcon />}
                        cor="#00c6ff"
                        onClick={() => navigate("/pedidos")}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <CartaoKpi
                        titulo="Pedidos prontos p/ retirada"
                        valor={pedidosProntos}
                        icone={<Inventory2OutlinedIcon />}
                        cor="#29b6f6"
                        onClick={() => navigate("/pedidos")}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <CartaoKpi
                        titulo="Clientes cadastrados"
                        valor={totalClientes}
                        icone={<GroupOutlinedIcon />}
                        cor="#9c27b0"
                        onClick={() => navigate("/clientes")}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Status dos orçamentos */}
                <Grid item xs={12} md={5}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: "16px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            height: "100%"
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            Status dos Orçamentos
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                width: "100%",
                                height: 10,
                                borderRadius: 5,
                                overflow: "hidden",
                                mb: 3,
                                backgroundColor: "rgba(255,255,255,0.06)"
                            }}
                        >
                            {Object.entries(statusOrcamentos).map(([status, count]) => {
                                if (!count || !totalStatusBar) return null;
                                const largura = (count / totalStatusBar) * 100;
                                return (
                                    <Box
                                        key={status}
                                        sx={{
                                            width: `${largura}%`,
                                            backgroundColor: STATUS_ORCAMENTO_CONFIG[status].cor
                                        }}
                                    />
                                );
                            })}
                        </Box>

                        <Stack spacing={1.5}>
                            {Object.entries(statusOrcamentos).map(([status, count]) => (
                                <Stack key={status} direction="row" alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Box
                                            sx={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                backgroundColor: STATUS_ORCAMENTO_CONFIG[status].cor
                                            }}
                                        />
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                            {STATUS_ORCAMENTO_CONFIG[status].label}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {count}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>

                        <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.06)" }} />

                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <ShoppingCartOutlinedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {ordensCompraPendentes} de {totalOrdensCompra} ordens de compra pendentes
                            </Typography>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Orçamentos recentes */}
                <Grid item xs={12} md={7}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: "16px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            overflow: "hidden",
                            height: "100%"
                        }}
                    >
                        <Box sx={{ p: 3, pb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Orçamentos recentes
                            </Typography>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: "text.secondary", pl: 3 }}>CÓDIGO</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>CLIENTE</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: "text.secondary", pr: 3 }}>STATUS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {orcamentosRecentes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 5, color: "text.secondary" }}>
                                                Nenhum orçamento encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        orcamentosRecentes.map((o) => {
                                            const cfg = STATUS_ORCAMENTO_CONFIG[o.status] || { cor: "#fff", label: o.status };
                                            return (
                                                <TableRow
                                                    key={o.id}
                                                    hover
                                                    onClick={() => navigate(`/orcamentos/${o.id}`)}
                                                    sx={{ cursor: "pointer" }}
                                                >
                                                    <TableCell sx={{ fontWeight: 600, pl: 3 }}>{o.codigo}</TableCell>
                                                    <TableCell>{o.nomeCliente}</TableCell>
                                                    <TableCell align="center" sx={{ pr: 3 }}>
                                                        <Chip
                                                            label={cfg.label}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                borderRadius: "8px",
                                                                backgroundColor: `${cfg.cor}22`,
                                                                color: cfg.cor,
                                                                border: "1px solid",
                                                                borderColor: cfg.cor
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Pedidos em produção */}
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: "16px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            overflow: "hidden"
                        }}
                    >
                        <Box sx={{ p: 3, pb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Pedidos em produção
                            </Typography>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: "text.secondary", pl: 3 }}>CÓDIGO</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>CLIENTE</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: "text.secondary", pr: 3 }}>ITENS NO LOTE</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pedidosEmProducao.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 5, color: "text.secondary" }}>
                                                Nenhum pedido em produção no momento.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pedidosEmProducao.map((p) => (
                                            <TableRow
                                                key={p.codigo}
                                                hover
                                                onClick={() => navigate("/pedidos")}
                                                sx={{ cursor: "pointer" }}
                                            >
                                                <TableCell sx={{ fontWeight: 600, pl: 3 }}>{p.codigo}</TableCell>
                                                <TableCell>{p.cliente}</TableCell>
                                                <TableCell align="center" sx={{ pr: 3 }}>{p.quantidadeItens}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

function CartaoKpi({ titulo, valor, icone, cor, onClick }) {
    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2.5,
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.2s ease",
                "&:hover": onClick ? {
                    borderColor: cor,
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    transform: "translateY(-2px)"
                } : {}
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${cor}22`,
                        color: cor
                    }}
                >
                    {icone}
                </Box>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {valor}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {titulo}
            </Typography>
        </Paper>
    );
}