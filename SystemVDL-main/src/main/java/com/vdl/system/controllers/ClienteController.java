package com.vdl.system.controllers;

import com.vdl.system.domain.dto.cliente.AtualizarClienteRequestDTO;
import com.vdl.system.domain.dto.cliente.AtualizarClienteResponseDTO;
import com.vdl.system.domain.dto.cliente.ClienteRequestDTO;
import com.vdl.system.domain.dto.cliente.ClienteResponseDTO;
import com.vdl.system.domain.dto.orcamento.OrcamentoResponseDTO;
import com.vdl.system.domain.mapper.ClienteMapper;
import com.vdl.system.domain.model.Cliente;
import com.vdl.system.services.ClienteService;
import com.vdl.system.services.OrcamentoService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/clientes")
public class    ClienteController {

    private final ClienteService clienteService;
    private final ClienteMapper clienteMapper;
    private OrcamentoService orcamentoService;

    public ClienteController(ClienteService clienteService, ClienteMapper clienteMapper, OrcamentoService orcamentoService) {
        this.clienteService = clienteService;
        this.clienteMapper = clienteMapper;
        this.orcamentoService = orcamentoService;
    }

    @PostMapping
    public ResponseEntity<ClienteResponseDTO> cadastrarCliente(@RequestBody @Valid ClienteRequestDTO dto) {
        log.info("Cadastrando cliente com email: {}", dto.email());

        var clienteCriado = clienteService.cadastrarCliente(dto);
        log.info("Cliente cadastrado com sucesso, id: {}", clienteCriado.id());

        return ResponseEntity.created(URI.create("/clientes/" + clienteCriado.id())).body(clienteCriado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AtualizarClienteResponseDTO> atualizarCliente(@PathVariable Long id, @RequestBody @Valid AtualizarClienteRequestDTO dto) {
        log.info("Atualizando o cliente com id: {}", id);

        AtualizarClienteResponseDTO clienteAtualizado = clienteService.editarCliente(id, dto);
        log.info("Cliente atualizado com sucesso!");

        return ResponseEntity.ok(clienteAtualizado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> buscarClientePorId(@PathVariable Long id) {
        log.info("Recebido a requisição para busca de cliente pelo id");

        Cliente cliente = clienteService.listarclienteporid(id);
        log.info("Cliente encontrado com sucesso, id: {}", id);

        return ResponseEntity.ok(clienteMapper.toResponse(cliente));
    }

    @GetMapping
    public ResponseEntity<Page<ClienteResponseDTO>> listar(Pageable pageable) {
        log.info("Listando os clientes cadastrados");

        Page<ClienteResponseDTO> clientes = clienteService.listarClientes(pageable);
        log.info("Listado todos os clientes com sucesso!");

        return ResponseEntity.ok(clientes);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        log.info("Deletando cliente com id: {}", id);
        clienteService.deletarCliente(id);
    }

    @GetMapping("/buscar-por-documento")
    public ResponseEntity<ClienteResponseDTO> buscarPorCpfCnpj(@RequestParam("cpfCnpj") String cpfCnpj){

        System.out.println("O JAVA RECEBEU A REQUISIÇÃO PARA O CPF_CNPJ: " + cpfCnpj);

        return clienteService.buscarCpfCnpj(cpfCnpj)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/buscar-por-telefone")
    public ResponseEntity<ClienteResponseDTO> buscarPorTelefone(@RequestParam("telefone") String telefone) {
        log.info("Recebida requisição para buscar cliente pelo telefone: {}", telefone);

        return clienteService.buscarPorTelefone(telefone)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/orcamentos")
    public ResponseEntity<List<OrcamentoResponseDTO>> listarOrcamentosDoCliente(@PathVariable Long id) {
        log.info("Recebida requisição para listar orçamentos do cliente id: {}", id);

        List<OrcamentoResponseDTO> orcamentos = orcamentoService.buscarPorClienteId(id);
        return ResponseEntity.ok(orcamentos);
    }

}
