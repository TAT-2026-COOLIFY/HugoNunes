package com.vdl.system.controllers;

import com.vdl.system.domain.model.OrdemServico;
import com.vdl.system.domain.repository.OrdemServicoRepository;
import com.vdl.system.pdf.PdfGenerator;
import com.vdl.system.services.OrdemServicoServices;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vdl.system.domain.dto.ordemServico.ConcluirItemRequestDTO;
import com.vdl.system.domain.dto.ordemServico.ConcluirProducaoRequestDTO;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/ordemServicos")
public class OrdemServicoController {

    private final OrdemServicoServices ordemServicoServices;
    private final OrdemServicoRepository ordemServicoRepository;

    public OrdemServicoController(OrdemServicoServices ordemServicoServices, OrdemServicoRepository ordemServicoRepository) {
        this.ordemServicoServices = ordemServicoServices;
        this.ordemServicoRepository = ordemServicoRepository;
    }

    @PostMapping("/gerar/{ordemCompraId}")
    public ResponseEntity<?> gerarServico(@PathVariable Long ordemCompraId) {
        return ResponseEntity.ok(ordemServicoServices.gerarOrdemServico(ordemCompraId));
    }

    @GetMapping("{ordemCompraId}/pdf")
    public ResponseEntity<byte[]> gerarPdf(@PathVariable Long ordemCompraId) throws IOException {

        List<OrdemServico> lista =
                ordemServicoRepository.findAllByOrdemCompraIdOrderBySequencial(ordemCompraId);

        ByteArrayInputStream pdf =
                PdfGenerator.gerarOrdemServicoPdf(lista, ordemServicoServices);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=OrdemServico_" + ordemCompraId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf.readAllBytes());
    }

    @PostMapping("/concluirProducao")
    public ResponseEntity<Void> pedidoEntregue(@RequestBody ConcluirProducaoRequestDTO dto) {
        ordemServicoServices.entregaPedido(dto.codigo(), dto.itens());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<OrdemServico>> listarTodos() {
        return ResponseEntity.ok(ordemServicoRepository.findAll());
    }

    @PostMapping("/concluirItem/{id}")
    public ResponseEntity<Void> concluirItemUnico(@PathVariable Long id,
                                                  @RequestBody(required = false) ConcluirItemRequestDTO dto){
        Integer quantidadeProduzida = dto != null ? dto.quantidadeProduzida() : null;
        ordemServicoServices.concluirItemUnico(id, quantidadeProduzida);
        return ResponseEntity.noContent().build();
    }

}
