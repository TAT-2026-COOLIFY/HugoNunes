import { useEffect, useState, useCallback } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Button, Typography, Box, Pagination, Stack, TextField, InputAdornment, 
    Paper, IconButton, Tooltip, Divider, CircularProgress
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNavigate } from "react-router-dom";

// Certifique-se de que o caminho do import da API está correto (removido o deletarCliente, pois não é mais usado aqui)
import { listarClientes } from "../../api/clienteApi"; 

export default function ListarClientes() {
    const [clientes, setClientes] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const carregarClientes = useCallback((pagina = page) => {
        setLoading(true);
        listarClientes(pagina, 10)
            .then(res => {
                // Mapeia a estrutura Page<ClienteResponseDTO> do Spring Boot
                setClientes(res.data.content || []);
                setTotalPages(res.data.totalPages || 0);
                setPage(res.data.number || 0);
            })
            .catch(err => console.error("Erro ao carregar clientes do backend:", err))
            .finally(() => setLoading(false));
    }, [page]);

    useEffect(() => {
        carregarClientes(page);
    }, [page, carregarClientes]);

    // Filtro local por Nome ou CPF/CNPJ
    const clientesFiltrados = clientes.filter(c => {
        const termo = busca.toLowerCase();
        const nome = c.nomeCliente ? c.nomeCliente.toLowerCase() : "";
        const doc = c.cpfCnpj ? c.cpfCnpj : "";
        return nome.includes(termo) || doc.includes(termo);
    });

    return (
        <Box sx={{ width: "100%", maxWidth: "1200px", mx: "auto", pb: 4 }}>
            {/* Header da Página */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                        Gerenciamento de Clientes
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Consulte os clientes cadastrados e seu histórico de pedidos
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="large"
                    onClick={() => navigate("/clientes/novo")}
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
                    Novo Cliente
                </Button>
            </Stack>

            {/* Painel Principal */}
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
                {/* Busca */}
                <Box sx={{ p: 2.5 }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por nome, CPF/CNPJ..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "text.secondary" }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ 
                            width: { xs: "100%", md: 360 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                backgroundColor: "rgba(0, 0, 0, 0.2)",
                            }
                        }}
                    />
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.06)" }} />

                {/* Tabela */}
                <TableContainer>
                    <Table sx={{ width: "100%" }}>
                        <TableHead sx={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 2, pl: 3 }}>CLIENTE</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 2 }}>CPF / CNPJ</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 2 }}>CONTATO</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 2 }}>LOCALIDADE</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: "text.secondary", py: 2, pr: 3, width: "100px" }}>AÇÃO</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : clientesFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8, color: "text.secondary" }}>
                                        Nenhum cliente encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clientesFiltrados.map(c => (
                                    <TableRow 
                                        key={c.id}
                                        hover
                                        onClick={() => navigate(`/clientes/${c.id}`)}
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
                                        <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem", pl: 3 }}>
                                            {c.nomeCliente || "—"}
                                        </TableCell>

                                        <TableCell sx={{ color: "text.secondary" }}>
                                            {c.cpfCnpj || "—"}
                                        </TableCell>

                                        <TableCell sx={{ color: "text.secondary" }}>
                                            {c.telefone || c.email || "—"}
                                        </TableCell>

                                        <TableCell sx={{ color: "text.secondary" }}>
                                            {c.endereco?.municipio ? c.endereco.municipio : "—"}
                                        </TableCell>

                                        <TableCell 
                                            align="right"
                                            sx={{ pr: 3 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Tooltip title="Visualizar Detalhes">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => navigate(`/clientes/${c.id}`)}
                                                        sx={{ 
                                                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                            "&:hover": { backgroundColor: "rgba(0, 114, 255, 0.2)" } 
                                                        }}
                                                    >
                                                        <VisibilityOutlinedIcon fontSize="small" sx={{ color: "#29b6f6" }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Paginação */}
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