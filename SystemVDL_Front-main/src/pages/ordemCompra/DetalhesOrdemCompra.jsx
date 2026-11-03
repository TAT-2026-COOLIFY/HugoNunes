import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    Box, Typography, Button, Paper, CircularProgress, 
    Divider, Stack, Alert, Table, TableHead, TableRow, 
    TableCell, TableBody, Chip, Grid
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PaymentIcon from "@mui/icons-material/Payment";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import BuildIcon from "@mui/icons-material/Build";

import { buscarOrdemCompraPorId } from "../../api/ordemCompraApi"; 

export default function DetalhesOrdemCompra() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [ordem, setOrdem] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        if (!id) {
            setErro("Identificador da Ordem de Compra inválido.");
            setCarregando(false);
            return;
        }

        setCarregando(true);
        setErro(null);

        buscarOrdemCompraPorId(id)
            .then(res => {
                setOrdem(res.data);
            })
            .catch(err => {
                console.error("Erro ao buscar ordem de compra:", err);
                setErro("Não foi possível carregar os detalhes desta Ordem de Compra.");
            })
            .finally(() => {
                setCarregando(false);
            });
    }, [id]);

    const formatarMoeda = (valor) => {
        const numero = Number(valor);
        if (isNaN(numero)) return "R$ 0,00";
        return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    if (carregando) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <CircularProgress sx={{ color: "#00c6ff" }} />
            </Box>
        );
    }

    if (erro) {
        return (
            <Box sx={{ width: "100%", maxWidth: 900, mx: "auto", pt: 4 }}>
                <Alert 
                    severity="error" 
                    variant="filled"
                    sx={{ borderRadius: "12px", mb: 3 }}
                >
                    {erro}
                </Alert>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate(-1)} 
                    sx={{
                        borderRadius: "10px",
                        color: "#fff",
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        "&:hover": { borderColor: "#fff" }
                    }}
                >
                    Voltar
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pb: 6 }}>
            {/* BOTÃO VOLTAR */}
            <Button 
                variant="outlined" 
                startIcon={<ArrowBackIcon />} 
                onClick={() => navigate(-1)} 
                sx={{ 
                    mb: 3, 
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    color: "rgba(255, 255, 255, 0.8)",
                    "&:hover": {
                        borderColor: "#00c6ff",
                        color: "#fff",
                        backgroundColor: "rgba(0, 198, 255, 0.08)"
                    }
                }}
            >
                Voltar
            </Button>

            {/* PAINEL DE CONTEÚDO */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: { xs: 2.5, sm: 4 },
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)"
                }}
            >
                {/* CABEÇALHO */}
                <Stack 
                    direction={{ xs: "column", sm: "row" }} 
                    justifyContent="space-between" 
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                    sx={{ mb: 3 }}
                >
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>
                            Pedido {ordem?.codigo || `#${id}`}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                            Detalhes e especificações da ordem de compra
                        </Typography>
                    </Box>

                    <Chip 
                        label={`ID Interno: #${id}`}
                        size="small"
                        sx={{ 
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            color: "rgba(255, 255, 255, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            fontWeight: 600
                        }}
                    />
                </Stack>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", mb: 4 }} />

                {/* INFORMAÇÕES RESUMIDAS (CARDS) */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {/* CLIENTE */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2.5, 
                                borderRadius: "12px", 
                                backgroundColor: "rgba(0, 0, 0, 0.2)",
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                height: "100%"
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                <PersonOutlineIcon sx={{ color: "#00c6ff", fontSize: "1.2rem" }} />
                                <Typography variant="subtitle2" sx={{ color: "#00c6ff", fontWeight: 700 }}>
                                    Informações do Cliente
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
                                {ordem?.nomeCliente || "Não informado"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", display: "block", mt: 0.5 }}>
                                Cidade: {ordem?.municipio || "Não informada"}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* PAGAMENTO */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2.5, 
                                borderRadius: "12px", 
                                backgroundColor: "rgba(0, 0, 0, 0.2)",
                                border: "1px solid rgba(255, 255, 255, 0.05)",
                                height: "100%"
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                <PaymentIcon sx={{ color: "#00c6ff", fontSize: "1.2rem" }} />
                                <Typography variant="subtitle2" sx={{ color: "#00c6ff", fontWeight: 700 }}>
                                    Pagamento
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
                                Forma de Pagamento
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)", display: "block", mt: 0.5 }}>
                                {ordem?.formaPagamento || "A combinar"}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* TABELA DE PRODUTOS DO PEDIDO */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Inventory2OutlinedIcon sx={{ color: "#00c6ff", fontSize: "1.2rem" }} />
                        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                            Produtos do Pedido
                        </Typography>
                    </Stack>

                    <Paper 
                        elevation={0}
                        sx={{ 
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            backgroundColor: "rgba(0, 0, 0, 0.15)",
                            overflow: "hidden"
                        }}
                    >
                        <Table sx={{ minWidth: 600 }}>
                            <TableHead>
                                <TableRow sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                                    <TableCell sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 1.5 }}>Quantidade</TableCell>
                                    <TableCell sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 1.5 }}>Dimensões (C x L x A)</TableCell>
                                    <TableCell sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 1.5 }}>Preço Unitário</TableCell>
                                    <TableCell align="right" sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, py: 1.5 }}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ordem?.itens && ordem.itens.length > 0 ? (
                                    ordem.itens.map((item, index) => (
                                        <TableRow 
                                            key={item.id || index} 
                                            sx={{ 
                                                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                                                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.02)" }
                                            }}
                                        >
                                            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                                                {item.quantidade ?? 0} un
                                            </TableCell>
                                            <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                                                {item.comprimento || 0} x {item.largura || 0} x {item.altura || 0} mm
                                            </TableCell>
                                            <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                                                {formatarMoeda(item.precoUnitario)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: "#66bb6a", fontWeight: 700 }}>
                                                {formatarMoeda(item.valorTotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ color: "rgba(255, 255, 255, 0.4)", py: 4 }}>
                                            Nenhum item encontrado neste pedido.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Paper>

                    {/* EXIBE O VALOR GERAL */}
                    {ordem?.valorTotalProduto != null && (
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: "10px",
                                    backgroundColor: "rgba(0, 198, 255, 0.05)",
                                    border: "1px solid rgba(0, 198, 255, 0.2)"
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#fff", fontSize: "1.1rem" }}>
                                    Total Geral: <span style={{ color: "#00c6ff" }}>
                                        {formatarMoeda(ordem.valorTotalProduto)}
                                    </span>
                                </Typography>
                            </Paper>
                        </Box>
                    )}
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", mb: 4 }} />

                {/* AÇÃO PRINCIPAL */}
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="contained"
                        startIcon={<BuildIcon />}
                        onClick={() => navigate(`/ordem-servico/gerar/${id}`)}
                        sx={{ 
                            height: "46px",
                            px: 3.5,
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)",
                            boxShadow: "0 4px 14px 0 rgba(0, 114, 255, 0.39)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #005bb5 0%, #009ecb 100%)",
                            }
                        }}
                    >
                        Gerar Ordem de Serviço
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}