import { 
    Box, Typography, TextField, Button, Stack, Paper, 
    Grid, IconButton, Alert, Dialog, DialogTitle, 
    DialogContent, DialogContentText, DialogActions, CircularProgress 
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { somenteNumeros, erroCpfCnpj, erroEmail, erroCep, formatarCep, buscarEnderecoPorCep, formatarDadosCnpj } from "../../utils/validacoes";
import { consultarCnpj } from "../../api/consultaCnpjApi";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buscarClientePorDocumento, vincularCliente, buscarOrcamentoPorId } from "../../api/orcamentoApi";
import { buscarClientePorTelefone } from "../../api/clienteApi";

export default function CompletarCadastro() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados do Formulário
    const [cpfCnpj, setCpfCnpj] = useState("");
    const [email, setEmail] = useState("");
    const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
    // CNPJ tem 14 dígitos; CPF tem 11. A inscrição só existe para CNPJ.
    const ehCnpj = (cpfCnpj || "").replace(/\D/g, "").length > 11;
    const [rua, setRua] = useState("");
    const [bairro, setBairro] = useState("");
    const [cep, setCep] = useState("");
    const [municipio, setMunicipio] = useState("");

    // ===== Validações =====
    // Os erros só aparecem depois que o campo foi "tocado" (perdeu o foco) ou ao tentar salvar
    const [tocados, setTocados] = useState({});
    const tocar = (campo) => setTocados((prev) => ({ ...prev, [campo]: true }));

    const erros = {
        cpfCnpj: erroCpfCnpj(cpfCnpj),
        email: erroEmail(email),
        cep: erroCep(cep),
    };

    // Só números, no máximo 14 (CNPJ). Se o campo for apagado, limpa os dados da empresa anterior.
    const handleCpfCnpjChange = (e) => {
        const valor = somenteNumeros(e.target.value).slice(0, 14);
        setCpfCnpj(valor);

        if (!valor) {
            setEmail("");
            setInscricaoMunicipal("");
            setRua("");
            setBairro("");
            setCep("");
            setMunicipio("");
            ultimoCnpj.current = "";
            setTocados({});
        }
    };

    // Quando for um CNPJ válido, busca os dados da empresa (endereço, e-mail e inscrição estadual)
    const [buscandoCnpj, setBuscandoCnpj] = useState(false);
    const ultimoCnpj = useRef(""); // CNPJ da última busca (ou o que veio do banco)

    const preencherPorCnpj = async () => {
        if (clienteExistente) return; // cliente já cadastrado: campos travados
        const doc = somenteNumeros(cpfCnpj);
        if (doc.length !== 14 || erroCpfCnpj(doc)) return;

        // CNPJ diferente do anterior = outra empresa: troca tudo (inclusive e-mail e inscrição)
        // Mesmo CNPJ = só completa o que estiver vazio, sem apagar o que já foi digitado
        const trocouEmpresa = ultimoCnpj.current !== doc;
        ultimoCnpj.current = doc;

        setBuscandoCnpj(true);
        let dados = null;
        try {
            const res = await consultarCnpj(doc);
            dados = formatarDadosCnpj(res.data);
        } catch {
            dados = null;
        }

        // Se não veio rua/bairro (comum em MEI), completa pelo CEP no ViaCEP
        if (dados && (!dados.rua || !dados.bairro) && dados.cep) {
            const peloCep = await buscarEnderecoPorCep(dados.cep);
            if (peloCep) {
                dados.rua = dados.rua || peloCep.rua;
                dados.bairro = dados.bairro || peloCep.bairro;
                dados.municipio = dados.municipio || peloCep.municipio;
            }
        }
        setBuscandoCnpj(false);
        if (!dados) return;

        const aplicar = (setter, valor) =>
            trocouEmpresa ? setter(valor || "") : setter((atual) => atual || valor || "");

        aplicar(setRua, dados.rua);
        aplicar(setBairro, dados.bairro);
        aplicar(setCep, dados.cep);
        aplicar(setMunicipio, dados.municipio);
        aplicar(setEmail, dados.email);
        aplicar(setInscricaoMunicipal, dados.inscricaoEstadual);
    };

    // Formata o CEP e, quando tiver 8 números, busca o endereço no ViaCEP
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);

    const handleCepChange = async (e) => {
        const novoCep = formatarCep(e.target.value);
        setCep(novoCep);
        setCepNaoEncontrado(false);

        if (somenteNumeros(novoCep).length !== 8) return;

        setBuscandoCep(true);
        const endereco = await buscarEnderecoPorCep(novoCep);
        setBuscandoCep(false);

        if (!endereco) {
            setCepNaoEncontrado(true);
            return;
        }
        setMunicipio(endereco.municipio);
        // Rua e bairro só são preenchidos se estiverem vazios (para não apagar o que já foi digitado)
        if (endereco.rua) setRua((atual) => atual || endereco.rua);
        if (endereco.bairro) setBairro((atual) => atual || endereco.bairro);
    };

    // Cliente já existente (achado pelo telefone do orçamento) — se existir, campos travam
    const [clienteExistente, setClienteExistente] = useState(null);
    const [carregandoInicial, setCarregandoInicial] = useState(true);

    // Estados de Controle de Interface
    const [mensagemSucesso, setMensagemSucesso] = useState("");
    const [mensagemErro, setMensagemErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [buscandoDoc, setBuscandoDoc] = useState(false);

    // Estados do Modal de Confirmação (Dialog)
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dadosClienteEncontrado, setDadosClienteEncontrado] = useState(null);

    // Ao abrir a tela: busca o orçamento e verifica se o telefone já é de um cliente cadastrado
    useEffect(() => {
        buscarOrcamentoPorId(id)
            .then(async (res) => {
                const dadosOrcamento = res.data || res;
                const telefoneOrcamento = dadosOrcamento.telefone;

                if (telefoneOrcamento) {
                    try {
                        const resCliente = await buscarClientePorTelefone(telefoneOrcamento.replace(/\D/g, ""));
                        const dadosCliente = resCliente?.data || resCliente;
                        if (dadosCliente) {
                            setClienteExistente(dadosCliente);
                            setCpfCnpj(dadosCliente.cpfCnpj || "");
                            setEmail(dadosCliente.email || "");
                            setInscricaoMunicipal(dadosCliente.inscricaoMunicipal || "");
                            setRua(dadosCliente.endereco?.rua || "");
                            setBairro(dadosCliente.endereco?.bairro || "");
                            setCep(dadosCliente.endereco?.cep || "");
                            setMunicipio(dadosCliente.endereco?.municipio || "");
                        }
                    } catch (err) {
                        // Telefone não encontrado como cliente existente: segue com formulário livre
                    }
                }
            })
            .catch((err) => console.error("Erro ao carregar orçamento:", err))
            .finally(() => setCarregandoInicial(false));
    }, [id]);

    // Função de verificação no desfoque do campo (onBlur)
    const handleVerificarCliente = () => {
        if (clienteExistente) return;
        const documento = cpfCnpj?.replace(/\D/g, "");
        
        // Trava de segurança: Não busca se estiver sem documento, se já estiver buscando ou se o modal estiver aberto
        if (!documento || buscandoDoc || dialogOpen) return;

        setBuscandoDoc(true);

        buscarClientePorDocumento(documento)
            .then((res) => {
                if (res.data && typeof res.data === "object") {
                    setDadosClienteEncontrado(res.data);
                    setDialogOpen(true);
                }
            })
            .catch((err) => {
                console.error("Status do erro na busca de cliente:", err.response?.status);
            })
            .finally(() => {
                setBuscandoDoc(false);
            });
    };

    // Ação do Modal: Sim (Preenche) / Não (Limpa)
    const handleConfirmarAproveitamento = (aproveitar) => {
        setDialogOpen(false);
        if (aproveitar && dadosClienteEncontrado) {
            setEmail(dadosClienteEncontrado.email || "");
            setInscricaoMunicipal(dadosClienteEncontrado.inscricaoMunicipal || "");
            setRua(dadosClienteEncontrado.endereco?.rua || "");
            setBairro(dadosClienteEncontrado.endereco?.bairro || "");
            setCep(dadosClienteEncontrado.endereco?.cep || "");
            setMunicipio(dadosClienteEncontrado.endereco?.municipio || "");
        } else {
            setCpfCnpj("");
        }
    };

    // Salvar formulário final
    const handleSalvar = async () => {
        setMensagemErro("");
        setMensagemSucesso("");
        setTocados({ cpfCnpj: true, email: true, cep: true });
        // Cliente já cadastrado: os campos estão travados, então não bloqueia
        if (!clienteExistente && (erros.cpfCnpj || erros.email || erros.cep)) {
            setMensagemErro("Corrija os campos destacados antes de salvar.");
            return;
        }
        setCarregando(true);

        try {
            const response = await vincularCliente(id, {
                cpfCnpj,
                email,
                inscricaoMunicipal: ehCnpj ? inscricaoMunicipal : "",
                endereco: { rua, bairro, cep, municipio }
            });

            const status = response.headers["x-cliente-status"];
            setMensagemSucesso(
                status === "CLIENTE_JA_EXISTENTE" 
                    ? "Cliente já existia e foi vinculado!" 
                    : "Cliente criado e vinculado com sucesso!"
            );

            setTimeout(() => navigate("/orcamentos"), 1500);
        } catch (error) {
            console.error("Erro ao vincular cliente:", error.response?.data);
            setMensagemErro("Erro ao vincular cliente. Tente novamente.");
        } finally {
            setCarregando(false);
        }
    };

    const inputStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.1)",
        }
    };

    if (carregandoInicial) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pb: 6 }}>
            {/* Modal Customizado MUI (Dialog) */}
            <Dialog 
                open={dialogOpen} 
                onClose={() => handleConfirmarAproveitamento(false)}
                PaperProps={{
                    sx: { borderRadius: "16px", p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Cliente já cadastrado
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        O cliente <strong>{dadosClienteEncontrado?.nomeCliente || "Cadastrado"}</strong> já possui um cadastro com este documento. Deseja carregar os dados já cadastrados?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button 
                        onClick={() => handleConfirmarAproveitamento(false)} 
                        color="error"
                        sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                        Não, limpar
                    </Button>
                    <Button 
                        onClick={() => handleConfirmarAproveitamento(true)} 
                        variant="contained" 
                        autoFocus
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
                    >
                        Sim, carregar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cabeçalho */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <IconButton 
                    onClick={() => navigate(-1)}
                    sx={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.12)" }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                        Completar Cadastro
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Preencha os dados fiscais e de endereço do cliente
                    </Typography>
                </Box>
            </Stack>

            <Stack spacing={3}>
                {/* Mensagens de Feedback */}
                {mensagemErro && (
                    <Alert severity="error" onClose={() => setMensagemErro("")} sx={{ borderRadius: "12px", fontWeight: "bold" }}>
                        {mensagemErro}
                    </Alert>
                )}
                {mensagemSucesso && (
                    <Alert severity="success" onClose={() => setMensagemSucesso("")} sx={{ borderRadius: "12px", fontWeight: "bold" }}>
                        {mensagemSucesso}
                    </Alert>
                )}

                {clienteExistente && (
                    <Alert
                        severity="info"
                        sx={{
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
                        Cliente já cadastrado: <strong>{clienteExistente.nomeCliente || clienteExistente.nome}</strong>. Dados travados — para corrigir, edite o cadastro do cliente.
                    </Alert>
                )}

                {/* Bloco 1: Dados Fiscais */}
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
                            Dados Fiscais
                        </Typography>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="CPF/CNPJ" 
                                fullWidth 
                                value={cpfCnpj}
                                onChange={handleCpfCnpjChange}
                                onBlur={() => { tocar("cpfCnpj"); handleVerificarCliente(); preencherPorCnpj(); }}
                                error={Boolean(tocados.cpfCnpj && erros.cpfCnpj)}
                                helperText={buscandoCnpj ? "Buscando dados da empresa..." : (tocados.cpfCnpj ? erros.cpfCnpj : "")}
                                inputProps={{ inputMode: "numeric", maxLength: 14 }}
                                disabled={Boolean(clienteExistente)}
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField 
                                label="Email" 
                                fullWidth 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => tocar("email")}
                                error={Boolean(tocados.email && erros.email)}
                                helperText={tocados.email ? erros.email : ""}
                                disabled={Boolean(clienteExistente)}
                                sx={inputStyle}
                            />
                        </Grid>

                        {ehCnpj && (
                            <Grid item xs={12}>
                                <TextField
                                    label="Inscrição Estadual"
                                    fullWidth
                                    value={inscricaoMunicipal}
                                    onChange={(e) => setInscricaoMunicipal(e.target.value)}
                                    disabled={Boolean(clienteExistente)}
                                    sx={inputStyle}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Bloco 2: Endereço */}
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
                        <HomeOutlinedIcon sx={{ color: "#4caf50" }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Endereço
                        </Typography>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={8}>
                            <TextField 
                                label="Rua" 
                                fullWidth 
                                value={rua} 
                                onChange={(e) => setRua(e.target.value)} 
                                disabled={Boolean(clienteExistente)}
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField 
                                label="Bairro" 
                                fullWidth 
                                value={bairro} 
                                onChange={(e) => setBairro(e.target.value)} 
                                disabled={Boolean(clienteExistente)}
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField 
                                label="CEP" 
                                fullWidth 
                                value={cep}
                                onChange={handleCepChange}
                                onBlur={() => tocar("cep")}
                                error={Boolean(tocados.cep && erros.cep)}
                                helperText={
                                    buscandoCep ? "Buscando endereço..." :
                                    cepNaoEncontrado ? "CEP não encontrado, preencha o endereço manualmente" :
                                    tocados.cep ? erros.cep : ""
                                }
                                inputProps={{ inputMode: "numeric", maxLength: 9 }}
                                disabled={Boolean(clienteExistente)}
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={8}>
                            <TextField 
                                label="Município" 
                                fullWidth 
                                value={municipio} 
                                onChange={(e) => setMunicipio(e.target.value)} 
                                disabled={Boolean(clienteExistente)}
                                sx={inputStyle}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Botões de Ação */}
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                    <Button 
                        variant="outlined" 
                        onClick={() => navigate(-1)}
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
                        onClick={handleSalvar}
                        disabled={carregando}
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
                        {carregando ? <CircularProgress size={24} color="inherit" /> : "Salvar"}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}