import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Paper, TextField, Button, Typography,
    Alert, InputAdornment, IconButton, CircularProgress
} from "@mui/material";
import { Visibility, VisibilityOff, Lock, Person } from "@mui/icons-material";
import { loginApi } from "../../api/authApi"; // Se o seu arquivo for api.js, mude para "../../api/api"
import logoVdl from "../../assets/logo-vdl.png";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro("");
        setCarregando(true);

        try {
            const data = await loginApi(username, password);
            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", data.username);
            navigate("/orcamentos");
        } catch (err) {
            console.error("Erro no login:", err);
            const msgErro = typeof err.response?.data === "string"
                ? err.response.data
                : "Usuário ou senha inválidos.";
            setErro(msgErro);
        } finally {
            setCarregando(false);
        }
    };

    const inputStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            bgcolor: "rgba(0, 0, 0, 0.25)",
            color: "#f8fafc",
            transition: "all 0.2s ease",
            "& fieldset": {
                borderColor: "rgba(255, 255, 255, 0.1)"
            },
            "&:hover fieldset": {
                borderColor: "rgba(0, 198, 255, 0.4)"
            },
            "&.Mui-focused fieldset": {
                borderColor: "#00c6ff",
                borderWidth: "1.5px"
            }
        },
        "& .MuiInputLabel-root": { color: "#94a3b8" },
        "& .MuiInputLabel-root.Mui-focused": { color: "#00c6ff" }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                background: "radial-gradient(circle at 20% 20%, #16213e 0%, #0a0e1a 55%, #05070d 100%)",
                p: { xs: 2, md: 4 }
            }}
        >
            {/* Manchas de luz decorativas, sutis, ao fundo */}
            <Box
                sx={{
                    position: "absolute",
                    top: "-10%",
                    left: "-8%",
                    width: 420,
                    height: 420,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(0,114,255,0.25) 0%, rgba(0,114,255,0) 70%)",
                    filter: "blur(10px)",
                    pointerEvents: "none"
                }}
            />
            <Box
                sx={{
                    position: "absolute",
                    bottom: "-15%",
                    right: "-10%",
                    width: 500,
                    height: 500,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(0,198,255,0.18) 0%, rgba(0,198,255,0) 70%)",
                    filter: "blur(10px)",
                    pointerEvents: "none"
                }}
            />

            <Paper
                elevation={0}
                sx={{
                    display: "flex",
                    width: "100%",
                    maxWidth: "920px",
                    minHeight: "540px",
                    borderRadius: "28px",
                    overflow: "hidden",
                    bgcolor: "#141b2d",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.03)",
                    position: "relative",
                    zIndex: 1
                }}
            >
                {/* LADO ESQUERDO: Branding */}
                <Box
                    sx={{
                        flex: 1,
                        display: { xs: "none", md: "flex" },
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                        overflow: "hidden",
                        background: "linear-gradient(160deg, #0072ff 0%, #0057cc 55%, #003d99 100%)",
                        color: "#fff",
                        p: 5,
                        textAlign: "center"
                    }}
                >
                    {/* Textura decorativa sutil */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: -60,
                            right: -60,
                            width: 220,
                            height: 220,
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.07)"
                        }}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: -80,
                            left: -50,
                            width: 260,
                            height: 260,
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.05)"
                        }}
                    />

                    <Box
                        sx={{
                            bgcolor: "#fff",
                            borderRadius: "20px",
                            p: 2.5,
                            mb: 4,
                            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.3)",
                            position: "relative",
                            zIndex: 1
                        }}
                    >
                        <Box
                            component="img"
                            src={logoVdl}
                            alt="VDL Embalagens"
                            sx={{
                                width: "100%",
                                maxWidth: 220,
                                height: "auto",
                                display: "block"
                            }}
                        />
                    </Box>

                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ position: "relative", zIndex: 1, letterSpacing: "-0.5px", mb: 1.5 }}
                    >
                        Sistema VDL
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            position: "relative",
                            zIndex: 1,
                            opacity: 0.92,
                            maxWidth: "300px",
                            lineHeight: 1.7
                        }}
                    >
                        Gestão simplificada de orçamentos, ordens de compra e serviços em um só lugar.
                    </Typography>
                </Box>

                {/* LADO DIREITO: Formulário de Login */}
                <Box
                    sx={{
                        flex: 1,
                        p: { xs: 3, sm: 6 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                    }}
                >
                    <Typography variant="h5" fontWeight={800} color="#f8fafc" sx={{ mb: 0.5, letterSpacing: "-0.3px" }}>
                        Bem-vindo de volta!
                    </Typography>
                    <Typography variant="body2" color="#94a3b8" sx={{ mb: 4 }}>
                        Insira suas credenciais para acessar a plataforma.
                    </Typography>

                    {erro && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }}>
                            {erro}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            label="Usuário"
                            margin="normal"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            sx={inputStyle}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person sx={{ color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Senha"
                            type={mostrarSenha ? "text" : "password"}
                            margin="normal"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={inputStyle}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                            edge="end"
                                            sx={{ color: "#64748b" }}
                                        >
                                            {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={carregando}
                            sx={{
                                mt: 4,
                                py: 1.6,
                                borderRadius: "14px",
                                fontWeight: 700,
                                textTransform: "none",
                                fontSize: "1rem",
                                background: "linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)",
                                boxShadow: "0 10px 24px rgba(0, 114, 255, 0.4)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #005bcc 0%, #00a3cc 100%)",
                                    boxShadow: "0 12px 28px rgba(0, 114, 255, 0.5)",
                                    transform: "translateY(-1px)"
                                }
                            }}
                        >
                            {carregando ? (
                                <CircularProgress size={24} sx={{ color: "#fff" }} />
                            ) : (
                                "Acessar Conta"
                            )}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}