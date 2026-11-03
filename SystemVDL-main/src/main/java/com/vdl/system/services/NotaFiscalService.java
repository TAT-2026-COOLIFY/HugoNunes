package com.vdl.system.services;

import com.vdl.system.domain.dto.notaFiscal.NotaFiscalResponseDTO;
import com.vdl.system.domain.model.Cliente;
import com.vdl.system.domain.model.Endereco;
import com.vdl.system.domain.model.OrdemEntrega;
import com.vdl.system.domain.model.OrdemEntregaItem;
import com.vdl.system.domain.repository.OrdemEntregaRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Emite a NF-e no Bling a partir da Ordem de Entrega
 * (que já tem a quantidade REAL produzida e o valor final),
 * envia para a SEFAZ e guarda o link do PDF (DANFE).
 */
@Slf4j
@Service
public class NotaFiscalService {

    private static final String API_URL = "https://api.bling.com.br/Api/v3";

    // Situações do Bling
    private static final int PENDENTE = 1;
    private static final int REJEITADA = 4;
    private static final int AUTORIZADA = 5;
    private static final int EMITIDA_DANFE = 6;

    private final OrdemEntregaRepository ordemEntregaRepository;
    private final BlingAuthService blingAuthService;
    private final RestClient restClient = RestClient.create();

    @Value("${bling.ncm:4819.10.00}")
    private String ncm;

    // Natureza para empresa com IE (contribuinte do ICMS)
    @Value("${bling.natureza-operacao-id:0}")
    private Long naturezaOperacaoId;

    // Natureza para pessoa física / sem IE (não contribuinte)
    @Value("${bling.natureza-operacao-consumidor-id:0}")
    private Long naturezaOperacaoConsumidorId;

    @Value("${bling.uf-padrao:SP}")
    private String ufPadrao;

    // false = só cria a nota no Bling (teste). true = envia para a SEFAZ (vale de verdade)
    @Value("${bling.enviar-sefaz:false}")
    private boolean enviarSefaz;

    public NotaFiscalService(OrdemEntregaRepository ordemEntregaRepository, BlingAuthService blingAuthService) {
        this.ordemEntregaRepository = ordemEntregaRepository;
        this.blingAuthService = blingAuthService;
    }

    // dontRollbackOn: se o Bling rejeitar, ainda guarda o id da nota criada (evita nota duplicada)
    @Transactional(dontRollbackOn = IllegalStateException.class)
    public NotaFiscalResponseDTO emitirPorCodigoOs(String codigoOs) {
        OrdemEntrega oe = ordemEntregaRepository.findFirstByOrdemServicoCodigo(codigoOs)
                .orElseThrow(() -> new IllegalStateException("Ordem de entrega não encontrada para " + codigoOs + ". Despache o pedido primeiro."));

        // Se a nota já existe, confere primeiro a situação atual no Bling
        // (ela pode ter sido autorizada direto pelo Bling)
        if (oe.getBlingNfeId() != null) {
            atualizarSituacao(oe);
            if (estaAutorizada(oe)) {
                return toDto(ordemEntregaRepository.save(oe));
            }
        }

        try {
            Map<String, Object> nota = montarNota(oe);

            if (oe.getBlingNfeId() == null) {
                // 1. Cria a NF-e no Bling
                Map<?, ?> criada = enviarJson("POST", "/nfe", nota);
                Map<?, ?> data = (Map<?, ?>) criada.get("data");
                oe.setBlingNfeId(((Number) data.get("id")).longValue());
                oe.setNumeroNotaFiscal(String.valueOf(data.get("numero")));
                ordemEntregaRepository.save(oe);
                log.info("[Bling] NF-e criada id={} numero={}", oe.getBlingNfeId(), oe.getNumeroNotaFiscal());
            } else if (oe.getSituacaoNotaFiscal() == null
                    || oe.getSituacaoNotaFiscal() == PENDENTE
                    || oe.getSituacaoNotaFiscal() == REJEITADA) {
                // 1b. Já existe (pendente/rejeitada): atualiza com os dados atuais antes de reenviar
                // O Bling exige o número da nota na atualização
                if (oe.getNumeroNotaFiscal() != null) {
                    nota.put("numero", oe.getNumeroNotaFiscal());
                }
                enviarJson("PUT", "/nfe/" + oe.getBlingNfeId(), nota);
                log.info("[Bling] NF-e {} atualizada antes de reenviar", oe.getBlingNfeId());
            }

            if (enviarSefaz) {
                // 2. Envia para a SEFAZ
                enviarJson("POST", "/nfe/" + oe.getBlingNfeId() + "/enviar", null);

                // 3. A SEFAZ pode demorar alguns segundos: consulta até ter uma resposta final
                aguardarRetornoSefaz(oe);
            } else {
                log.info("[Bling] MODO TESTE: nota {} criada, mas NÃO enviada para a SEFAZ", oe.getBlingNfeId());
                atualizarSituacao(oe);
            }

        } catch (RestClientResponseException e) {
            String msg = extrairMensagemErro(e.getResponseBodyAsString());
            log.error("[Bling] Erro ao emitir NF-e: {}", e.getResponseBodyAsString());
            ordemEntregaRepository.save(oe);
            throw new IllegalStateException("Bling: " + msg);
        }

        return toDto(ordemEntregaRepository.save(oe));
    }

