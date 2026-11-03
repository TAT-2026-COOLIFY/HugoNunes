package com.vdl.system.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

import java.util.Map;

/**
 * Serviço responsável por enviar mensagens de WhatsApp aos clientes
 * conforme o status do pedido muda (orçamento aprovado, em produção,
 * pronto para retirada).
 * <p>
 * Usa a Evolution API (https://github.com/EvolutionAPI/evolution-api),
 * open-source, rodando local via Docker — sem custo por mensagem.
 */
@Slf4j
@Service
public class WhatsAppService {

    private final RestClient restClient;

    @Value("${evolution.api.url}")
    private String apiUrl;

    @Value("${evolution.api.key}")
    private String apiKey;

    @Value("${evolution.api.instance}")
    private String instance;

    @Value("${evolution.api.enabled:true}")
    private boolean enabled;

    public WhatsAppService() {
        this.restClient = RestClient.create();
    }

    @Async
    public void enviarMensagem(String telefone, String mensagem) {
        if (!enabled) {
            log.info("[WhatsApp] Envio desabilitado (evolution.api.enabled=false). Mensagem não enviada.");
            return;
        }

        String numero = formatarNumero(telefone);
        if (numero == null) {
            log.warn("[WhatsApp] Telefone inválido/ausente, mensagem não enviada: '{}'", telefone);
            return;
        }

        try {
            String endpoint = apiUrl + "/message/sendText/" + instance;

            var response = restClient.post()
                    .uri(endpoint)
                    .header("apikey", apiKey)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "number", numero,
                            "text", mensagem
                    ))
                    .retrieve()
                    .toEntity(String.class);

            log.info("[WhatsApp] Mensagem enviada para {} - status HTTP {}", numero, response.getStatusCode());
        } catch (Exception e) {
            log.error("[WhatsApp] Falha ao enviar mensagem para {}: {}", numero, e.getMessage());
        }
    }

    public void notificarPedidoProntoParaRetirada(String telefone, String nomeCliente, String codigoOs,
                                                  int quantidadeProduzida, BigDecimal valorFinal) {
        String msg = String.format(
                "Olá, %s! ✅%nSeu %s está *pronto para retirada*!%n%n" +
                        "📦 Quantidade produzida: *%d caixas*%n" +
                        "💰 Valor final: *%s*%n%n" +
                        "Já pode vir buscar. Qualquer dúvida, estamos à disposição.",
                nomeCliente, formatarPedidoParaCliente(codigoOs),
                quantidadeProduzida, formatarMoeda(valorFinal)
        );
        enviarMensagem(telefone, msg);
    }

    // ==================== Mensagens de status do pedido ====================

    private String formatarMoeda(BigDecimal valor) {
        NumberFormat nf = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));
        return nf.format(valor != null ? valor : BigDecimal.ZERO);
    }

    public void notificarOrcamentoAprovado(String telefone, String nomeCliente, String codigoOrcamento) {
        String msg = String.format(
                "Olá, %s! 🎉%nSeu %s foi *aprovado*.%nEm breve entraremos em contato com os próximos passos. Obrigado pela preferência!",
                nomeCliente, formatarPedidoParaCliente(codigoOrcamento)
        );
        enviarMensagem(telefone, msg);
    }

    public void notificarPedidoEmProducao(String telefone, String nomeCliente, String codigoOs) {
        String msg = String.format(
                "Olá, %s! 🏭%nSeu %s entrou em *produção*.%nAssim que estiver pronto para retirada, vamos te avisar por aqui!",
                nomeCliente, formatarPedidoParaCliente(codigoOs)
        );
        enviarMensagem(telefone, msg);
    }

    public void notificarPedidoProntoParaRetirada(String telefone, String nomeCliente, String codigoOs) {
        String msg = String.format(
                "Olá, %s! ✅%nSeu %s está *pronto para retirada*!%nJá pode vir buscar. Qualquer dúvida, estamos à disposição.",
                nomeCliente, formatarPedidoParaCliente(codigoOs)
        );
        enviarMensagem(telefone, msg);
    }

    // ==================== Auxiliares ====================


    private String formatarPedidoParaCliente(String codigoInterno) {
        if (codigoInterno == null) {
            return "pedido";
        }
        String numero = codigoInterno.replaceAll("\\D+", "");
        return numero.isBlank() ? "pedido" : "pedido *nº " + numero + "*";
    }

    private String formatarNumero(String telefone) {
        if (telefone == null || telefone.isBlank()) {
            return null;
        }

        String digitos = telefone.replaceAll("\\D", "");

        if (digitos.isBlank()) {
            return null;
        }

        if (digitos.length() == 10 || digitos.length() == 11) {
            digitos = "55" + digitos;
        }

        return digitos;
    }
}
