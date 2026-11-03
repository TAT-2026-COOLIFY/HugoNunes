import { 
    Box, Typography, TextField, Button, Stack, Paper, MenuItem, Divider, CircularProgress, Card, Snackbar, Alert
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentIcon from "@mui/icons-material/Payment";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buscarOrcamentoPorId } from "../../api/orcamentoApi";
import { criarOrdemCompra } from "../../api/ordemCompraApi";

export default function CriarOrdemCompra() {
    const { orcamentoId } = useParams();
    const navigate = useNavigate();

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [formaPagamento, setFormaPagamento] = useState("PIX");
    const [itensOrdem, setItensOrdem] = useState([]);

    // Estado para controlar a notificação
    const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

    const handleCloseToast = () => setToast({ ...toast, open: false });

    useEffect(() => {
        buscarOrcamentoPorId(orcamentoId)
            .then((res) => {
                const dadosOrcamento = res.data;
                
                if (dadosOrcamento?.itens && dadosOrcamento.itens.length > 0) {
                    const itensFormatados = dadosOrcamento.itens.map(item => ({
                        orcamentoItemId: item.id,
                        comprimento: item.comprimento,
                        largura: item.largura,
                        altura: item.altura,
                        quantidade: ""
                    }));
                    setItensOrdem(itensFormatados);
                } else {
                    setToast({ open: true, message: "Este orçamento não possui itens cadastrados.", severity: "warning" });
                    setTimeout(() => navigate("/orcamentos"), 2000);
                }
            })
            .catch((err) => {
                console.error("Erro ao carregar dados do orçamento:", err);
                setToast({ open: true, message: "Não foi possível carregar o orçamento.", severity: "error" });
                setTimeout(() => navigate("/orcamentos"), 2000);
            })
            .finally(() => setCarregando(false));
    }, [orcamentoId, navigate]);

    function handleAtualizarQuantidade(index, valor) {
        const novosItens = [...itensOrdem];
        novosItens[index].quantidade = valor;
        setItensOrdem(novosItens);
    }

    function salvarOrdemCompra() {
        const temQuantidadeInvalida = itensOrdem.some(
            item => !item.quantidade || Number(item.quantidade) <= 0 || isNaN(Number(item.quantidade))
        );

        if (temQuantidadeInvalida) {
            setToast({ 
                open: true, 
                message: "Por favor, preencha uma quantidade válida (maior que zero) para todos os itens.", 
                severity: "warning" 
            });
            return;
        }

        setSalvando(true);

        const payload = {
            formaPagamento: formaPagamento,
            itens: itensOrdem.map(item => ({
                orcamentoItemId: Number(item.orcamentoItemId),
                quantidade: Number(item.quantidade)
            }))
        };

        criarOrdemCompra(orcamentoId, payload)
            .then(() => {
                setToast({ 
                    open: true, 
                    message: "Ordem de Compra gerada com sucesso!", 
                    severity: "success" 
                });
                
                setTimeout(() => {
                    navigate("/ordens");
                }, 1500);
            })
            .catch((err) => {
                console.error("Erro ao criar Ordem de Compra:", err);
                
                const msgServidor = err.response?.data?.message || "";
                if (err.response?.status === 500 || msgServidor.includes("Duplicate entry")) {
                    setToast({ 
                        open: true, 
                        message: "⚠️ Atenção: Este orçamento já possui uma Ordem de Compra gerada!", 
                        severity: "warning" 
                    });
                    setTimeout(() => navigate("/ordens"), 2000);
                } else {
                    setToast({ 
                        open: true, 
                        message: "Erro ao criar Ordem de Compra. Tente novamente.", 
                        severity: "error" 
                    });
                }
            })
            .finally(() => setSalvando(false));
    }

    const inputStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            color: "#fff",
            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.1)" },
            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.25)" },
            "&.Mui-focused fieldset": { borderColor: "#00c6ff" }
        },
        "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.6)" },
        "& .MuiInputLabel-root.Mui-focused": { color: "#00c6ff" },
        "& .MuiSelect-icon": { color: "rgba(255, 255, 255, 0.5)" }
    };

    if (carregando) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <CircularProgress sx={{ color: "#00c6ff" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: 900, mx: "auto", pb: 6 }}>
            {/* CABEÇALHO */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>
                    Gerar Ordem de Compra
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                    Defina a forma de pagamento e a quantidade final dos itens para o Orçamento #{orcamentoId}
                </Typography>
            </Box>

            {/* PAINEL FORMULÁRIO */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: { xs: 2.5, sm: 4 },
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    backgroundColor: "rgba(255, 255, 255, 0.02)"
                }}
            >
                <Stack spacing={4}>
                    {/* SEÇÃO 1: FATURAMENTO */}
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <PaymentIcon sx={{ color: "#00c6ff", fontSize: "1.3rem" }} />
                            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                                Informações de Faturamento
                            </Typography>
                        </Stack>

                        <TextField
                            select
                            label="Forma de Pagamento"
                            value={formaPagamento}
                            onChange={(e) => setFormaPagamento(e.target.value)}
                            fullWidth
                            disabled={salvando}
                            sx={inputStyle}
                        >
                            <MenuItem value="PIX">PIX</MenuItem>
                            <MenuItem value="BOLETO">Boleto Bancário</MenuItem>
                            <MenuItem value="CARTAO">Cartão de Crédito</MenuItem>
                            <MenuItem value="DINHEIRO">Dinheiro</MenuItem>
                        </TextField>
                    </Box>

                    <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

                    {/* SEÇÃO 2: QUANTIDADE DE ITENS */}
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <ShoppingCartIcon sx={{ color: "#00c6ff", fontSize: "1.3rem" }} />
                            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                                Definir Quantidade de Caixas
                            </Typography>
                        </Stack>

                        <Stack spacing={2}>
                            {itensOrdem.map((item, index) => (
                                <Card 
                                    key={item.orcamentoItemId}
                                    elevation={0}
                                    sx={{ 
                                        p: 2, 
                                        borderRadius: "12px", 
                                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                                        border: "1px solid rgba(255, 255, 255, 0.05)"
                                    }}
                                >
                                    <Stack 
                                        direction={{ xs: "column", sm: "row" }} 
                                        spacing={2} 
                                        alignItems={{ xs: "stretch", sm: "center" }}
                                        justifyContent="space-between"
                                    >
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: "#00c6ff", fontWeight: 700 }}>
                                                Item #{item.orcamentoItemId}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", mt: 0.5 }}>
                                                Dimensões: {item.comprimento} x {item.largura} x {item.altura} mm
                                            </Typography>
                                        </Box>

                                        <TextField
                                            label="Quantidade (Unidades)"
                                            type="number"
                                            value={item.quantidade}
                                            disabled={salvando}
                                            onChange={(e) => handleAtualizarQuantidade(index, e.target.value)}
                                            placeholder="Ex: 50"
                                            slotProps={{ htmlInput: { min: 1 } }}
                                            required
                                            sx={{
                                                ...inputStyle,
                                                width: { xs: "100%", sm: "240px" }
                                            }}
                                        />
                                    </Stack>
                                </Card>
                            ))}
                        </Stack>
                    </Box>

                    {/* AÇÕES */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 2 }}>
                        <Button 
                            variant="contained" 
                            startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                            onClick={salvarOrdemCompra}
                            disabled={salvando}
                            sx={{
                                height: "46px",
                                px: 3,
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
                            {salvando ? "Gerando..." : "Concluir e Gerar Ordem"}
                        </Button>

                        <Button 
                            variant="outlined" 
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(`/orcamentos/${orcamentoId}`)}
                            disabled={salvando}
                            sx={{
                                height: "46px",
                                px: 3,
                                borderRadius: "10px",
                                textTransform: "none",
                                fontWeight: 600,
                                borderColor: "rgba(255, 255, 255, 0.15)",
                                color: "#fff",
                                "&:hover": {
                                    borderColor: "rgba(255, 255, 255, 0.3)",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)"
                                }
                            }}
                        >
                            Cancelar
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* NOTIFICAÇÃO (SNACKBAR NO TOPO CENTRALIZADO) */}
            <Snackbar 
                open={toast.open} 
                autoHideDuration={4000} 
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}