    /** Consulta de novo a situação no Bling (usado pelo botão "Atualizar"). */
    @Transactional
    public NotaFiscalResponseDTO consultarPorCodigoOs(String codigoOs) {
        OrdemEntrega oe = ordemEntregaRepository.findFirstByOrdemServicoCodigo(codigoOs)
                .orElseThrow(() -> new IllegalStateException("Ordem de entrega não encontrada para " + codigoOs));
        if (oe.getBlingNfeId() != null) {
            atualizarSituacao(oe);
            ordemEntregaRepository.save(oe);
        }
        return toDto(oe);
    }

    public List<NotaFiscalResponseDTO> listarEmitidas() {
        return ordemEntregaRepository.findByBlingNfeIdIsNotNull().stream().map(this::toDto).toList();
    }

    private boolean estaAutorizada(OrdemEntrega oe) {
        Integer s = oe.getSituacaoNotaFiscal();
        return s != null && (s == AUTORIZADA || s == EMITIDA_DANFE);
    }

    private void aguardarRetornoSefaz(OrdemEntrega oe) {
        for (int tentativa = 1; tentativa <= 8; tentativa++) {
            atualizarSituacao(oe);
            Integer s = oe.getSituacaoNotaFiscal();
            if (s != null && (s == AUTORIZADA || s == EMITIDA_DANFE || s == REJEITADA || s == 2 || s == 9)) {
                log.info("[Bling] SEFAZ respondeu: situação {}", s);
                return;
            }
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        log.info("[Bling] SEFAZ ainda processando. Use o botão 'Atualizar' depois.");
    }

    // ==================== Montagem da nota ====================

    private Map<String, Object> montarNota(OrdemEntrega oe) {
        Cliente cliente = oe.getOrdemServico().getOrdemCompra().getCliente();
        String formaPagamento = oe.getOrdemServico().getOrdemCompra().getFormaPagamento();

        Map<String, Object> nota = new LinkedHashMap<>();
        nota.put("tipo", 1); // 1 = saída
        nota.put("dataOperacao", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        Map<String, Object> contato = montarContato(cliente);
        nota.put("contato", contato);

        // Contribuinte com IE (1) -> natureza normal (Venda de produção)
        // Pessoa física / sem IE / isento -> natureza de não contribuinte
        boolean contribuinteIcms = Integer.valueOf(1).equals(contato.get("contribuinte"));
        Long natureza = contribuinteIcms ? naturezaOperacaoId : naturezaOperacaoConsumidorId;
        if (natureza != null && natureza > 0) {
            nota.put("naturezaOperacao", Map.of("id", natureza));
        }

        List<Map<String, Object>> itens = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (OrdemEntregaItem item : oe.getItens()) {
            BigDecimal valorItem = item.getValorTotal() != null
                    ? item.getValorTotal()
                    : item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade()));
            total = total.add(valorItem);

            int c = item.getComprimento().intValue();
            int l = item.getLargura().intValue();
            int a = item.getAltura().intValue();

            Map<String, Object> i = new LinkedHashMap<>();
            i.put("codigo", "CX-" + c + "x" + l + "x" + a);
            i.put("descricao", "Caixa de papelão " + c + "x" + l + "x" + a + " mm - " + item.getDescricaoGramatura());
            i.put("unidade", "UN");
            i.put("quantidade", item.getQuantidade());
            i.put("valor", item.getPrecoUnitario());
            i.put("tipo", "P");
            i.put("classificacaoFiscal", ncm);
            i.put("origem", 0);
            itens.add(i);
        }
        nota.put("itens", itens);

        // Parcela única com a forma de pagamento do pedido (buscada no Bling)
        Map<String, Object> parcela = new LinkedHashMap<>();
        parcela.put("data", LocalDate.now().toString());
        parcela.put("valor", total.setScale(2, RoundingMode.HALF_UP));
        if (formaPagamento != null) {
            parcela.put("observacoes", formaPagamento);
        }
        Long idForma = buscarFormaPagamentoBling(formaPagamento);
        if (idForma != null) {
            parcela.put("formaPagamento", Map.of("id", idForma));
        }
        nota.put("parcelas", List.of(parcela));

        // 9 = sem ocorrência de transporte (cliente retira)
        nota.put("transporte", Map.of("fretePorConta", 9));

        nota.put("observacoes", "Pedido " + oe.getOrdemServico().getCodigo() + " / " + oe.getCodigo());
        return nota;
    }

