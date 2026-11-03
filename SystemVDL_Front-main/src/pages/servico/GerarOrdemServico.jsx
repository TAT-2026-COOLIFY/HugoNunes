import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    Box, Typography, Button, Paper, CircularProgress, 
    Divider, Stack, Alert, Table, TableHead, TableRow, 
    TableCell, TableBody, Chip, Grid, Snackbar
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonIcon from "@mui/icons-material/Person";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { buscarOrdemCompraPorId } from "../../api/ordemCompraApi"; 
import { gerarOrdemServico, visualizarPdfOrdemServico } from "../../api/ordemServicoApi"; 

export default function GerarOrdemServico() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const [ordem, setOrdem] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState(null);

    // Estado para notificação (substituto do alert nativo)
    const [feedback, setFeedback] = useState({ open: false, msg: "", sev: "success" });

    const exibirNotificacao = (msg, sev = "success") => {
        setFeedback({ open: true, msg, sev });
    };

    const fecharNotificacao = () => {
        setFeedback(prev => ({ ...prev, open: false }));
    };

    useEffect(() => {
        let isMounted = true;
        setCarregando(true);
        setErro(null);

        if (!id) {
            setErro("ID do pedido não fornecido na URL.");
            setCarregando(false);
            return;
        }

        buscarOrdemCompraPorId(id)
            .then(res => {
                if (isMounted) {
                    console.log("Dados recebidos para Gerar O.S:", res.data);
                    setOrdem(res.data);
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error("Erro ao buscar ordem de compra:", err);
                    setErro("Erro ao processar ou carregar os dados deste pedido.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setCarregando(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    function handleConfirmarESalvarServico() {
        if (!id) return;

        setSalvando(true);

        gerarOrdemServico(id)
            .then((res) => {
                console.log("Ordem de Serviço gerada no banco!");
                const codigoOs = res?.data?.[0]?.codigo;
                visualizarPdfOrdemServico(id, codigoOs);
                exibirNotificacao("Serviço confirmado! O PDF da Ordem de Serviço foi baixado.", "success");
                setTimeout(() => {
                    navigate("/ordens");
                }, 1500);
            })
            .catch((err) => {
                console.error("Erro ao gerar Ordem de Serviço:", err);
                exibirNotificacao("Ocorreu um erro ao tentar salvar o serviço.", "error");
                setSalvando(false);
            });
    }

    if (carregando) {
        return (
            <Box sx={{ p: 6, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "white", minHeight: "50vh" }}>
                <CircularProgress color="primary" size={50} />
                <Typography sx={{ mt: 2, color: "#94a3b8", fontWeight: 500 }}>Carregando dados do pedido...</Typography>
            </Box>
        );
    }

    if (erro || !ordem) {
        return (
            <Box sx={{ p: 4, maxWidth: 800 }}>
                <Alert severity="error" sx={{ mb: 3, backgroundColor: "#2c1517", color: "#f87171", border: "1px solid #7f1d1d" }}>
                    {erro || "Não foi possível carregar os dados para este pedido."}
                </Alert>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)} 
                    sx={{ color: "white", borderColor: "#475569" }}
                >
                    Voltar
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, width: "100%", color: "white" }}>
            
            {/* TOAST / SNACKBAR CENTRALIZADO NO TOPO */}
            <Snackbar 
                open={feedback.open} 
                autoHideDuration={4000} 
                onClose={fecharNotificacao}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert 
                    onClose={fecharNotificacao} 
                    severity={feedback.sev} 
                    variant="filled"
                    sx={{ width: "100%", fontWeight: 600 }}
                >
                    {feedback.msg}
                </Alert>
            </Snackbar>

            {/* BARRA SUPERIOR - APENAS O BOTÃO VOLTAR */}
            <Box sx={{ mb: 3 }}>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)} 
                    sx={{ 
                        color: "#94a3b8", 
                        borderColor: "#334155", 
                        '&:hover': { borderColor: "#94a3b8", backgroundColor: "#1e293b" } 
                    }}
                >
                    Voltar
                </Button>
            </Box>

            {/* CARD PRINCIPAL */}
            <Paper sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#1e1e1e", color: "white", borderRadius: 2, border: "1px solid #2e2e2e" }}>
                
                {/* TÍTULO E BADGES */}
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", letterSpacing: "-0.5px" }}>
                            Gerar Ordem de Serviço
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: "#94a3b8", mt: 0.5 }}>
                            Pedido: <strong style={{ color: "#38bdf8" }}>{ordem?.codigo || "Sem Código"}</strong>
                        </Typography>
                    </Box>
                    <Chip 
                        label={`ID Interno: #${id}`} 
                        variant="outlined" 
                        sx={{ color: "#94a3b8", borderColor: "#334155", fontWeight: "medium" }} 
                    />
                </Stack>

                <Divider sx={{ backgroundColor: "#2e2e2e", mb: 4 }} />

                {/* BLOCO 1: INFORMAÇÕES DO CLIENTE */}
                <Paper sx={{ p: 3, backgroundColor: "#121212", borderRadius: 2, border: "1px solid #282828", mb: 4 }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
                        <PersonIcon sx={{ color: "#38bdf8" }} />
                        <Typography variant="h6" sx={{ color: "#38bdf8", fontWeight: "bold", fontSize: "1.1rem" }}>
                            Informações do Cliente
                        </Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" sx={{ color: "#888" }}>Cliente</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{ordem?.nomeCliente || "Não informado"}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" sx={{ color: "#888" }}>Cidade</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{ordem?.municipio || "Não informada"}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body2" sx={{ color: "#888" }}>Forma de Pagamento</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{ordem?.formaPagamento || "Não informada"}</Typography>
                        </Grid>
                    </Grid>
                </Paper>

                {/* BLOCO 2: ITENS DO PEDIDO */}
                <Paper sx={{ p: 3, backgroundColor: "#121212", borderRadius: 2, border: "1px solid #282828" }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
                        <Inventory2Icon sx={{ color: "#38bdf8" }} />
                        <Typography variant="h6" sx={{ color: "#38bdf8", fontWeight: "bold", fontSize: "1.1rem" }}>
                            Itens a serem Processados
                        </Typography>
                    </Stack>

                    <Table sx={{ '& .MuiTableCell-root': { color: '#e2e8f0', borderColor: '#262626', py: 1.8 } }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#1a1a1a' }}>
                                <TableCell sx={{ color: '#888', fontWeight: 'bold' }}>QUANTIDADE</TableCell>
                                <TableCell sx={{ color: '#888', fontWeight: 'bold' }}>DIMENSÕES (C x L x A)</TableCell>
                                <TableCell sx={{ color: '#888', fontWeight: 'bold' }}>PREÇO UNITÁRIO</TableCell>
                                <TableCell align="right" sx={{ color: '#888', fontWeight: 'bold' }}>TOTAL</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ordem?.itens && ordem.itens.length > 0 ? (
                                ordem.itens.map((item) => (
                                    <TableRow key={item?.id || Math.random()} sx={{ '&:hover': { backgroundColor: '#181818' } }}>
                                        <TableCell>{item?.quantidade || 0} un</TableCell>
                                        <TableCell>
                                            {(item?.comprimento ?? 0)} x {(item?.largura ?? 0)} x {(item?.altura ?? 0)} mm
                                        </TableCell>
                                        <TableCell>
                                            {item?.precoUnitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "R$ 0,00"}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: '#4ade80', fontWeight: 'bold' }}>
                                            {item?.valorTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "R$ 0,00"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ color: '#666', py: 4 }}>
                                        Nenhum item encontrado neste pedido.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {ordem?.valorTotalProduto && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pt: 2, borderTop: '1px solid #262626' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'normal', color: '#888', mr: 1 }}>
                                Total Geral:
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4ade80' }}>
                                {ordem.valorTotalProduto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Typography>
                        </Box>
                    )}
                </Paper>

                {/* ÚNICO BOTÃO DE AÇÃO NO FINAL DO LAYOUT */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                        disabled={salvando}
                        onClick={handleConfirmarESalvarServico}
                        sx={{ 
                            fontWeight: "bold", 
                            px: 4, 
                            py: 1.5,
                            fontSize: "0.95rem",
                            backgroundColor: "#16a34a",
                            '&:hover': { backgroundColor: "#15803d" },
                            boxShadow: "0px 4px 14px rgba(22, 163, 74, 0.3)" 
                        }}
                    >
                        {salvando ? "PROCESSANDO..." : "CONFIRMAR E SALVAR SERVIÇO"}
                    </Button>
                </Box>

            </Paper>
        </Box>
    );
}