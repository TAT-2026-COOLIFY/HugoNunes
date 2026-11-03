import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Paper, Typography, Stack, Button, Divider, Table,
    TableBody, TableCell, TableHead, TableRow, TableContainer,
    Chip, CircularProgress, Card, CardContent
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";

import { buscarClientePorId, listarOrcamentosDoCliente } from "../../api/clienteApi";

export default function DetalheCliente() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cliente, setCliente] = useState(null);
    const [orcamentos, setOrcamentos] = useState([]);
    const [loading, setLoading] = useState(true);

    const carregarDados = useCallback(() => {
        setLoading(true);
        Promise.all([
            buscarClientePorId(id),
            listarOrcamentosDoCliente(id)
        ])
            .then(([resCliente, resOrcamentos]) => {
                setCliente(resCliente.data);
                setOrcamentos(resOrcamentos.data || []);
            })
            .catch(err => console.error("Erro ao carregar detalhes do cliente:", err))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

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

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: "1200px", mx: "auto", pb: 4 }}>
            {/* Header com Voltar e Editar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/clientes")}
                    sx={{ color: "text.secondary", textTransform: "none" }}
                >
                    Voltar
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/clientes/editar/${id}`)}
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
            </Stack>

            {/* Dados Gerais do Cliente */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)"
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <PersonIcon sx={{ fontSize: 32, color: "#00c6ff" }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {cliente?.nomeCliente || "Cliente não encontrado"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            CPF/CNPJ: {cliente?.cpfCnpj || "Não informado"}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.06)" }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PhoneIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="body2">{cliente?.telefone || "—"}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EmailIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="body2">{cliente?.email || "—"}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LocationOnIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="body2">
                            {cliente?.endereco?.municipio ? `${cliente.endereco.rua || ""}, ${cliente.endereco.municipio}` : "Endereço não informado"}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* Lista de Orçamentos Vinculados */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Orçamentos Vinculados ({orcamentos.length})
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    overflow: "hidden"
                }}
            >
                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: "text.secondary", pl: 3 }}>ORÇAMENTO</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, color: "text.secondary" }}>STATUS</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: "text.secondary", pr: 3 }}>AÇÃO</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orcamentos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                        Nenhum orçamento encontrado para este cliente.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orcamentos.map(o => {
                                    const status = statusConfig(o.status);
                                    return (
                                        <TableRow
                                            key={o.id}
                                            hover
                                            onClick={() => navigate(`/orcamentos/${o.id}`)}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <TableCell sx={{ fontWeight: 600, pl: 3 }}>
                                                #{o.id}
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
                                                        borderColor: status.color
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ pr: 3 }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<DescriptionIcon />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/orcamentos/${o.id}`);
                                                    }}
                                                    sx={{ textTransform: "none" }}
                                                >
                                                    Ver Orçamento
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}