import {
    Box, Typography, TextField, Button, Stack, Paper,
    FormControlLabel, Checkbox, MenuItem, Alert, IconButton, Tooltip, Grid
} from "@mui/material";
import { useEffect, useState } from "react";
import { criarOrcamento, buscarOrcamentoPorId, editarOrcamento, listarGramaturas } from "../../api/orcamentoApi";
import { buscarClientePorTelefone } from "../../api/clienteApi";
import { CORES_LOGO } from "../../constants/coresLogo";
import { useNavigate, useParams } from "react-router-dom";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function CriarOrcamento() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [orcamento, setOrcamento] = useState({
        nomeCliente: "",
        telefone: "",
        personalizacaoAtiva: false,
        cor1: "",
        cor2: "",
        itens: []
    });

    const [statusOrcamento, setStatusOrcamento] = useState("");
    const [gramaturasDisponiveis, setGramaturasDisponiveis] = useState([]);
    const [carregandoGramaturas, setCarregandoGramaturas] = useState(true);
    const [clienteExistente, setClienteExistente] = useState(null);
    const [mensagemErroForm, setMensagemErroForm] = useState("");

    // 1. Carregar lista de Gramaturas
    useEffect(() => {
        if (typeof listarGramaturas === "function") {
            listarGramaturas()
                .then((res) => {
                    const lista = res.data || res || [];
                    setGramaturasDisponiveis(Array.isArray(lista) ? lista : []);
                    setCarregandoGramaturas(false);
                })
                .catch((err) => {
                    console.error("ERRO CRÍTICO AO BUSCAR GRAMATURAS:", err);
                    setCarregandoGramaturas(false);
                });
        }
    }, []);

    // 2. Carregar dados do Orçamento se for Edição
    useEffect(() => {
        if (isEdit && !carregandoGramaturas) {
            buscarOrcamentoPorId(id)
                .then((res) => {
                    const dados = res.data || res;

                    const statusAtual = dados.status || dados.statusOrcamento || "";
                    setStatusOrcamento(statusAtual);

                    const cor1 = dados.personalizacao?.cores?.[0] || dados.coresPersonalizada?.[0] || "";
                    const cor2 = dados.personalizacao?.cores?.[1] || dados.coresPersonalizada?.[1] || "";
                    const ativa = dados.personalizacao?.ativa ?? dados.personalizacaoAtiva ?? false;

                    setOrcamento({
                        nomeCliente: dados.nomeCliente || "",
                        telefone: dados.telefone || "",
                        personalizacaoAtiva: ativa,
                        cor1: cor1,
                        cor2: cor2,
                        itens: dados.itens ? dados.itens.map((item) => {
                            const gramId = item.idGramatura ?? item.gramaturaId ?? item.gramatura_id ?? item.gramatura?.id;

                            return {
                                keyId: crypto.randomUUID(),
                                comprimento: item.comprimento || "",
                                largura: item.largura || "",
                                altura: item.altura || "",
                                personalizada: item.personalizada || false,
                                idGramatura: gramId !== undefined && gramId !== null ? String(gramId) : ""
                            };
                        }) : []
                    });
                })
                .catch((err) => {
                    console.error("Erro ao buscar orçamento:", err);
                    const msg = err.response?.data?.mensagem || err.response?.data?.message || "Não foi possível carregar o orçamento.";
                    setMensagemErroForm(msg);
                });
        }
    }, [id, isEdit, carregandoGramaturas]);

    async function handleVerificarTelefone() {
        const telLimpo = (orcamento.telefone || "").replace(/\D/g, "");
        if (telLimpo.length < 8) return;

        try {
            if (typeof buscarClientePorTelefone === "function") {
                const res = await buscarClientePorTelefone(telLimpo);
                const dadosCliente = res?.data || res;
                if (dadosCliente) {
                    const nomeDoBanco = dadosCliente.nomeCliente || dadosCliente.nome || "";
                    setOrcamento((prev) => ({ ...prev, nomeCliente: nomeDoBanco }));
                    setClienteExistente(dadosCliente);
                }
            }
        } catch (err) {
            setClienteExistente(null);
        }
    }

    function adicionarItem() {
        setOrcamento((prev) => ({
            ...prev,
            itens: [
                ...prev.itens,
                {
                    keyId: crypto.randomUUID(),
                    comprimento: "",
                    largura: "",
                    altura: "",
                    idGramatura: "",
                    personalizada: false
                }
            ]
        }));
    }

    function handleTogglePersonalizacao(ativa) {
        setOrcamento((prev) => ({
            ...prev,
            personalizacaoAtiva: ativa,
            cor1: ativa ? prev.cor1 : "",
            cor2: ativa ? prev.cor2 : "",
            itens: prev.itens.map(item => ({
                ...item,
                personalizada: ativa ? item.personalizada : false
            }))
        }));
    }

    function salvarOrcamento() {
        setMensagemErroForm("");

        if (isEdit && statusOrcamento && statusOrcamento.toUpperCase() !== "PENDENTE") {
            setMensagemErroForm(`Este orçamento possui o status "${statusOrcamento}" e não pode mais ser editado.`);
            return;
        }

        if (orcamento.personalizacaoAtiva) {
            const algumItemPersonalizado = orcamento.itens.some(item => item.personalizada);
            if (!algumItemPersonalizado && orcamento.itens.length > 0) {
                setMensagemErroForm("Personalização ativa, mas nenhuma caixa foi marcada como personalizada!");
                return;
            }
        }

        const cores = [];
        if (orcamento.personalizacaoAtiva) {
            if (orcamento.cor1) cores.push(orcamento.cor1);
            if (orcamento.cor2) cores.push(orcamento.cor2);
        }

        const payload = {
            nomeCliente: orcamento.nomeCliente,
            telefone: orcamento.telefone,
            personalizacaoAtiva: orcamento.personalizacaoAtiva,
            coresPersonalizada: cores,
            itens: orcamento.itens.map(item => ({
                comprimento: item.comprimento ? Number(item.comprimento) : 0,
                largura: item.largura ? Number(item.largura) : 0,
                altura: item.altura ? Number(item.altura) : 0,
                personalizada: orcamento.personalizacaoAtiva ? item.personalizada : false,
                idGramatura: item.idGramatura ? Number(item.idGramatura) : null
            }))
        };

        const tratarErroApi = (err) => {
            console.error("Erro retornado do Backend:", err);

            const msgBack = 
                err.response?.data?.mensagem || 
                err.response?.data?.message || 
                err.response?.data?.erro || 
                (typeof err.response?.data === 'string' ? err.response.data : null);

            setMensagemErroForm(msgBack || "Erro ao processar a requisição no servidor.");
        };

        if (isEdit) {
            editarOrcamento(id, payload)
                .then(() => navigate(`/orcamentos/${id}`))
                .catch(tratarErroApi);
        } else {
            criarOrcamento(payload)
                .then((res) => {
                    const idCriado = res.data?.id || res.id;
                    if (idCriado) {
                        navigate(`/orcamentos/${idCriado}`);
                    } else {
                        navigate("/orcamentos");
                    }
                })
                .catch(tratarErroApi);
        }
    }

    function atualizarItem(index, campo, valor) {
        const novosItens = [...orcamento.itens];
        novosItens[index][campo] = valor;
        setOrcamento({
            ...orcamento,
            itens: novosItens
        });
    }

    function removerItem(index) {
        const novosItens = orcamento.itens.filter((_, i) => i !== index);
        setOrcamento({
            ...orcamento,
            itens: novosItens
        });
    }

    const inputStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.1)",
        }
    };

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
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                        {isEdit ? "Editar Orçamento" : "Criar Orçamento"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Preencha as informações do cliente e adicione as caixas da proposta
                    </Typography>
                </Box>
            </Stack>

            <Stack spacing={3}>
                {/* Alerta de erro */}
                {mensagemErroForm && (
                    <Alert 
                        severity="error" 
                        onClose={() => setMensagemErroForm("")}
                        sx={{ borderRadius: "12px", fontWeight: "bold" }}
                    >
                        {mensagemErroForm}
                    </Alert>
                )}

                {/* Bloco 1: Dados do Cliente */}
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
                        <PersonOutlineIcon sx={{ color: "#00c6ff" }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Informações do Cliente
                        </Typography>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Telefone"
                                fullWidth
                                value={orcamento.telefone}
                                onChange={(e) => {
                                    setOrcamento({ ...orcamento, telefone: e.target.value });
                                    if (clienteExistente) setClienteExistente(null);
                                }}
                                onBlur={handleVerificarTelefone}
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nome do Cliente"
                                fullWidth
                                value={orcamento.nomeCliente}
                                onChange={(e) => setOrcamento({ ...orcamento, nomeCliente: e.target.value })}
                                disabled={Boolean(clienteExistente)}
                                helperText={clienteExistente ? "Nome travado: este telefone já pertence a um cliente cadastrado" : ""}
                                sx={inputStyle}
                            />
                        </Grid>
                    </Grid>

                    {clienteExistente && (
                        <Alert
                            severity="info"
                            sx={{
                                mt: 2,
                                borderRadius: "10px",
                                backgroundColor: "rgba(2, 136, 209, 0.12)",
                                color: "#29b6f6",
                                border: "1px solid rgba(2, 136, 209, 0.3)"
                            }}
                            action={
                                clienteExistente.id ? (
                                    <Button
                                        size="small"
                                        onClick={() => navigate(`/clientes/editar/${clienteExistente.id}`)}
                                        sx={{ color: "#29b6f6", textTransform: "none", fontWeight: 700 }}
                                    >
                                        Editar cliente
                                    </Button>
                                ) : null
                            }
                        >
                            Cliente cadastrado: <strong>{clienteExistente.nomeCliente || clienteExistente.nome}</strong>. Dados preenchidos automaticamente. Nome errado? Corrija no cadastro do cliente.
                        </Alert>
                    )}
                </Paper>

                {/* Bloco 2: Personalização */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 3, 
                        borderRadius: "16px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        backgroundColor: "rgba(255, 255, 255, 0.02)"
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: orcamento.personalizacaoAtiva ? 2 : 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <PaletteOutlinedIcon sx={{ color: "#ff9800" }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Personalização
                            </Typography>
                        </Stack>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={orcamento.personalizacaoAtiva}
                                    onChange={(e) => handleTogglePersonalizacao(e.target.checked)}
                                    sx={{ color: "#ff9800", "&.Mui-checked": { color: "#ff9800" } }}
                                />
                            }
                            label={<Typography sx={{ fontWeight: 600 }}>Ativar Personalização</Typography>}
                        />
                    </Stack>

                    {orcamento.personalizacaoAtiva && (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2, width: "100%" }}>
                            <TextField
                                select
                                label="Cor 1 da Logo"
                                value={orcamento.cor1 || ""}
                                onChange={(e) => setOrcamento({ ...orcamento, cor1: e.target.value })}
                                fullWidth
                                sx={inputStyle}
                            >
                                {CORES_LOGO.map((cor) => (
                                    <MenuItem key={cor.value} value={cor.value}>
                                        {cor.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Cor 2 da Logo"
                                value={orcamento.cor2 || ""}
                                onChange={(e) => setOrcamento({ ...orcamento, cor2: e.target.value })}
                                fullWidth
                                sx={inputStyle}
                            >
                                <MenuItem value=""><em>Nenhuma</em></MenuItem>
                                {CORES_LOGO
                                    .filter(cor => cor.value !== orcamento.cor1)
                                    .map((cor) => (
                                        <MenuItem key={cor.value} value={cor.value}>
                                            {cor.label}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Stack>
                    )}
                </Paper>

                {/* Bloco 3: Itens do Orçamento */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 3, 
                        borderRadius: "16px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        backgroundColor: "rgba(255, 255, 255, 0.02)"
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Inventory2OutlinedIcon sx={{ color: "#4caf50" }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Itens do Orçamento
                            </Typography>
                        </Stack>

                        <Button 
                            variant="outlined" 
                            startIcon={<AddIcon />}
                            onClick={adicionarItem}
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
                            Adicionar Caixa
                        </Button>
                    </Stack>

                    {orcamento.itens.length === 0 ? (
                        <Box sx={{ textTransform: "none", textAlign: "center", py: 5, border: "1px dashed rgba(255, 255, 255, 0.1)", borderRadius: "12px" }}>
                            <Typography color="text.secondary">
                                Nenhuma caixa adicionada ainda. Clique no botão acima para incluir a primeira.
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {orcamento.itens.map((item, index) => {
                                const valGramatura = item.idGramatura !== undefined && item.idGramatura !== null ? String(item.idGramatura) : "";

                                return (
                                    <Paper 
                                        key={item.keyId || index}
                                        elevation={0}
                                        sx={{ 
                                            p: 2, 
                                            borderRadius: "12px",
                                            backgroundColor: "rgba(0, 0, 0, 0.2)",
                                            border: "1px solid rgba(255, 255, 255, 0.05)"
                                        }}
                                    >
                                        <Stack 
                                            direction="row" 
                                            alignItems="center" 
                                            spacing={1.5} 
                                            sx={{ width: "100%", flexWrap: "nowrap" }}
                                        >
                                            <TextField
                                                label="Compr. (cm)"
                                                type="number"
                                                size="small"
                                                value={item.comprimento || ""}
                                                onChange={(e) => atualizarItem(index, "comprimento", e.target.value)}
                                                sx={{ ...inputStyle, flex: 1, minWidth: 80 }}
                                            />

                                            <TextField
                                                label="Largura (cm)"
                                                type="number"
                                                size="small"
                                                value={item.largura || ""}
                                                onChange={(e) => atualizarItem(index, "largura", e.target.value)}
                                                sx={{ ...inputStyle, flex: 1, minWidth: 80 }}
                                            />

                                            <TextField
                                                label="Altura (cm)"
                                                type="number"
                                                size="small"
                                                value={item.altura || ""}
                                                onChange={(e) => atualizarItem(index, "altura", e.target.value)}
                                                sx={{ ...inputStyle, flex: 1, minWidth: 80 }}
                                            />

                                            <TextField
                                                select
                                                label="Gramatura"
                                                size="small"
                                                value={valGramatura}
                                                onChange={(e) => atualizarItem(index, "idGramatura", e.target.value)}
                                                sx={{ ...inputStyle, flex: 1.5, minWidth: 140 }}
                                            >
                                                <MenuItem value=""><em>Selecione</em></MenuItem>
                                                {gramaturasDisponiveis.map((g) => {
                                                    const gId = String(g.id ?? g.idGramatura ?? g.gramaturaId);
                                                    const gLabel = g.descGramatura || g.desc_gramatura || g.descricao || g.gramatura || g.nome || `Gramatura #${gId}`;

                                                    return (
                                                        <MenuItem key={gId} value={gId}>
                                                            {gLabel}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </TextField>

                                            {orcamento.personalizacaoAtiva && (
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={item.personalizada || false}
                                                            onChange={(e) => atualizarItem(index, "personalizada", e.target.checked)}
                                                            sx={{ color: "#ff9800", "&.Mui-checked": { color: "#ff9800" }, p: 0.5 }}
                                                        />
                                                    }
                                                    label={<Typography variant="body2" sx={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>Personalizar</Typography>}
                                                    sx={{ mr: 0, ml: 0.5, flexShrink: 0 }}
                                                />
                                            )}

                                            <Tooltip title="Remover caixa">
                                                <IconButton 
                                                    onClick={() => removerItem(index)}
                                                    sx={{ 
                                                        color: "#f44336",
                                                        backgroundColor: "rgba(244, 67, 54, 0.1)",
                                                        "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.2)" },
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Paper>

                {/* Botões de Ação */}
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                    <Button 
                        variant="outlined" 
                        onClick={() => navigate("/orcamentos")}
                        sx={{
                            borderRadius: "12px",
                            px: 3,
                            py: 1.2,
                            textTransform: "none",
                            fontWeight: 700,
                            borderColor: "rgba(255, 255, 255, 0.2)",
                            color: "text.secondary",
                            "&:hover": {
                                borderColor: "#fff",
                                color: "#fff"
                            }
                        }}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        onClick={salvarOrcamento}
                        sx={{
                            borderRadius: "12px",
                            px: 4,
                            py: 1.2,
                            textTransform: "none",
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)",
                            boxShadow: "0 4px 20px 0 rgba(0, 114, 255, 0.35)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #005bb5 0%, #009ecb 100%)",
                            }
                        }}
                    >
                        {isEdit ? "Salvar Alterações" : "Criar Orçamento"}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}