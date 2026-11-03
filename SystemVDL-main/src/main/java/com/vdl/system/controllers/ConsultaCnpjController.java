package com.vdl.system.controllers;

import com.vdl.system.services.ConsultaCnpjService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/consulta-cnpj")
public class ConsultaCnpjController {

    private final ConsultaCnpjService consultaCnpjService;

    public ConsultaCnpjController(ConsultaCnpjService consultaCnpjService) {
        this.consultaCnpjService = consultaCnpjService;
    }

    @GetMapping("/{cnpj}")
    public ResponseEntity<?> consultar(@PathVariable String cnpj) {
        try {
            Map<String, Object> dados = consultaCnpjService.consultar(cnpj);
            if (dados == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Não foi possível consultar o CNPJ agora."));
            }
            return ResponseEntity.ok(dados);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}