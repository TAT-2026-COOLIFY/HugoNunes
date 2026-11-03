package com.vdl.system.controllers;

import com.vdl.system.domain.model.OrdemEntrega;
import com.vdl.system.services.OrdemEntregaServices;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;

@RestController
@RequestMapping("/ordementrega")
public class OrdemEntregaController {

    private final OrdemEntregaServices ordemEntregaServices;

    public OrdemEntregaController(OrdemEntregaServices ordemEntregaServices) {
        this.ordemEntregaServices = ordemEntregaServices;
    }

    @PostMapping("/{ordemServicoId}")
    public ResponseEntity<OrdemEntrega> gerarOrdemEntrega(@PathVariable Long ordemServicoId) {
        OrdemEntrega ordemEntrega = ordemEntregaServices.gerarOrdemEntrega(ordemServicoId);

        return ResponseEntity.status(HttpStatus.CREATED).body(ordemEntrega);
    }

    @GetMapping("/{ordemEntregaId}/pdf")
    public ResponseEntity<byte[]> gerarPdf(@PathVariable Long ordemEntregaId) {

        ByteArrayInputStream pdfStream = ordemEntregaServices.gerarPdf(ordemEntregaId);
        String codigo = ordemEntregaServices.buscarCodigo(ordemEntregaId);

        byte[] pdfBytes = pdfStream.readAllBytes();

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=OrdemEntrega_" + codigo + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

}
