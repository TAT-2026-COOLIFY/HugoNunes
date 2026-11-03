import { useEffect, useState, useCallback } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Button, Chip, Typography, Box, Tabs, Tab,
    Pagination, Stack, TextField, InputAdornment, Paper, IconButton, Tooltip,
    Divider, CircularProgress
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import { useNavigate } from "react-router-dom";

import {
    listarOrcamentos,
    aprovarOrcamento,
    reprovarOrcamento,
    gerarPdf
} from "../../api/orcamentoApi";

export default function ListarOrcamentos() {
    const [orcamentos, setOrcamentos] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFiltro, setStatusFiltro] = useState("PENDENTE"); 
    const [buscaNome, setBuscaNome] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const carregarOrcamentos = useCallback((p = page) => {
        setLoading(true);
        listarOrcamentos(p, 10, statusFiltro)
            .then(res => {
                setOrcamentos(res.data.content || []);
                setTotalPages(res.data.totalPages || 0);
                setPage(res.data.number || 0);
            })
            .catch(err => console.error("Erro ao carregar orçamentos:", err))
            .finally(() => setLoading(false));
    }, [statusFiltro, page]);

    useEffect(() => {
        carregarOrcamentos(page);
    }, [page, statusFiltro, carregarOrcamentos]);

    function statusConfig(status) {
        switch (status) {
            case "PENDENTE":
                return { bg: "rgba(237, 108, 2, 0.12)", color: "#ff9800", label: "Pendente" };
            case "APROVADO":
                return { bg: "rgba(46, 125, 50, 0.12)", color: "#4caf50", label: "Aprovado" };
            case "REPROVADO":
                return { bg: "rgba(211, 47, 47, 0.12)", color: "#f44336", label: "Reprovado" };
            case "FINALIZADO":
                return { bg: "rgba(2, 136, 209, 0.12)", color: "#29b6f6", label: "Finalizado" };
            default:
                return { bg: "rgba(255, 255, 255, 0.08)", color: "#fff", label: status };
        }
    }

    function baixarPdf(id) {
        gerarPdf(id)
            .then(res => {
                const blob = new Blob([res.data], { type: "application/pdf" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Orcamento_${id}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(err => console.error("Erro ao gerar PDF:", err));
    }

    function handleAprovar(id) {
        aprovarOrcamento(id)
            .then(() => carregarOrcamentos(page))
            .catch(err => console.error("Erro ao aprovar:", err));
    }

    function handleReprovar(id) {
        reprovarOrcamento(id)
            .then(() => carregarOrcamentos(page))
            .catch(err => console.error("Erro ao reprovar:", err));
    }

    const orcamentosFiltrados = orcamentos.filter(o =>
        o.nomeCliente ? o.nomeCliente.toLowerCase().includes(buscaNome.toLowerCase()) : true
    );

    return (
        <Box sx={{ width: "100%", maxWidth: "1200px", mx: "auto", pb: 4 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                        Orçamentos
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Gerencie e acompanhe a evolução de todas as suas propostas comerciais
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="large"
                    onClick={() => navigate("/orcamentos/novo")}
                    sx={{
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                        py: 1.2,
                        background: "linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)",
                        boxShadow: "0 4px 20px 0 rgba(0, 114, 255, 0.35)",
                        "&:hover": {
                            background: "linear-gradient(135deg, #005bb5 0%, #009ecb 100%)",
                        }
                    }}
                >
                    Novo Orçamento
                </Button>    
            </Stack>

            <Paper 
                elevation={0} 
                sx={{ 
                    borderRadius: "16px",
                    border: "1px solid",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    overflow: "hidden"
                }}
            >
                <Box sx={{ p: 2.5, pb: 1 }}>
                    <Stack 
                        direction={{ xs: "column", md: "row" }} 
                        spacing={2} 
                        justifyContent="space-between" 
                        alignItems={{ xs: "stretch", md: "center" }} 
                    >
                        <Tabs
                            value={statusFiltro}
                            onChange={(e, newValue) => {
                                setStatusFiltro(newValue);
                                setPage(0);
                            }}
                            sx={{
                                minHeight: "44px",
                                backgroundColor: "rgba(0, 0, 0, 0.25)",
                                borderRadius: "12px",
                                p: "4px",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                "& .MuiTabs-indicator": { display: "none" },
                                "& .MuiTab-root": {
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                    color: "text.secondary",
                                    minHeight: "36px",
                                    borderRadius: "8px",
                                    px: 2.5,
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        color: "#fff",
                                        backgroundColor: "rgba(255, 255, 255, 0.04)"
                                    },
                                    "&[data-value='PENDENTE'].Mui-selected": {
                                        color: "#ff9800",
                                        backgroundColor: "rgba(237, 108, 2, 0.15)",
                                        border: "1px solid rgba(237, 108, 2, 0.3)"
                                    },
                                    "&[data-value='APROVADO'].Mui-selected": {
                                        color: "#4caf50",
                                        backgroundColor: "rgba(46, 125, 50, 0.15)",
                                        border: "1px solid rgba(46, 125, 50, 0.3)"
                                    },
                                    "&[data-value='REPROVADO'].Mui-selected": {
                                        color: "#f44336",
                                        backgroundColor: "rgba(211, 47, 47, 0.15)",
                                        border: "1px solid rgba(211, 47, 47, 0.3)"
                                    },
                                    "&[data-value='FINALIZADO'].Mui-selected": {
                                        color: "#29b6f6",
                                        backgroundColor: "rgba(2, 136, 209, 0.15)",
                                        border: "1px solid rgba(2, 136, 209, 0.3)"
                                    }
                                }
                            }}
                        >
                            <Tab label="Pendentes" value="PENDENTE" data-value="PENDENTE" />
                            <Tab label="Aprovados" value="APROVADO" data-value="APROVADO" />
                            <Tab label="Reprovados" value="REPROVADO" data-value="REPROVADO" />
                            <Tab label="Finalizados" value="FINALIZADO" data-value="FINALIZADO" /> 
                        </Tabs>

                        <TextField
                            size="small"
                            placeholder="Buscar por cliente..."
                            value={buscaNome}
                            onChange={(e) => setBuscaNome(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ 
                                width: { xs: "100%", md: 320 },
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                                }
                            }}
                        />
                    </Stack>
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

                <TableContainer>
                    <Table sx={{ width: "100%" }}>
                        <TableHead sx={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 2, width: "80px", pl: 3 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 2 }}>CLIENTE</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: "text.secondary", py: 2, width: "140px" }}>STATUS</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: "text.secondary", py: 2, pr: 3, width: "140px" }}>AÇÕES</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : orcamentosFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 8, color: "text.secondary" }}>
                                        Nenhum orçamento encontrado nesta categoria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orcamentosFiltrados.map(o => {
                                    const status = statusConfig(o.status);
                                    return (
                                        <TableRow 
                                            key={o.id}
                                            hover
                                            onClick={() => navigate(`/orcamentos/${o.id}`)}
                                            sx={{ 
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    backgroundColor: "rgba(255, 255, 255, 0.04) !important"
                                                },
                                                "&:last-child td, &:last-child th": { border: 0 },
                                                borderColor: "rgba(255, 255, 255, 0.05)"
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 600, color: "text.secondary", pl: 3 }}>
                                                #{o.id}
                                            </TableCell>
                                            
                                            <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem", textTransform: "capitalize" }}>
                                                {o.nomeCliente}
                                            </TableCell>

                                            <TableCell align="center">
                                                <Chip
                                                    label={status.label}
                                                    size="small"
                                                    sx={{ 
                                                        fontWeight: 700,
                                                        borderRadius: "8px",
                                                        backgroundColor: status.bg,
                                                        color: status.color,
                                                        border: "1px solid",
                                                        borderColor: status.color,
                                                        px: 1
                                                    }}
                                                />
                                                                                                {/* Aprovado, mas ainda falta algo para virar pedido */}
                                                {o.status === "APROVADO" && !o.ordemCompraCriada && (
                                                    <Box sx={{ mt: 0.8 }}>
                                                        {!o.clienteVinculado ? (
                                                            <Chip
                                                                icon={<PersonAddAlt1Icon sx={{ fontSize: 16 }} />}
                                                                label="Falta completar cadastro"
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/clientes/completar/${o.id}`);
                                                                }}
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: "0.72rem",
                                                                    backgroundColor: "rgba(255, 152, 0, 0.12)",
                                                                    color: "#ffb74d",
                                                                    border: "1px solid rgba(255, 152, 0, 0.4)",
                                                                    "& .MuiChip-icon": { color: "#ffb74d" },
                                                                    "&:hover": { backgroundColor: "rgba(255, 152, 0, 0.25)" }
                                                                }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                icon={<ShoppingCartCheckoutIcon sx={{ fontSize: 16 }} />}
                                                                label="Falta gerar ordem de compra"
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/ordens/novo/${o.id}`);
                                                                }}
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: "0.72rem",
                                                                    backgroundColor: "rgba(41, 182, 246, 0.12)",
                                                                    color: "#29b6f6",
                                                                    border: "1px solid rgba(41, 182, 246, 0.4)",
                                                                    "& .MuiChip-icon": { color: "#29b6f6" },
                                                                    "&:hover": { backgroundColor: "rgba(41, 182, 246, 0.25)" }
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>

                                            <TableCell 
                                                align="right"
                                                sx={{ pr: 3 }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title="Baixar PDF">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => baixarPdf(o.id)}
                                                            sx={{ 
                                                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                                "&:hover": { backgroundColor: "rgba(0, 114, 255, 0.2)" } 
                                                            }}
                                                        >
                                                            <PictureAsPdfIcon fontSize="small" sx={{ color: "#29b6f6" }} />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {o.status === "PENDENTE" && (
                                                        <>
                                                            <Tooltip title="Editar">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => navigate(`/orcamentos/editar/${o.id}`)}
                                                                    sx={{ 
                                                                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                                        "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.15)" } 
                                                                    }}
                                                                >
                                                                    <EditOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title="Aprovar">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => handleAprovar(o.id)}
                                                                    sx={{ 
                                                                        backgroundColor: "rgba(76, 175, 80, 0.1)",
                                                                        "&:hover": { backgroundColor: "rgba(76, 175, 80, 0.25)" } 
                                                                    }}
                                                                >
                                                                    <CheckCircleOutlineIcon fontSize="small" sx={{ color: "#4caf50" }} />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title="Reprovar">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => handleReprovar(o.id)}
                                                                    sx={{ 
                                                                        backgroundColor: "rgba(244, 67, 54, 0.1)",
                                                                        "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.25)" } 
                                                                    }}
                                                                >
                                                                    <HighlightOffIcon fontSize="small" sx={{ color: "#f44336" }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {totalPages > 1 && (
                    <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                        <Pagination 
                            count={totalPages} 
                            page={page + 1} 
                            onChange={(e, value) => setPage(value - 1)} 
                            color="primary"
                            shape="rounded"
                        />
                    </Box>
                )}
            </Paper>
        </Box>
    );
}