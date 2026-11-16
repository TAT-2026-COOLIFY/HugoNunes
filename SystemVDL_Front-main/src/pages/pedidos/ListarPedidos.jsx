import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Tabs, Tab, Chip, Fade,
  Collapse, IconButton, CircularProgress, Snackbar, Alert
} from "@mui/material";

import api from "../../services/api";
import { listarPedidosFábrica } from "../../api/pedidosApi";

// Ícones
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckIcon from "@mui/icons-material/Check";

import ConfirmarQuantidadeDialog from "../../components/ConfirmarQuantidadeDialog";
import { statusBling, urlAutorizacaoBling, listarNotasFiscais, emitirNotaFiscal, consultarNotaFiscal } from "../../api/notaFiscalApi";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Quantidade que vale: a real produzida (se já informada) ou a orçada
const qtdEfetiva = (item) => item?.quantidadeProduzida ?? item?.quantidade ?? 0;

export default function ListarPedidos() {
  const [tabAtual, setTabAtual] = useState(0); 
  const [ordens, setOrdens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [idLoteAberto, setIdLoteAberto] = useState(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [dialogoQtd, setDialogoQtd] = useState(null);
    // Nota fiscal (Bling)
  const [blingConectado, setBlingConectado] = useState(true);
  const [notas, setNotas] = useState({}); // { [codigoOs]: nota }
  const [emitindoNf, setEmitindoNf] = useState(null);



  // Estado para substituir totalmente o alert do navegador por Toasts do MUI
  const [feedback, setFeedback] = useState({ open: false, msg: "", sev: "success" });

  const exibirNotificacao = (msg, sev = "success") => {
    setFeedback({ open: true, msg, sev });
  };

  const fecharNotificacao = () => {
    setFeedback(prev => ({ ...prev, open: false }));
  };

  // Carrega os pedidos do back-end
  const carregarPedidos = async () => {
    setCarregando(true);
    try {
      console.log("[REACT] Buscando pedidos no backend...");
      const res = await listarPedidosFábrica();
      console.log("[REACT] Pedidos carregados com sucesso:", res.data);
      setOrdens(res.data || []);
    } catch (err) {
      console.error("[REACT ERROR] Erro ao buscar ordens no back-end:", err);
      exibirNotificacao("Erro ao carregar a lista de pedidos no servidor.", "error");
    } finally {
      setCarregando(false);
    }
  };

  const carregarNotas = async () => {
    try {
      const [st, lista] = await Promise.all([statusBling(), listarNotasFiscais()]);
      setBlingConectado(!!st.data?.conectado);
      const mapa = {};
      (lista.data || []).forEach((n) => { mapa[n.codigoOs] = n; });
      setNotas(mapa);
    } catch (err) {
      console.error("[REACT ERROR] Erro ao buscar notas fiscais:", err);
    }
  };

  useEffect(() => {
    carregarPedidos();
    carregarNotas();
  }, []);

  const conectarBling = async () => {
    try {
      const res = await urlAutorizacaoBling();
      window.open(res.data.url, "_blank");
      exibirNotificacao("Autorize no Bling e depois atualize esta página.", "info");
    } catch {
      exibirNotificacao("Não foi possível gerar o link do Bling.", "error");
    }
  };

  const lidarEmitirNf = async (codigoOs) => {
    setEmitindoNf(codigoOs);
    try {
      const res = await emitirNotaFiscal(codigoOs);
      setNotas((prev) => ({ ...prev, [codigoOs]: res.data }));
      exibirNotificacao(`NF-e ${res.data.numero || ""} — ${res.data.situacaoDescricao}`, "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao emitir a nota fiscal.";
      exibirNotificacao(msg, "error");
      carregarNotas();
    } finally {
      setEmitindoNf(null);
    }
  };

    const lidarAtualizarNf = async (codigoOs) => {
    setEmitindoNf(codigoOs);
    try {
      const res = await consultarNotaFiscal(codigoOs);
      setNotas((prev) => ({ ...prev, [codigoOs]: res.data }));
      exibirNotificacao(`NF-e ${res.data.numero || ""} — ${res.data.situacaoDescricao}`, "info");
    } catch (err) {
      exibirNotificacao(err.response?.data?.message || "Erro ao consultar a nota fiscal.", "error");
    } finally {
      setEmitindoNf(null);
    }
  };

  // Agrupa e categoriza os lotes
  const { gruposEmAndamento, gruposProntos, gruposEntregues } = useMemo(() => {
    const grupos = ordens.reduce((acc, item) => {
      if (!item?.codigo) return acc;
      if (!acc[item.codigo]) acc[item.codigo] = [];
      acc[item.codigo].push(item);
      return acc;
    }, {});

    const emAndamento = {};
    const prontos = {};
    const entregues = {};

    Object.keys(grupos).forEach((codigo) => {
      const itens = grupos[codigo];
      const possuiPendente = itens.some((it) => it.statusProducao === "EM_PRODUCAO");
      const todosEntregues = itens.every((it) => it.statusProducao === "ENTREGUE");

      if (possuiPendente) {
        emAndamento[codigo] = itens;
      } else if (todosEntregues) {
        entregues[codigo] = itens;
      } else {
        prontos[codigo] = itens;
      }
    });

    return {
      gruposEmAndamento: emAndamento,
      gruposProntos: prontos,
      gruposEntregues: entregues,
    };
  }, [ordens]);

  const gruposParaExibir = useMemo(() => {
    if (tabAtual === 0) return gruposEmAndamento;
    if (tabAtual === 1) return gruposProntos;
    return gruposEntregues;
  }, [tabAtual, gruposEmAndamento, gruposProntos, gruposEntregues]);

    const abrirConcluirLote = (codigoOs, itensOs) => {
    const pendentes = itensOs.filter((it) => it.statusProducao === "EM_PRODUCAO");
    setDialogoQtd({ tipo: "lote", codigoOs, itens: pendentes });
  };

  const abrirConcluirItem = (item) => {
    setDialogoQtd({ tipo: "item", codigoOs: item.codigo, itens: [item] });
  };

  const confirmarQuantidades = async (quantidades) => {
    if (!dialogoQtd) return;
    const ok = dialogoQtd.tipo === "lote"
      ? await lidarConcluirLote(dialogoQtd.codigoOs, quantidades)
      : await lidarConcluirItem(quantidades[0].id, quantidades[0].quantidadeProduzida);
    if (ok) setDialogoQtd(null);
  };

  const lidarConcluirLote = async (codigoOs, quantidades = []) => {
    try {
      setProcessandoAcao(true);
      await api.post("/ordemServicos/concluirProducao", { codigo: codigoOs, itens: quantidades });
      exibirNotificacao(`O lote ${codigoOs} foi totalmente concluído na fábrica!`, "success");
      await carregarPedidos();
      return true;
    } catch (err) {
      console.error("[REACT ERROR] Erro ao concluir produção:", err);
      const mensagemServidor = err.response?.data?.message || err.response?.data || "Erro ao alterar status da produção.";
      exibirNotificacao(typeof mensagemServidor === "object" ? JSON.stringify(mensagemServidor) : mensagemServidor, "error");
      return false;
    } finally {
      setProcessandoAcao(false);
    }
  };

  const lidarConcluirItem = async (itemId, quantidadeProduzida) => {
    try {
      setProcessandoAcao(true);
      await api.post(`/ordemServicos/concluirItem/${itemId}`, { quantidadeProduzida });
      exibirNotificacao("Item concluído com sucesso!", "success");
      await carregarPedidos();
      return true;
    } catch (err) {
      console.error("[REACT ERROR] Erro ao concluir item:", err);
      const mensagemServidor = err.response?.data?.message || err.response?.data || "Falha ao concluir este item específico.";
      exibirNotificacao(typeof mensagemServidor === "object" ? JSON.stringify(mensagemServidor) : mensagemServidor, "error");
      return false;
    } finally {
      setProcessandoAcao(false);
    }
  };

  const lidarGerarEntrega = async (codigoOs, ordemServicoId) => {
    if (!ordemServicoId) {
      exibirNotificacao(`Erro Crítico: O ID da Ordem de Serviço não foi encontrado para o lote ${codigoOs}.`, "error");
      return;
    }

    setProcessandoAcao(true);
    try {
      const response = await api.post(`/ordementrega/${ordemServicoId}`);
      const novaOrdemEntrega = response.data;

      exibirNotificacao("Ordem de entrega gerada e pedido despachado com sucesso!", "success");

      try {
        const pdfResponse = await api.get(`/ordementrega/${novaOrdemEntrega.id}/pdf`, {
          responseType: "blob",
        });

        const file = new Blob([pdfResponse.data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = fileURL;
        link.setAttribute("download", `OrdemEntrega_${novaOrdemEntrega.codigo || codigoOs}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(fileURL);
      } catch (pdfErr) {
        console.error("[API ERROR] Erro ao baixar PDF:", pdfErr);
        exibirNotificacao("O pedido foi despachado, mas houve uma falha ao gerar o PDF.", "warning");
      }

      setIdLoteAberto(null);
      await carregarPedidos();
      setTabAtual(2);
    } catch (err) {
      console.error("[API ERROR] Erro ao criar ordem de entrega:", err);
      const erroBack = err.response?.data;
      const statusBack = err.response?.status;
      let mensagemDetalhada = "Falha ao concluir a ordem de entrega no servidor.";
      if (erroBack) {
        mensagemDetalhada += ` (Erro ${statusBack}): ${typeof erroBack === "object" ? erroBack.message || erroBack.error || JSON.stringify(erroBack) : erroBack}`;
      }
      exibirNotificacao(mensagemDetalhada, "error");
    } finally {
      setProcessandoAcao(false);
    }
  };

  return (
    <Box sx={{ width: "100%", p: 3, color: "#fff" }}>
      {/* Componente Toast do Material UI Centralizado no Topo */}
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

            {dialogoQtd && (
        <ConfirmarQuantidadeDialog
          key={`${dialogoQtd.tipo}-${dialogoQtd.codigoOs}-${dialogoQtd.itens.map((i) => i.id).join(",")}`}
          open
          itens={dialogoQtd.itens}
          titulo={dialogoQtd.tipo === "lote"
            ? `Concluir lote ${dialogoQtd.codigoOs}`
            : `Concluir item #${dialogoQtd.itens[0]?.sequencial ?? ""} — ${dialogoQtd.codigoOs}`}
          processando={processandoAcao}
          onClose={() => setDialogoQtd(null)}
          onConfirmar={confirmarQuantidades}
        />
      )}

      {/* Cabeçalho Principal */}
      <Box display="flex" alignItems="center" gap={2} sx={{ mb: 4 }}>
        <PrecisionManufacturingIcon sx={{ fontSize: 38, color: "#90caf9" }} />
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}>
          Gerenciamento de Pedidos de Fábrica
        </Typography>
                {!blingConectado && (
          <Button
            variant="outlined"
            size="small"
            onClick={conectarBling}
            sx={{ ml: "auto", textTransform: "none", borderColor: "#ffb74d", color: "#ffb74d" }}
          >
            Conectar Bling
          </Button>
        )}
      </Box>

      {/* Tabs Estilizadas */}
      <Box sx={{ borderBottom: 1, borderColor: "rgba(255, 255, 255, 0.08)", mb: 3 }}>
        <Tabs
          value={tabAtual}
          onChange={(e, novaTab) => {
            setIdLoteAberto(null);
            setTabAtual(novaTab);
          }}
          textColor="inherit"
          sx={{
            "& .MuiTabs-indicator": { bgcolor: "#90caf9", height: 3, borderRadius: "3px 3px 0 0" },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "rgba(255, 255, 255, 0.5)",
              minHeight: 48,
              mr: 2,
              "&.Mui-selected": { color: "#90caf9" }
            }
          }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <span>Em Produção</span>
                <Chip
                  label={Object.keys(gruposEmAndamento).length}
                  size="small"
                  sx={{
                    bgcolor: tabAtual === 0 ? "rgba(144, 202, 249, 0.2)" : "rgba(255, 255, 255, 0.08)",
                    color: tabAtual === 0 ? "#90caf9" : "inherit",
                    fontWeight: 700,
                    height: 20
                  }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <span>Prontos para Retirada</span>
                <Chip
                  label={Object.keys(gruposProntos).length}
                  size="small"
                  sx={{
                    bgcolor: tabAtual === 1 ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 255, 255, 0.08)",
                    color: tabAtual === 1 ? "#4caf50" : "inherit",
                    fontWeight: 700,
                    height: 20
                  }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <span>Finalizados / Entregues</span>
                <Chip
                  label={Object.keys(gruposEntregues).length}
                  size="small"
                  sx={{
                    bgcolor: tabAtual === 2 ? "rgba(33, 150, 243, 0.2)" : "rgba(255, 255, 255, 0.08)",
                    color: tabAtual === 2 ? "#2196f3" : "inherit",
                    fontWeight: 700,
                    height: 20
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Loading e Tabela */}
      {carregando ? (
        <Box display="flex" justifyContent="center" alignItems="center" my={8}>
          <CircularProgress size={36} sx={{ color: "#90caf9", mr: 2 }} />
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Buscando lotes de produção...
          </Typography>
        </Box>
      ) : (
        <Fade in={!carregando}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              bgcolor: "#121212",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              overflow: "hidden"
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: "rgba(255, 255, 255, 0.03)" }}>
                <TableRow sx={{ "& th": { borderColor: "rgba(255, 255, 255, 0.08)" } }}>
                  <TableCell width="60" />
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Código OS</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Cliente</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Volume Total do Lote</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Status</TableCell>
                  <TableCell align="center" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase" }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(gruposParaExibir).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: "rgba(255,255,255,0.4)", py: 6 }}>
                      Nenhum lote nesta listagem.
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.keys(gruposParaExibir).map((codigoOs) => {
                    const itensOs = gruposParaExibir[codigoOs];
                    const primeiroItem = itensOs[0];
                    const cliente = primeiroItem?.ordemCompra?.cliente?.nomeCliente || "Não informado";
                    const ordemServicoId = primeiroItem?.ordemServico?.id || primeiroItem?.ordemServicoId || primeiroItem?.id;

                    let statusGeralLabel = "Em Produção";
                    let statusColor = { bgcolor: "rgba(255, 152, 0, 0.12)", color: "#ffb74d", border: "1px solid rgba(255, 152, 0, 0.2)" };

                    if (tabAtual === 2) {
                      statusGeralLabel = "Entregue";
                      statusColor = { bgcolor: "rgba(33, 150, 243, 0.12)", color: "#64b5f6", border: "1px solid rgba(33, 150, 243, 0.2)" };
                    } else if (tabAtual === 1) {
                      statusGeralLabel = "Pronto para Retirada";
                      statusColor = { bgcolor: "rgba(76, 175, 80, 0.12)", color: "#81c784", border: "1px solid rgba(76, 175, 80, 0.2)" };
                    }

                    const qtdTotal = itensOs.reduce((acc, cur) => acc + qtdEfetiva(cur), 0);
                    const valorTotalLote = itensOs.reduce(
                      (acc, cur) => acc + Number(cur.valorTotalFinal ?? cur.ordemCompraItem?.valorTotal ?? 0), 0);
                    const aberto = idLoteAberto === codigoOs;

                    return (
                      <React.Fragment key={`${tabAtual}-${codigoOs}`}>
                        {/* Linha Mãe */}
                        <TableRow
                          hover
                          sx={{
                            "& td": { borderColor: "rgba(255, 255, 255, 0.05)", py: 2 },
                            bgcolor: aberto ? "rgba(255, 255, 255, 0.03)" : "transparent",
                            transition: "background-color 0.2s"
                          }}
                        >
                          <TableCell width="60">
                            <IconButton 
                              size="small" 
                              onClick={() => setIdLoteAberto(aberto ? null : codigoOs)} 
                              sx={{ color: "#90caf9", "&:hover": { bgcolor: "rgba(144, 202, 249, 0.08)" } }}
                            >
                              {aberto ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{codigoOs}</TableCell>
                          <TableCell sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{cliente}</TableCell>
                          <TableCell sx={{ color: "#90caf9", fontWeight: 600 }}>
                            {qtdTotal} unds <Typography component="span" variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>({itensOs.length} modelos)</Typography>
                            <Typography variant="caption" component="div" sx={{ color: "#4ade80", fontWeight: 600 }}>
                              {formatarMoeda(valorTotalLote)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={statusGeralLabel} size="small" sx={{ ...statusColor, fontWeight: 600, borderRadius: "6px" }} />
                          </TableCell>
                          <TableCell align="center">
                            {tabAtual === 0 && (
                              <Button 
                                variant="contained" 
                                color="success"
                                startIcon={<CheckCircleOutlineIcon />}
                                size="small"
                                disabled={processandoAcao}
                                onClick={() => abrirConcluirLote(codigoOs, itensOs)}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                  borderRadius: "8px",
                                  boxShadow: "none",
                                  px: 2
                                }}
                              >
                                Concluir Lote Inteiro
                              </Button>
                            )}
                            {tabAtual === 1 && (
                              <Button 
                                variant="contained" 
                                color="info"
                                startIcon={<LocalShippingIcon />}
                                size="small"
                                disabled={processandoAcao}
                                onClick={() => lidarGerarEntrega(codigoOs, ordemServicoId)}
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                  borderRadius: "8px",
                                  boxShadow: "none",
                                  px: 2
                                }}
                              >
                                Despachar / Entregar
                              </Button>
                            )}
                                                        {tabAtual === 2 && (() => {
                              const nf = notas[codigoOs];
                              const autorizada = nf && (nf.situacao === 5 || nf.situacao === 6);
                              const aguardando = nf && [3, 8, 10].includes(nf.situacao);
                              const ocupado = emitindoNf === codigoOs;

                              if (autorizada) {
                                return (
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                    <Chip label={`NF ${nf.numero}`} size="small" color="success" variant="outlined" />
                                    {nf.linkDanfe && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        href={nf.linkDanfe}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px", boxShadow: "none" }}
                                      >
                                        Baixar PDF
                                      </Button>
                                    )}
                                  </Box>
                                );
                              }

                              if (aguardando) {
                                return (
                                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      disabled={!!emitindoNf}
                                      startIcon={ocupado ? <CircularProgress size={14} color="inherit" /> : null}
                                      onClick={() => lidarAtualizarNf(codigoOs)}
                                      sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
                                    >
                                      Atualizar
                                    </Button>
                                    <Typography variant="caption" sx={{ color: "#90caf9" }}>
                                      {nf.situacaoDescricao}
                                    </Typography>
                                  </Box>
                                );
                              }

                              return (
                                <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={ocupado ? <CircularProgress size={14} color="inherit" /> : <ReceiptLongIcon />}
                                    disabled={!!emitindoNf || !blingConectado}
                                    onClick={() => lidarEmitirNf(codigoOs)}
                                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px", boxShadow: "none" }}
                                  >
                                    {ocupado ? "Enviando..." : nf ? "Emitir de novo" : "Emitir NF-e"}
                                  </Button>
                                  {nf && (
                                    <Typography variant="caption" sx={{ color: nf.situacao === 4 ? "#e57373" : "#ffb74d" }}>
                                      {nf.situacaoDescricao}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })()}
                          </TableCell>
                        </TableRow>

                        {/* Sub-Tabela Filha (Accordion Expandido) */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0, border: 0 }} colSpan={6}>
                            <Collapse in={aberto} timeout="auto" unmountOnExit>
                              <Box sx={{ my: 2, mx: 1, p: 2.5, bgcolor: "#1e1e1e", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                <Typography variant="subtitle2" gutterBottom component="div" sx={{ color: "#90caf9", fontWeight: 600, mb: 2 }}>
                                  Detalhes dos Itens do Lote {codigoOs}
                                </Typography>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ "& th": { color: "rgba(255,255,255,0.4)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.08)" } }}>
                                      <TableCell>Seq.</TableCell>
                                      <TableCell>Qtd. Orçada</TableCell>
                                      <TableCell>Qtd. Produzida</TableCell>
                                      <TableCell>Valor</TableCell>
                                      <TableCell>Status Item</TableCell>
                                      <TableCell align="center">{tabAtual === 0 ? "Ação Individual" : ""}</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {itensOs.map((item, index) => {
                                      const estaPronto = item.statusProducao !== "EM_PRODUCAO";
                                      const estaEntregue = item.statusProducao === "ENTREGUE";

                                      return (
                                        <TableRow key={`${codigoOs}-${item.id || index}`} sx={{ "& td": { color: "rgba(255,255,255,0.8)", borderBottom: "1px solid rgba(255,255,255,0.03)", py: 1.2 } }}>
                                          <TableCell>#{item.sequencial}</TableCell>
                                          <TableCell>{item.quantidade} unds</TableCell>
                                          <TableCell sx={{ fontWeight: 600 }}>
                                            {item.quantidadeProduzida != null ? (
                                              <>
                                                {item.quantidadeProduzida} unds
                                                {item.quantidadeProduzida !== item.quantidade && (
                                                  <Typography component="span" variant="caption" sx={{ ml: 0.8, color: item.quantidadeProduzida > item.quantidade ? "#81c784" : "#ffb74d" }}>
                                                    ({item.quantidadeProduzida > item.quantidade ? "+" : ""}{item.quantidadeProduzida - item.quantidade})
                                                  </Typography>
                                                )}
                                              </>
                                            ) : (
                                              <Typography component="span" variant="body2" sx={{ color: "rgba(255,255,255,0.35)" }}>—</Typography>
                                            )}
                                          </TableCell>
                                          <TableCell sx={{ color: "#4ade80", fontWeight: 600 }}>
                                            {formatarMoeda(item.valorTotalFinal ?? item.ordemCompraItem?.valorTotal)}
                                          </TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={estaEntregue ? "Entregue" : (!estaPronto ? "Em Produção" : "Pronto")} 
                                              size="small" 
                                              variant="outlined"
                                              color={estaEntregue ? "info" : (!estaPronto ? "warning" : "success")}
                                              sx={{ fontSize: "0.72rem", height: "22px", borderRadius: "4px" }}
                                            />
                                          </TableCell>
                                          <TableCell align="center">
                                            {tabAtual === 0 && (
                                              !estaPronto ? (
                                                <Button
                                                  variant="contained"
                                                  color="success"
                                                  size="small"
                                                  startIcon={<CheckIcon />}
                                                  disabled={processandoAcao}
                                                  onClick={() => abrirConcluirItem(item)}
                                                  sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.2, px: 1.5, borderRadius: "6px" }}
                                                >
                                                  Concluir Item
                                                </Button>
                                              ) : (
                                                <Typography variant="body2" sx={{ color: "#81c784", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, fontSize: "0.8rem", fontWeight: 600 }}>
                                                  <CheckIcon fontSize="inherit" /> Finalizado
                                                </Typography>
                                              )
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}
    </Box>
  );
}
