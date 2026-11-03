package com.vdl.system.controllers;

import com.vdl.system.services.BlingAuthService;
import com.vdl.system.services.NotaFiscalService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notaFiscal")
public class NotaFiscalController {

    private final NotaFiscalService notaFiscalService;
    private final BlingAuthService blingAuthService;

    public NotaFiscalController(NotaFiscalService notaFiscalService, BlingAuthService blingAuthService) {
        this.notaFiscalService = notaFiscalService;
        this.blingAuthService = blingAuthService;
    }

    @GetMapping("/bling/status")
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(Map.of("conectado", blingAuthService.estaConectado()));
    }

    @GetMapping("/bling/url-autorizacao")
    public ResponseEntity<?> urlAutorizacao() {
        return ResponseEntity.ok(Map.of("url", blingAuthService.gerarUrlAutorizacao()));
    }

    @GetMapping(value = "/bling/callback", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> callback(@RequestParam String code, @RequestParam(required = false) String state) {
        try {
            blingAuthService.receberCallback(code, state);
            return ResponseEntity.ok("<h2 style='font-family:sans-serif'>Bling conectado ✅</h2><p style='font-family:sans-serif'>Pode fechar esta aba e voltar para o sistema.</p>");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("<h2 style='font-family:sans-serif'>Erro ao conectar com o Bling</h2><p style='font-family:sans-serif'>" + e.getMessage() + "</p>");
        }
    }

    @PostMapping("/emitir/{codigoOs}")
    public ResponseEntity<?> emitir(@PathVariable String codigoOs) {
        try {
            return ResponseEntity.ok(notaFiscalService.emitirPorCodigoOs(codigoOs));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{codigoOs}")
    public ResponseEntity<?> consultar(@PathVariable String codigoOs) {
        try {
            return ResponseEntity.ok(notaFiscalService.consultarPorCodigoOs(codigoOs));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(notaFiscalService.listarEmitidas());
    }
}