    private Map<String, Object> montarContato(Cliente cliente) {
        String documento = cliente.getCpfCnpj() == null ? "" : cliente.getCpfCnpj().replaceAll("\\D", "");

        Map<String, Object> contato = new LinkedHashMap<>();
        contato.put("nome", cliente.getNomeCliente());
        contato.put("tipoPessoa", documento.length() == 14 ? "J" : "F");
        contato.put("numeroDocumento", documento);

        // IE só vale para empresa (CNPJ). Pessoa física = não contribuinte, sem IE.
        String ie = cliente.getInscricaoMunicipal() == null ? "" : cliente.getInscricaoMunicipal().trim();
        boolean pessoaJuridica = documento.length() == 14;

        if (pessoaJuridica && ie.equalsIgnoreCase("ISENTO")) {
            contato.put("contribuinte", 2); // contribuinte isento
        } else if (pessoaJuridica && !ie.replaceAll("\\D", "").isEmpty()) {
            contato.put("ie", ie.replaceAll("\\D", ""));
            contato.put("contribuinte", 1); // contribuinte do ICMS
        } else {
            contato.put("contribuinte", 9); // não contribuinte
        }

        if (cliente.getTelefone() != null) contato.put("telefone", cliente.getTelefone());
        if (cliente.getEmail() != null) contato.put("email", cliente.getEmail());

        Endereco end = cliente.getEndereco();
        if (end != null) {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("endereco", end.getRua());
            e.put("numero", "S/N");
            e.put("bairro", end.getBairro());
            e.put("cep", end.getCep() == null ? null : end.getCep().replaceAll("\\D", ""));
            e.put("municipio", end.getMunicipio());
            e.put("uf", ufPadrao);
            e.put("pais", "Brasil");
            contato.put("endereco", e);
        }
        return contato;
    }

    // ==================== Forma de pagamento ====================

    /**
     * Converte a forma de pagamento do sistema (PIX, BOLETO, CARTAO, DINHEIRO)
     * no código de tipo de pagamento da SEFAZ e procura a forma correspondente cadastrada no Bling.
     */
    private Long buscarFormaPagamentoBling(String formaSistema) {
        List<Integer> tiposAceitos = switch (formaSistema == null ? "" : formaSistema.toUpperCase()) {
            case "PIX" -> List.of(17, 20);
            case "BOLETO" -> List.of(15);
            case "CARTAO" -> List.of(3);
            case "DINHEIRO" -> List.of(1);
            default -> List.of();
        };
        if (tiposAceitos.isEmpty()) return null;

        try {
            Map<?, ?> resp = get("/formas-pagamentos?limite=100");
            Object lista = resp.get("data");
            if (!(lista instanceof List<?> formas)) return null;

            // Palavra que deve aparecer no nome da forma, caso o tipo não bata
            String palavra = switch (formaSistema.toUpperCase()) {
                case "PIX" -> "PIX";
                case "BOLETO" -> "BOLETO";
                case "CARTAO" -> "CART";
                case "DINHEIRO" -> "DINHEIRO";
                default -> "";
            };

            Long encontrada = null;
            Long porNome = null;
            for (Object o : formas) {
                if (!(o instanceof Map<?, ?> f)) continue;
                Object tipo = f.get("tipoPagamento");
                Object situacao = f.get("situacao");
                String descricao = String.valueOf(f.get("descricao"));
                log.info("[Bling] Forma de pagamento: id={} descricao='{}' tipo={} situacao={}",
                        f.get("id"), descricao, tipo, situacao);

                boolean ativa = !(situacao instanceof Number n) || n.intValue() == 1;
                if (!ativa) continue;

                // 1ª opção: pelo tipo de pagamento
                if (encontrada == null && tipo instanceof Number t && tiposAceitos.contains(t.intValue())) {
                    encontrada = ((Number) f.get("id")).longValue();
                }
                // 2ª opção: pelo nome
                if (porNome == null && !palavra.isEmpty()
                        && descricao.toUpperCase().replace("Ã", "A").contains(palavra)) {
                    porNome = ((Number) f.get("id")).longValue();
                }
            }
            if (encontrada == null) {
                encontrada = porNome;
            }

            if (encontrada == null) {
                log.warn("[Bling] Nenhuma forma de pagamento ativa do tipo {} cadastrada no Bling ({}).", tiposAceitos, formaSistema);
            }
            return encontrada;
        } catch (RestClientResponseException e) {
            log.warn("[Bling] Não foi possível buscar as formas de pagamento (verifique o escopo 'Formas de pagamento'): {}",
                    e.getResponseBodyAsString());
            return null;
        }
    }

