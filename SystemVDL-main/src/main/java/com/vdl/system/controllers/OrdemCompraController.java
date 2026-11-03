package com.vdl.system.controllers;

import com.vdl.system.domain.dto.ordemCompra.CriarOrdemCompraRequestDTO;
import com.vdl.system.domain.dto.ordemCompra.OrdemCompraResponseDTO;
import com.vdl.system.domain.enumered.StatusOrdemCompra;
import com.vdl.system.domain.mapper.OrdemCompraMapper;
import com.vdl.system.domain.model.OrdemCompra;
import com.vdl.system.services.OrdemCompraServices;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/ordemcompras")
public class OrdemCompraController {

    private final OrdemCompraServices ordemCompraServices;
    private final OrdemCompraMapper ordemCompraMapper;

    public OrdemCompraController(OrdemCompraServices ordemCompraServices, OrdemCompraMapper ordemCompraMapper) {
        this.ordemCompraServices = ordemCompraServices;
        this.ordemCompraMapper = ordemCompraMapper;
    }

    @PostMapping("/{orcamentoId}")
    public ResponseEntity<OrdemCompraResponseDTO> criarOrdemCompra(
            @PathVariable Long orcamentoId,
            @RequestBody @Valid CriarOrdemCompraRequestDTO dto
    ) {
        OrdemCompra ordemCompra = ordemCompraServices.criarOrdemCompra(orcamentoId, dto);

        return ResponseEntity.created(URI.create("/ordemcompras/" + ordemCompra.getId()))
                .body(ordemCompraMapper.toResponse(ordemCompra));
    }

    @PutMapping("/{id}/gerar-servico")
    public ResponseEntity<OrdemCompraResponseDTO> gerarServico(@PathVariable Long id) {
        log.info("Gerando serviço para ordem de compra id: {}", id);
        OrdemCompra ordemCompra = ordemCompraServices.aprovarOrdemCompra(id);
        return ResponseEntity.ok(ordemCompraMapper.toResponse(ordemCompra));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdemCompraResponseDTO> buscarPorId(@PathVariable Long id){
        log.info("Buscando detalhe da Ordem de compra id: {}", id);
        OrdemCompra ordemCompra = ordemCompraServices.buscarPorId(id);
        return ResponseEntity.ok(ordemCompraMapper.toResponse(ordemCompra));
    }

    @GetMapping
    public ResponseEntity<List<OrdemCompraResponseDTO>> listarTodas(
            @RequestParam(required = false) StatusOrdemCompra status
    ) {
        List<OrdemCompra> ordemCompras = ordemCompraServices.listarTodas(status);
        List<OrdemCompraResponseDTO> dtos = ordemCompras.stream()
                .map(ordemCompraMapper::toResponse).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> gerarPdf(@PathVariable Long id) {
        log.info("Recebida a requisição para gerar pdf, com id: {}", id);

        ByteArrayInputStream pdfStream = ordemCompraServices.gerarPdf(id);
        log.info("Pdf criado com sucesso!");

        byte[] pdfBytes = pdfStream.readAllBytes();

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=OrdemCompra_" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}