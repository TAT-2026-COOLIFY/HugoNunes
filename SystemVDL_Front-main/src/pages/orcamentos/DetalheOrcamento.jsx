import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Typography, Paper, Table, TableHead,
    TableRow, TableCell, TableBody,
    Button, Stack, Alert, TableContainer, Chip, IconButton, Grid, CircularProgress
} from "@mui/material";

import {
    aprovarOrcamento, reprovarOrcamento, gerarPdf, buscarOrcamentoPorId
} from "../../api/orcamentoApi";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

export default function DetalheOrcamento() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [orcamento, setOrcamento] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [processandoAcao, setProcessandoAcao] = useState(false);
    const [mensagemErro, setMensagemErro] = useState("");

    const carregarOrcamento = useCallback(() => {
        setCarregando(true);
        buscarOrcamentoPorId(id)
            .then((res) => {
                const dados = res.data || res;
                setOrcamento(dados);
                setMensagemErro("");
            })
            .catch((err) => {
                console.error("Erro ao buscar orçamento:", err);
                const msg = err.response?.data?.mensagem || err.response?.data?.message || "Não foi possível carregar os detalhes do orçamento.";
                setMensagemErro(msg);
            })
            .finally(() => {
                setCarregando(false);
            });
    }, [id]);

    useEffect(() => {
        carregarOrcamento();
    }, [carregarOrcamento]);

    function aprovar() {
        if (!orcamento?.id) return;
        setProcessandoAcao(true);
        setMensagemErro("");

        aprovarOrcamento(orcamento.id)
            .then(() => {
                carregarOrcamento();
            })
            .catch((err) => {
                console.error("Erro ao aprovar orçamento:", err);
                const msg = err.response?.data?.mensagem || err.response?.data?.message || "Erro ao aprovar o orçamento.";
                setMensagemErro(msg);
            })
            .finally(() => {
                setProcessandoAcao(false);
            });
    }

    function reprovar() {
        if (!orcamento?.id) return;
        setProcessandoAcao(true);
        setMensagemErro("");

        reprovarOrcamento(orcamento.id)
            .then(() => {
                carregarOrcamento();
            })
            .catch((err) => {
                console.error("Erro ao reprovar orçamento:", err);
                const msg = err.response?.data?.mensagem || err.response?.data?.message || "Erro ao reprovar o orçamento.";
                setMensagemErro(msg);
            })
            .finally(() => {
                setProcessandoAcao(false);
            });
    }

    function baixarPdf() {
        if (!orcamento?.id) return;
        setProcessandoAcao(true);
        setMensagemErro("");

        gerarPdf(orcamento.id)
            .then((res) => {
                const blob = new Blob([res.data], { type: "application/pdf" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Orcamento_${orcamento.codigo || orcamento.id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch((err) => {
                console.error("Erro ao gerar PDF:", err);
                const msg = err.response?.data?.mensagem || err.response?.data?.message || "Não foi possível gerar o arquivo PDF.";
                setMensagemErro(msg);
            })
            .finally(() => {
                setProcessandoAcao(false);
            });
    }

    const formatarMoeda = (valor) => {
        if (valor === undefined || valor === null) return "R$ 0,00";
        return Number(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    };

    const getStatusChip = (status) => {
        const config = {
            PENDENTE: { label: "Pendente", color: "#ff9800", bg: "rgba(255, 152, 0, 0.12)", border: "rgba(255, 152, 0, 0.3)" },
            APROVADO: { label: "Aprovado", color: "#4caf50", bg: "rgba(76, 175, 80, 0.12)", border: "rgba(76, 175, 80, 0.3)" },
            REPROVADO: { label: "Reprovado", color: "#f44336", bg: "rgba(244, 67, 54, 0.12)", border: "rgba(244, 67, 54, 0.3)" }
        };

        const item = config[status] || { label: status || "N/A", color: "#fff", bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)" };

        return (
            <Chip 
                label={item.label}
                sx={{ 
                    fontWeight: 700, 
                    color: item.color, 
                    backgroundColor: item.bg, 
                    border: `1px solid ${item.border}`,
                    fontSize: "0.85rem"
                }} 
            />
        );
    };

    if (carregando) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                <CircularProgress size={32} sx={{ color: "#00c6ff" }} />
                <Typography sx={{ ml: 2, color: "text.secondary" }}>Carregando orçamento...</Typography>
            </Box>
        );
    }

    if (!orcamento) {
        return (
            <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pt: 4 }}>
                <Alert severity="error" sx={{ borderRadius: "12px" }}>
                    {mensagemErro || "Orçamento não encontrado."}
                </Alert>
                <Button 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/orcamentos")}
                    sx={{ mt: 2, textTransform: "none" }}
                >
                    Voltar para a lista
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pb: 6 }}>
            {/* Cabeçalho */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <IconButton 
                    onClick={() => navigate("/orcamentos")}
                    sx={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.12)" }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                            Orçamento {orcamento.codigo || `#${orcamento.id}`}
                        </Typography>
                        {getStatusChip(orcamento.status)}
                    </Stack>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Visualização e gerenciamento do orçamento do cliente
                    </Typography>
                </Box>
            </Stack>

            <Stack spacing={3}>
                {mensagemErro && (
                    <Alert 
                        severity="error" 
                        onClose={() => setMensagemErro("")}
                        sx={{ borderRadius: "12px", fontWeight: "bold" }}
                    >
                        {mensagemErro}
                    </Alert>
                )}

                {/* Bloco 1: Informações do Cliente */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 3, 
                        borderRadius: "16px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        backgroundColor: "rgba(255, 255, 255, 0.02)"
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                        <PersonOutlineIcon sx={{ color: "#00c6ff" }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Informações do Cliente
                        </Typography>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700 }}>
                                Cliente
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                {orcamento.nomeCliente || "-"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700 }}>
                                Telefone
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                {orcamento.telefone || "-"}
                            </Typography>
                        </Grid>
                    </Grid>

                    {orcamento.clienteVinculado && (
                        <Alert 
                            severity="success" 
                            sx={{ 
                                mt: 2.5, 
                                borderRadius: "12px",
                                backgroundColor: "rgba(46, 125, 50, 0.12)",
                                color: "#66bb6a",
                                border: "1px solid rgba(46, 125, 50, 0.3)",
                                fontWeight: 600
                            }}
                        >
                            Cliente cadastrado e vinculado com sucesso
                        </Alert>
                    )}
                </Paper>

                {/* Bloco 2: Itens do Orçamento */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 3, 
                        borderRadius: "16px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        backgroundColor: "rgba(255, 255, 255, 0.02)"
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                        <Inventory2OutlinedIcon sx={{ color: "#4caf50" }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Itens do Orçamento
                        </Typography>
                    </Stack>

                    <TableContainer 
                        sx={{ 
                            borderRadius: "12px", 
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            backgroundColor: "rgba(0, 0, 0, 0.2)"
                        }}
                    >
                        <Table sx={{ minWidth: 700 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}>
                                    <TableCell sx={{ color: "text.secondary", fontWeight: 700 }}>Comprimento</TableCell>
                                    <TableCell sx={{ color: "text.secondary", fontWeight: 700 }}>Largura</TableCell>
                                    <TableCell sx={{ color: "text.secondary", fontWeight: 700 }}>Altura</TableCell>
                                    <TableCell sx={{ color: "text.secondary", fontWeight: 700 }}>Gramatura</TableCell>
                                    <TableCell sx={{ color: "text.secondary", fontWeight: 700 }}>Personalizada</TableCell>
                                    <TableCell align="right" sx={{ color: "text.secondary", fontWeight: 700 }}>1 à 300</TableCell>
                                    <TableCell align="right" sx={{ color: "text.secondary", fontWeight: 700 }}>301 à 800</TableCell>
                                    <TableCell align="right" sx={{ color: "text.secondary", fontWeight: 700 }}>Acima de 800</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {orcamento.itens?.map((item, index) => (
                                    <TableRow 
                                        key={item.id || index}
                                        sx={{ 
                                            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.02)" },
                                            "&:last-child td, &:last-child th": { border: 0 }
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 600 }}>{item.comprimento}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{item.largura}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{item.altura}</TableCell>
                                        <TableCell>{item.descGramatura || item.gramatura?.descricao || "-"}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={item.personalizada ? "Sim" : "Não"} 
                                                size="small"
                                                sx={{ 
                                                    fontWeight: 700,
                                                    fontSize: "0.75rem",
                                                    backgroundColor: item.personalizada ? "rgba(255, 152, 0, 0.15)" : "rgba(255, 255, 255, 0.08)",
                                                    color: item.personalizada ? "#ff9800" : "text.secondary",
                                                    border: `1px solid ${item.personalizada ? "rgba(255, 152, 0, 0.3)" : "rgba(255, 255, 255, 0.1)"}`
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: "#00c6ff" }}>
                                            {formatarMoeda(item.valorQtdPequena ?? item.valor)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: "#00c6ff" }}>
                                            {formatarMoeda(item.valorQtdMedia ?? item.valor)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: "#00c6ff" }}>
                                            {formatarMoeda(item.valorQtdGrande ?? item.valor)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Botões de Ação */}
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mt: 3, gap: 1 }}>
                        {orcamento.status === "PENDENTE" && (
                            <>
                                <Button
                                    variant="contained"
                                    disabled={processandoAcao}
                                    startIcon={processandoAcao ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
                                    onClick={aprovar}
                                    sx={{
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        backgroundColor: "#2e7d32",
                                        "&:hover": { backgroundColor: "#1b5e20" }
                                    }}
                                >
                                    Aprovar
                                </Button>
                                <Button
                                    variant="contained"
                                    disabled={processandoAcao}
                                    startIcon={processandoAcao ? <CircularProgress size={16} color="inherit" /> : <HighlightOffIcon />}
                                    onClick={reprovar}
                                    sx={{
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        backgroundColor: "#d32f2f",
                                        "&:hover": { backgroundColor: "#c62828" }
                                    }}
                                >
                                    Reprovar
                                </Button>
                            </>
                        )}

                        <Button
                            variant="outlined"
                            disabled={processandoAcao}
                            startIcon={processandoAcao ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
                            onClick={baixarPdf}
                            sx={{
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 700,
                                borderColor: "rgba(255, 255, 255, 0.2)",
                                color: "#fff",
                                "&:hover": {
                                    borderColor: "#00c6ff",
                                    backgroundColor: "rgba(0, 198, 255, 0.08)"
                                }
                            }}
                        >
                            Gerar PDF
                        </Button>

                        {orcamento.status === "PENDENTE" && (
                            <Button
                                variant="outlined"
                                disabled={processandoAcao}
                                startIcon={<EditOutlinedIcon />}
                                onClick={() => navigate(`/orcamentos/editar/${orcamento.id}`)}
                                sx={{
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderColor: "rgba(255, 255, 255, 0.2)",
                                    color: "#fff",
                                    "&:hover": {
                                        borderColor: "#00c6ff",
                                        backgroundColor: "rgba(0, 198, 255, 0.08)"
                                    }
                                }}
                            >
                                Editar
                            </Button>
                        )}

                        {orcamento.status === "APROVADO" && (
                            <>
                                {!orcamento.clienteVinculado && (
                                    <Button
                                        variant="contained"
                                        disabled={processandoAcao}
                                        startIcon={<PersonAddOutlinedIcon />}
                                        onClick={() => navigate(`/clientes/completar/${orcamento.id}`)}
                                        sx={{
                                            borderRadius: "10px",
                                            textTransform: "none",
                                            fontWeight: 700,
                                            background: "linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)"
                                        }}
                                    >
                                        Completar Cadastro
                                    </Button>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={<ShoppingCartOutlinedIcon />}
                                    disabled={processandoAcao || !orcamento.clienteVinculado || orcamento.ordemCompraCriada}
                                    onClick={() => navigate(`/ordens/novo/${orcamento.id}`)}
                                    sx={{
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        backgroundColor: "#2e7d32",
                                        "&:hover": { backgroundColor: "#1b5e20" },
                                        "&:disabled": {
                                            backgroundColor: "rgba(255, 255, 255, 0.12)",
                                            color: "rgba(255, 255, 255, 0.3)"
                                        }
                                    }}
                                >
                                    Criar Ordem Compra
                                </Button>
                            </>
                        )}
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
}