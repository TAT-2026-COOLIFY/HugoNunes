package com.vdl.system.services;

import com.vdl.system.domain.model.BlingToken;
import com.vdl.system.domain.repository.BlingTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

/**
 * Autenticação OAuth 2.0 com o Bling (API v3).
 * Autoriza uma vez -> guarda os tokens no banco -> renova sozinho quando vence.
 */
@Slf4j
@Service
public class BlingAuthService {

    private static final String OAUTH_URL = "https://www.bling.com.br/Api/v3/oauth";

    private final BlingTokenRepository tokenRepository;
    private final RestClient restClient = RestClient.create();

    @Value("${bling.client-id}")
    private String clientId;

    @Value("${bling.client-secret}")
    private String clientSecret;

    private String stateAtual;

    public BlingAuthService(BlingTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    public String gerarUrlAutorizacao() {
        stateAtual = UUID.randomUUID().toString();
        return OAUTH_URL + "/authorize?response_type=code&client_id=" + clientId + "&state=" + stateAtual;
    }

    public void receberCallback(String code, String state) {
        if (stateAtual == null || !stateAtual.equals(state)) {
            throw new IllegalStateException("State inválido. Clique em 'Conectar Bling' novamente.");
        }
        stateAtual = null;

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        solicitarTokens(form);
    }

    public boolean estaConectado() {
        return tokenRepository.findById(1L)
                .map(t -> t.getRefreshToken() != null)
                .orElse(false);
    }

    public synchronized String getAccessToken() {
        BlingToken token = tokenRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("Bling não conectado. Clique em 'Conectar Bling' primeiro."));

        boolean vencido = token.getExpiraEm() == null
                || LocalDateTime.now().isAfter(token.getExpiraEm().minusMinutes(5));

        if (vencido) {
            log.info("[Bling] Access token vencido, renovando...");
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "refresh_token");
            form.add("refresh_token", token.getRefreshToken());
            token = solicitarTokens(form);
        }

        return token.getAccessToken();
    }

    @SuppressWarnings("unchecked")
    private BlingToken solicitarTokens(MultiValueMap<String, String> form) {
        String basic = Base64.getEncoder()
                .encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));

        Map<String, Object> resposta = restClient.post()
                .uri(OAUTH_URL + "/token")
                .header("Authorization", "Basic " + basic)
                .header("enable-jwt", "1")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(form)
                .retrieve()
                .body(Map.class);

        if (resposta == null || resposta.get("access_token") == null) {
            throw new IllegalStateException("Bling não retornou o access_token.");
        }

        BlingToken token = tokenRepository.findById(1L).orElseGet(BlingToken::new);
        token.setId(1L);
        token.setAccessToken((String) resposta.get("access_token"));
        token.setRefreshToken((String) resposta.get("refresh_token"));

        long expiresIn = resposta.get("expires_in") != null
                ? ((Number) resposta.get("expires_in")).longValue()
                : 3600;
        token.setExpiraEm(LocalDateTime.now().plusSeconds(expiresIn));

        log.info("[Bling] Tokens salvos. Expira em {} segundos.", expiresIn);
        return tokenRepository.save(token);
    }
}