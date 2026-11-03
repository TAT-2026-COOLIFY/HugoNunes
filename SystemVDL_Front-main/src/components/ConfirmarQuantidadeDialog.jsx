import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  TextField, CircularProgress
} from "@mui/material";

const MARGEM = 0.10;

const moeda = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ConfirmarQuantidadeDialog({ open, onClose, itens = [], titulo, processando, onConfirmar }) {
  const [qtds, setQtds] = useState(() =>
    Object.fromEntries(itens.map((it) => [it.id, String(it.quantidade ?? "")]))
  );

  const linhas = itens.map((it) => {
    const orcada = Number(it.quantidade || 0);
    const preco = Number(it.ordemCompraItem?.precoUnitario || 0);
    const qtd = parseInt(qtds[it.id], 10);
    const valida = Number.isInteger(qtd) && qtd > 0;
    const diff = valida ? qtd - orcada : 0;
    const foraMargem = valida && orcada > 0 && Math.abs(diff) / orcada > MARGEM;
    return { it, orcada, preco, qtd, valida, diff, foraMargem, valor: valida ? preco * qtd : 0 };
  });

  const todasValidas = linhas.every((l) => l.valida);
  const total = linhas.reduce((acc, l) => acc + l.valor, 0);

  const confirmar = () => {
    if (!todasValidas) return;
    onConfirmar(linhas.map((l) => ({ id: l.it.id, quantidadeProduzida: l.qtd })));
  };

  return (
    <Dialog
      open={open}
      onClose={processando ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { bgcolor: "#1e1e1e", color: "#fff", borderRadius: "12px" } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>{titulo || "Concluir produção"}</DialogTitle>
      <Typography variant="body2" sx={{ px: 3, color: "rgba(255,255,255,0.5)" }}>
        Quantas caixas foram produzidas?
      </Typography>

      <DialogContent sx={{ pt: 2 }}>
        {linhas.map((l) => (
          <Box
            key={l.it.id}
            display="flex"
            alignItems="center"
            gap={2}
            sx={{ py: 1.2, borderBottom: "1px solid rgba(255,255,255,0.06)", "&:last-child": { borderBottom: 0 } }}
          >
            <Box flex={1}>
              <Typography sx={{ fontWeight: 600 }}>Item #{l.it.sequencial}</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                Orçado: {l.orcada}
                {l.diff !== 0 && (
                  <Box component="span" sx={{ ml: 1, color: l.foraMargem ? "#ffb74d" : l.diff > 0 ? "#81c784" : "#e57373" }}>
                    {l.diff > 0 ? "+" : ""}{l.diff}
                  </Box>
                )}
              </Typography>
            </Box>

            <TextField
              type="number"
              size="small"
              value={qtds[l.it.id]}
              onChange={(e) => setQtds((p) => ({ ...p, [l.it.id]: e.target.value }))}
              onFocus={(e) => e.target.select()}
              error={!l.valida}
              inputProps={{ min: 1, step: 1, style: { textAlign: "center" } }}
              sx={{
                width: 90,
                "& .MuiInputBase-root": { color: "#fff" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
              }}
            />

            <Typography sx={{ width: 95, textAlign: "right", fontWeight: 600, color: "#4ade80" }}>
              {l.valida ? moeda(l.valor) : "—"}
            </Typography>
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 700 }}>
          {linhas.length > 1 && <>Total: <span style={{ color: "#4ade80" }}>{todasValidas ? moeda(total) : "—"}</span></>}
        </Typography>
        <Box>
          <Button onClick={onClose} disabled={processando} sx={{ color: "rgba(255,255,255,0.5)", textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={confirmar}
            disabled={!todasValidas || processando}
            startIcon={processando ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", boxShadow: "none", ml: 1 }}
          >
            Concluir
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}