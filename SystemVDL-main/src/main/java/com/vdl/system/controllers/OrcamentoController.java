package com.vdl.system.controllers;

import com.vdl.system.domain.dto.cliente.ClienteRequestDTO;
import com.vdl.system.domain.dto.orcamento.CriarOrcamentoRequestDTO;
import com.vdl.system.domain.dto.orcamento.CriarOrcamentoResponseDTO;
import com.vdl.system.domain.dto.orcamento.OrcamentoResponseDTO;
import com.vdl.system.domain.dto.orcamentoItens.CriarOrcamentoItensResponseDTO;
import com.vdl.system.domain.mapper.OrcamentoMapper;
import com.vdl.system.domain.model.Orcamento;
import com.vdl.system.domain.repository.ClienteRepository;
import com.vdl.system.services.OrcamentoService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/orcamentos")
public class OrcamentoController {

    private final OrcamentoService orcamentoService;
    private final OrcamentoMapper orcamentoMapper;
    private final ClienteRepository clienteRepository;

    public OrcamentoController(OrcamentoService orcamentoService, OrcamentoMapper orcamentoMapper, ClienteRepository clienteRepository) {
        this.orcamentoService = orcamentoService;
        this.orcamentoMapper = orcamentoMapper;
        this.clienteRepository = clienteRepository;
    }

    @PostMapping
    public ResponseEntity<CriarOrcamentoResponseDTO> criarOrcamento(@RequestBody @Valid CriarOrcamentoRequestDTO dto) {
        log.info("Recebida a requisição para criar orçamento | cliente: {} | telefone: {}", dto.nomeCliente(), dto.telefone());

        Orcamento orcamento = orcamentoService.criarOrcamento(dto);
        log.info("Orçamento criado com sucesso! id: {}", orcamento.getId());
        return ResponseEntity.ok(orcamentoMapper.toResponseCriar(orcamento));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> gerarPdf(@PathVariable Long id) {
        log.info("Recebida a requisição para gerar pdf, com id: {}", id);

        ByteArrayInputStream pdfStream = orcamentoService.gerarPdf(id);
        log.info("Pdf criado com sucesso!");

        byte[] pdfBytes = pdfStream.readAllBytes();
        log.info("PDF transformado em um array de bytes");

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=Orcamento_" + id + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @PatchMapping("/{id}/aprovar")
    public ResponseEntity<Void> aprovar(@PathVariable Long id) {
        log.info("Recebida a requisição para aprovar orçamento, id {}", id);

        orcamentoService.aprovarOrcamento(id);
        log.info("Orçamento aprovado, orçamento com id: {} ", id);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reprovar")
    public ResponseEntity<Void> reprovar(@PathVariable Long id) {
        log.info("Recebida a requisição para reprovar orçamento, id {}", id);

        orcamentoService.reprovarOrcamento(id);
        log.info("Orçamento reprovado, orçamento com id: {} ", id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cliente")
    public ResponseEntity<CriarOrcamentoResponseDTO> vincularCliente(
            @PathVariable Long id,
            @RequestBody @Valid ClienteRequestDTO dto
    ) {
        log.info("Recebida a requisição para vincular orçamento ao cliente, id orçamento: {}", id);

        Orcamento orcamentoAntes = orcamentoService.buscarPorId(id);
        String telefone = orcamentoAntes.getTelefone();

        boolean clienteExistia = clienteRepository.existsByTelefone(telefone);

        Orcamento orcamento = orcamentoService.vincularCliente(id, dto);

        log.info("Orçamento vinculado com sucesso! cliente: {}, vinculado ao orçamento com id: {}",
                orcamento.getNomeCliente(), id);

        return ResponseEntity.ok()
                .header(
                        "X-CLIENTE-STATUS",
                        clienteExistia ? "CLIENTE_JA_EXISTENTE" : "CLIENTE_CRIADO"
                )
                .body(orcamentoMapper.toResponseCriar(orcamento));
    }


    @GetMapping("/{id}/listar")
    public ResponseEntity<OrcamentoResponseDTO> buscarPorId(@PathVariable Long id) {

        var orcamento = orcamentoService.buscarPorId(id);

        return ResponseEntity.ok(orcamentoMapper.toResponse(orcamento));
    }

    @GetMapping
    public ResponseEntity<Page<OrcamentoResponseDTO>> listar(
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        Page<OrcamentoResponseDTO> orcamentos = orcamentoService.listarOrcamentos(status, pageable);

        return ResponseEntity.ok(orcamentos);
    }

    @GetMapping("/{id}/itens")
    public ResponseEntity<List<CriarOrcamentoItensResponseDTO>> listarItens(@PathVariable Long id) {
        return ResponseEntity.ok(orcamentoService.listarItensDoOrcamento(id));
    }

    @PutMapping("/{id}/editar")
    public ResponseEntity<OrcamentoResponseDTO> editarOrcamento(@PathVariable Long id, @RequestBody @Valid CriarOrcamentoRequestDTO dto) {
        log.info("Requisição para editar orçamento id: {}", id);

        Orcamento orcamento = orcamentoService.editarOrcamento(id, dto);

        return ResponseEntity.ok(orcamentoMapper.toResponse(orcamento));
    }

}