    // ==================== Consulta ====================

    private void atualizarSituacao(OrdemEntrega oe) {
        Map<?, ?> resp = get("/nfe/" + oe.getBlingNfeId());
        Map<?, ?> data = (Map<?, ?>) resp.get("data");
        if (data == null) return;

        if (data.get("situacao") instanceof Number n) oe.setSituacaoNotaFiscal(n.intValue());
        if (data.get("numero") != null) oe.setNumeroNotaFiscal(String.valueOf(data.get("numero")));
        if (data.get("chaveAcesso") != null) oe.setChaveAcesso(String.valueOf(data.get("chaveAcesso")));

        // Prefere o link direto do PDF; se não tiver, usa o link do DANFE
        Object linkPdf = data.get("linkPDF");
        Object linkDanfe = data.get("linkDanfe");
        if (linkPdf != null && !String.valueOf(linkPdf).isBlank()) {
            oe.setLinkDanfe(String.valueOf(linkPdf));
        } else if (linkDanfe != null && !String.valueOf(linkDanfe).isBlank()) {
            oe.setLinkDanfe(String.valueOf(linkDanfe));
        }
    }

    private NotaFiscalResponseDTO toDto(OrdemEntrega oe) {
        return new NotaFiscalResponseDTO(
                oe.getOrdemServico().getCodigo(),
                oe.getBlingNfeId(),
                oe.getNumeroNotaFiscal(),
                oe.getSituacaoNotaFiscal(),
                descricaoSituacao(oe.getSituacaoNotaFiscal()),
                oe.getChaveAcesso(),
                oe.getLinkDanfe()
        );
    }

    private String descricaoSituacao(Integer s) {
        if (s == null) return "Não emitida";
        return switch (s) {
            case 1 -> enviarSefaz ? "Pendente" : "Pendente (modo teste)";
            case 2 -> "Cancelada";
            case 3 -> "Aguardando SEFAZ";
            case 4 -> "Rejeitada pela SEFAZ";
            case 5 -> "Autorizada";
            case 6 -> "Autorizada";
            case 7 -> "Registrada";
            case 8 -> "Aguardando SEFAZ";
            case 9 -> "Denegada";
            case 10 -> "Aguardando SEFAZ";
            case 11 -> "Bloqueada";
            default -> "Situação " + s;
        };
    }

    // ==================== HTTP ====================

    private Map<?, ?> enviarJson(String metodo, String caminho, Object body) {
        var req = ("PUT".equals(metodo) ? restClient.put() : restClient.post())
                .uri(API_URL + caminho)
                .header("Authorization", "Bearer " + blingAuthService.getAccessToken())
                .accept(MediaType.APPLICATION_JSON);
        if (body != null) {
            req = req.contentType(MediaType.APPLICATION_JSON).body(body);
        }
        Map<?, ?> resp = req.retrieve().body(Map.class);
        return resp != null ? resp : Map.of();
    }

    private Map<?, ?> get(String caminho) {
        Map<?, ?> resp = restClient.get()
                .uri(API_URL + caminho)
                .header("Authorization", "Bearer " + blingAuthService.getAccessToken())
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(Map.class);
        return resp != null ? resp : Map.of();
    }

    private String extrairMensagemErro(String body) {
        if (body == null || body.isBlank()) return "erro desconhecido";
        List<String> msgs = new ArrayList<>();
        Matcher m = Pattern.compile("\"(?:msg|description|message|error_description)\"\\s*:\\s*\"(.*?)\"").matcher(body);
        while (m.find()) {
            String txt = decodificarUnicode(m.group(1));
            if (!txt.isBlank() && !msgs.contains(txt)) msgs.add(txt);
        }
        return msgs.isEmpty() ? body : String.join(" | ", msgs);
    }

    // Converte "\u00e3" em "ã", "\u00e9" em "é", etc.
    private String decodificarUnicode(String texto) {
        Matcher m = Pattern.compile("\\\\u([0-9a-fA-F]{4})").matcher(texto);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            m.appendReplacement(sb, Matcher.quoteReplacement(
                    String.valueOf((char) Integer.parseInt(m.group(1), 16))));
        }
        m.appendTail(sb);
        return sb.toString();
    }
}