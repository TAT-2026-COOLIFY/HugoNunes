import {
    Box, Typography, TextField, Button, Stack, Paper,
    Alert, IconButton, Grid, CircularProgress
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { somenteNumeros, erroCpfCnpj, erroEmail, erroCep, formatarCep, buscarEnderecoPorCep, formatarDadosCnpj } from "../../utils/validacoes";
import { consultarCnpj } from "../../api/consultaCnpjApi";
import { buscarClientePorId, atualizarCliente } from "../../api/clienteApi";

export default function EditarCliente() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [carregandoDados, setCarregandoDados] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [mensagemErro, setMensagemErro] = useState("");
    const [mensagemSucesso, setMensagemSucesso] = useState("");

    const [nomeCliente, setNomeCliente] = useState("");
    const [telefone, setTelefone] = useState("");
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

    useEffect(() => {
        buscarClientePorId(id)
            .then((res) => {
                const c = res.data || res;
                setNomeCliente(c.nomeCliente || "");
                setTelefone(c.telefone || "");
                setCpfCnpj(c.cpfCnpj || "");
                ultimoCnpj.current = (c.cpfCnpj || "").replace(/\D/g, "");
                setEmail(c.email || "");
                setInscricaoMunicipal(c.inscricaoMunicipal || "");
                setRua(c.endereco?.rua || "");
                setBairro(c.endereco?.bairro || "");
                setCep(c.endereco?.cep || "");
                setMunicipio(c.endereco?.municipio || "");
            })
            .catch((err) => {
                console.error("Erro ao carregar cliente:", err);
                setMensagemErro("Não foi possível carregar os dados do cliente.");
            })
            .finally(() => setCarregandoDados(false));
    }, [id]);

    async function handleSalvar() {
        setMensagemErro("");
        setMensagemSucesso("");
        setTocados({ cpfCnpj: true, email: true, cep: true });
        if (erros.cpfCnpj || erros.email || erros.cep) {
            setMensagemErro("Corrija os campos destacados antes de salvar.");
            return;
        }
        setSalvando(true);

        try {
            await atualizarCliente(id, {
                nomeCliente,
                telefone,
                cpfCnpj,
                email,
                inscricaoMunicipal: ehCnpj ? inscricaoMunicipal : "",
                endereco: { rua, bairro, cep, municipio }
            });

            setMensagemSucesso("Cliente atualizado com sucesso!");
            setTimeout(() => navigate(`/clientes/${id}`), 1200);
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error.response?.data);
            const msg =
                error.response?.data?.mensagem ||
                error.response?.data?.message ||
                "Erro ao atualizar cliente. Tente novamente.";
            setMensagemErro(msg);
        } finally {
            setSalvando(false);
        }
    }

    const inputStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.1)",
        }
    };

    if (carregandoDados) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", pb: 6 }}>
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
                        Editar Cliente
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Atualize os dados cadastrais do cliente
                    </Typography>
                </Box>
            </Stack>

            <Stack spacing={3}>
                {mensagemErro && (
                    <Alert severity="error" onClose={() => setMensagemErro("")} sx={{ borderRadius: "12px", fontWeight: "bold" }}>
                        {mensagemErro}
                    </Alert>
                )}
                {mensagemSucesso && (
                    <Alert severity="success" sx={{ borderRadius: "12px", fontWeight: "bold" }}>
                        {mensagemSucesso}
                    </Alert>
                )}

                {/* Bloco 1: Dados Principais */}
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
                            Dados do Cliente
                        </Typography>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nome do Cliente"
                                fullWidth
                                value={nomeCliente}
                                onChange={(e) => setNomeCliente(e.target.value)}
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Telefone"
                                fullWidth
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="CPF/CNPJ"
                                fullWidth
                                value={cpfCnpj}
                                onChange={handleCpfCnpjChange}
                                onBlur={() => { tocar("cpfCnpj"); preencherPorCnpj(); }}
                                error={Boolean(tocados.cpfCnpj && erros.cpfCnpj)}
                                helperText={buscandoCnpj ? "Buscando dados da empresa..." : (tocados.cpfCnpj ? erros.cpfCnpj : "")}
                                inputProps={{ inputMode: "numeric", maxLength: 14 }}
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
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Bairro"
                                fullWidth
                                value={bairro}
                                onChange={(e) => setBairro(e.target.value)}
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
                                sx={inputStyle}
                            />
                        </Grid>

                        <Grid item xs={12} sm={8}>
                            <TextField
                                label="Município"
                                fullWidth
                                value={municipio}
                                onChange={(e) => setMunicipio(e.target.value)}
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
                        disabled={salvando}
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
                        {salvando ? <CircularProgress size={24} color="inherit" /> : "Salvar Alterações"}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}