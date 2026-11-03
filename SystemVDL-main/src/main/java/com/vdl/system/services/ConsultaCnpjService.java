package com.vdl.system.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Consulta os dados de uma empresa pelo CNPJ (APIs públicas e gratuitas).
 * 1º tenta a CNPJ.ws (traz a Inscrição Estadual) - limite de 3 consultas por minuto.
 * Se falhar, usa a BrasilAPI (não traz Inscrição Estadual).
 */
@Slf4j
@Service
public class ConsultaCnpjService {

    private final RestClient restClient = RestClient.builder()
            .defaultHeader("User-Agent", "SystemVDL")
            .build();

    public Map<String, Object> consultar(String cnpjInformado) {
        String cnpj = cnpjInformado == null ? "" : cnpjInformado.replaceAll("\\D", "");
        if (cnpj.length() != 14) {
            throw new IllegalArgumentException("CNPJ inválido");
        }

        try {
            return consultarCnpjWs(cnpj);
        } catch (Exception e) {
            log.warn("[CNPJ] CNPJ.ws falhou ({}), tentando BrasilAPI", e.getMessage());
        }

        try {
            return consultarBrasilApi(cnpj);
        } catch (Exception e) {
            log.warn("[CNPJ] BrasilAPI também falhou: {}", e.getMessage());
            return null;
        }
    }

    // ==================== CNPJ.ws ====================

    @SuppressWarnings("unchecked")
    private Map<String, Object> consultarCnpjWs(String cnpj) {
        Map<String, Object> resp = restClient.get()
                .uri("https://publica.cnpj.ws/cnpj/" + cnpj)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(Map.class);

        Map<String, Object> est = (Map<String, Object>) resp.get("estabelecimento");
        if (est == null) throw new IllegalStateException("sem estabelecimento");

        String uf = texto(mapa(est, "estado"), "sigla");

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("razaoSocial", texto(resp, "razao_social"));
        r.put("tipoLogradouro", texto(est, "tipo_logradouro"));
        r.put("logradouro", texto(est, "logradouro"));
        r.put("numero", texto(est, "numero"));
        r.put("bairro", texto(est, "bairro"));
        r.put("cep", texto(est, "cep"));
        r.put("municipio", texto(mapa(est, "cidade"), "nome"));
        r.put("uf", uf);
        r.put("email", texto(est, "email"));
        r.put("inscricaoEstadual", escolherInscricaoEstadual(est, uf));
        r.put("fonte", "CNPJ.ws");
        return r;
    }

    /** Pega a IE ativa do mesmo estado da empresa (ou a primeira ativa). */
    @SuppressWarnings("unchecked")
    private String escolherInscricaoEstadual(Map<String, Object> est, String uf) {
        Object lista = est.get("inscricoes_estaduais");
        if (!(lista instanceof List<?> ies)) return "";

        String primeiraAtiva = "";
        for (Object o : ies) {
            if (!(o instanceof Map<?, ?> ie)) continue;
            Map<String, Object> m = (Map<String, Object>) ie;
            if (!Boolean.TRUE.equals(m.get("ativo"))) continue;
            String numero = texto(m, "inscricao_estadual");
            if (numero.isBlank()) continue;
            if (primeiraAtiva.isBlank()) primeiraAtiva = numero;
            if (uf.equalsIgnoreCase(texto(mapa(m, "estado"), "sigla"))) return numero;
        }
        return primeiraAtiva;
    }

    // ==================== BrasilAPI (reserva) ====================

    @SuppressWarnings("unchecked")
    private Map<String, Object> consultarBrasilApi(String cnpj) {
        Map<String, Object> d = restClient.get()
                .uri("https://brasilapi.com.br/api/cnpj/v1/" + cnpj)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(Map.class);

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("razaoSocial", texto(d, "razao_social"));
        r.put("tipoLogradouro", texto(d, "descricao_tipo_de_logradouro"));
        r.put("logradouro", texto(d, "logradouro"));
        r.put("numero", texto(d, "numero"));
        r.put("bairro", texto(d, "bairro"));
        r.put("cep", texto(d, "cep"));
        r.put("municipio", texto(d, "municipio"));
        r.put("uf", texto(d, "uf"));
        r.put("email", texto(d, "email"));
        r.put("inscricaoEstadual", ""); // BrasilAPI não tem IE
        r.put("fonte", "BrasilAPI");
        return r;
    }

    // ==================== Auxiliares ====================

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapa(Map<String, Object> origem, String chave) {
        Object v = origem == null ? null : origem.get(chave);
        return v instanceof Map ? (Map<String, Object>) v : Map.of();
    }

    private String texto(Map<String, Object> origem, String chave) {
        Object v = origem == null ? null : origem.get(chave);
        return v == null ? "" : String.valueOf(v).trim();
    }
}