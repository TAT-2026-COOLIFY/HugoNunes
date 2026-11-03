import { 
    Box, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Button, Stack,
    TextField, InputAdornment, Chip, Tabs, Tab, CircularProgress, Alert
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarOrdensCompra, gerarPdfOrdemCompra } from "../../api/ordemCompraApi";

export default function ListarOrdensCompra() {
    const [ordens, setOrdens] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [buscaNome, setBuscaNome] = useState("");
    const [abaStatus, setAbaStatus] = useState("PENDENTE");
    const navigate = useNavigate();

    useEffect(() => {
        carregarOrdens();
    }, []);

    function carregarOrdens() {
        setCarregando(true);
        setErro(null);

        listarOrdensCompra()
            .then((res) => {
                let listaFinal = [];
                if (Array.isArray(res)) {
                    listaFinal = res;
                } else if (res && Array.isArray(res.data)) {
                    listaFinal = res.data;
                }

                const ordensTratadas = listaFinal.map((ordem) => ({
                    idReal: ordem.id,     
                    codigoExibicao: ordem.codigo || ordem.id,
                    formaPagamento: ordem.formaPagamento || "A combinar",
                    nomeCliente: ordem.nomeCliente || ordem.nome_cliente || "Sem Nome",
                    status: ordem.status || "PENDENTE"
                }));

                setOrdens(ordensTratadas);
            })
            .catch((err) => {
                console.error("Erro ao listar ordens:", err);
                setErro("Erro ao carregar a lista de ordens de compra.");
            })
            .finally(() => {
                setCarregando(false);
            });
    }

    function handleBaixarPdf(ordem) {
        if (!ordem.idReal) {
            alert("Erro: ID real da ordem não foi encontrado para gerar o PDF.");
            return;
        }

        gerarPdfOrdemCompra(ordem.idReal)
            .then((res) => {
                const blob = new Blob([res.data], { type: "application/pdf" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `OrdemCompra_${ordem.codigoExibicao}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch((err) => {
                console.error("Erro ao baixar PDF:", err);
                alert("Erro ao gerar o PDF da Ordem de Compra.");
            });
    }

    const ordensFiltradas = ordens.filter((o) => {
        const termo = buscaNome.toLowerCase();
        
        const statusMatch = abaStatus === "PENDENTE" 
            ? o.status !== "FINALIZADO" 
            : o.status === "FINALIZADO";

        const clienteMatch = o.nomeCliente ? o.nomeCliente.toLowerCase().includes(termo) : false;
        const idMatch = o.codigoExibicao ? String(o.codigoExibicao).toLowerCase().includes(termo) : false;

        return statusMatch && (clienteMatch || idMatch);
    });

    const inputStyle = {
        width: { xs: "100%", sm: 320 },
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            color: "#fff",
            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.1)" },
            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.25)" },
            "&.Mui-focused fieldset": { borderColor: "#00c6ff" }
        }
    };

    if (carregando) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
                <CircularProgress sx={{ color: "#00c6ff" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: 1100, mx: "auto", pb: 6 }}>
            {/* CABEÇALHO */}
            <Stack 
                direction={{ xs: "column", sm: "row" }} 
                justifyContent="space-between" 
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>
                        Ordens de Compra
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Gerencie e emita ordens de serviço a partir das ordens de compra
                    </Typography>
                </Box>

                <TextField
                    size="small"
                    placeholder="Buscar por cliente ou ID..."
                    value={buscaNome}
                    onChange={(e) => setBuscaNome(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.4)" }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={inputStyle}
                />
            </Stack>

            {erro && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
                    {erro}
                </Alert>
            )}

            {/* PAINEL PRINCIPAL */}
            <Paper 
                elevation={0}
                sx={{ 
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    overflow: "hidden"
                }}
            >
                {/* ABAS */}
                <Box sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", px: 2, pt: 1 }}>
                    <Tabs 
                        value={abaStatus} 
                        onChange={(e, novoValor) => setAbaStatus(novoValor)}
                        TabIndicatorProps={{
                            style: { backgroundColor: "#00c6ff", height: 3, borderRadius: "3px" }
                        }}
                        sx={{
                            "& .MuiTab-root": { 
                                color: "rgba(255, 255, 255, 0.5)", 
                                fontWeight: 700,
                                textTransform: "none",
                                fontSize: "0.95rem",
                                minHeight: "48px"
                            },
                            "& .Mui-selected": { color: "#00c6ff !important" }
                        }}
                    >
                        <Tab label={`Pendentes (${ordens.filter(o => o.status !== "FINALIZADO").length})`} value="PENDENTE" />
                        <Tab label={`Finalizados (${ordens.filter(o => o.status === "FINALIZADO").length})`} value="FINALIZADO" />
                    </Tabs>
                </Box>

                {/* TABELA DE ORDENS */}
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                                <TableCell sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 2 }}>ID</TableCell>
                                <TableCell sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 2 }}>Cliente</TableCell>
                                <TableCell sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 2 }}>Forma de Pagamento</TableCell>
                                <TableCell align="center" sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 2 }}>Status</TableCell>
                                <TableCell align="center" sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 2 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {ordensFiltradas.length > 0 ? (
                                ordensFiltradas.map((ordem, index) => {
                                    const isFinalizado = ordem.status === "FINALIZADO";

                                    return (
                                        <TableRow 
                                            key={ordem.idReal || index}
                                            hover
                                            onClick={() => ordem.idReal && navigate(`/pedidos/detalhe/${ordem.idReal}`)}
                                            sx={{
                                                cursor: "pointer",
                                                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                                                transition: "all 0.2s ease",
                                                "&:hover": { 
                                                    backgroundColor: "rgba(255, 255, 255, 0.04) !important",
                                                }
                                            }}
                                        >
                                            <TableCell sx={{ color: "#fff", fontWeight: 700 }}>
                                                #{ordem.codigoExibicao}
                                            </TableCell>
                                            
                                            <TableCell sx={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>
                                                {ordem.nomeCliente}
                                            </TableCell>
                                            
                                            <TableCell sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                                                {ordem.formaPagamento}
                                            </TableCell>
                                            
                                            <TableCell align="center">
                                                <Chip 
                                                    label={isFinalizado ? "Finalizado" : "Pendente"} 
                                                    size="small"
                                                    sx={{ 
                                                        fontWeight: 700,
                                                        fontSize: "0.75rem",
                                                        backgroundColor: isFinalizado ? "rgba(76, 175, 80, 0.15)" : "rgba(255, 152, 0, 0.15)",
                                                        color: isFinalizado ? "#66bb6a" : "#ffa726",
                                                        border: `1px solid ${isFinalizado ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 152, 0, 0.3)"}`
                                                    }}
                                                />
                                            </TableCell>

                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center" onClick={(e) => e.stopPropagation()}>
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small"
                                                        startIcon={<PictureAsPdfIcon fontSize="small" />}
                                                        onClick={() => handleBaixarPdf(ordem)}
                                                        sx={{
                                                            borderRadius: "8px",
                                                            textTransform: "none",
                                                            fontWeight: 600,
                                                            borderColor: "rgba(255, 255, 255, 0.15)",
                                                            color: "#fff",
                                                            "&:hover": {
                                                                borderColor: "#00c6ff",
                                                                backgroundColor: "rgba(0, 198, 255, 0.08)"
                                                            }
                                                        }}
                                                    >
                                                        PDF
                                                    </Button>
                                                    
                                                    <Button
                                                        variant={isFinalizado ? "outlined" : "contained"}
                                                        size="small"
                                                        disabled={isFinalizado}
                                                        startIcon={isFinalizado ? <CheckCircleOutlineIcon fontSize="small" /> : <BuildIcon fontSize="small" />}
                                                        onClick={() => navigate(`/ordem-servico/gerar/${ordem.idReal}`)}
                                                        sx={{
                                                            borderRadius: "8px",
                                                            textTransform: "none",
                                                            fontWeight: 700,
                                                            ...(isFinalizado ? {
                                                                borderColor: "transparent",
                                                                color: "rgba(255, 255, 255, 0.3) !important",
                                                                backgroundColor: "rgba(255, 255, 255, 0.03)"
                                                            } : {
                                                                background: "linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)",
                                                                boxShadow: "0 2px 10px 0 rgba(0, 114, 255, 0.3)",
                                                                "&:hover": {
                                                                    background: "linear-gradient(135deg, #005bb5 0%, #009ecb 100%)",
                                                                }
                                                            })
                                                        }}
                                                    >
                                                        {isFinalizado ? "Concluído" : "Gerar Serviço"}
                                                    </Button>    
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            {buscaNome 
                                                ? "Nenhuma ordem encontrada para essa busca." 
                                                : `Nenhuma ordem ${abaStatus === "PENDENTE" ? "pendente" : "finalizada"} encontrada.`
                                            }
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}