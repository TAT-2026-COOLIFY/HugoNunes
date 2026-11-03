package com.vdl.system.services;

import com.vdl.system.domain.dto.cliente.AtualizarClienteRequestDTO;
import com.vdl.system.domain.dto.cliente.AtualizarClienteResponseDTO;
import com.vdl.system.domain.dto.cliente.ClienteRequestDTO;
import com.vdl.system.domain.dto.cliente.ClienteResponseDTO;
import com.vdl.system.domain.mapper.ClienteMapper;
import com.vdl.system.domain.model.Cliente;
import com.vdl.system.domain.model.Endereco;
import com.vdl.system.domain.repository.ClienteRepository;
import com.vdl.system.infra.exception.cliente.ClienteJaCadastradoException;
import com.vdl.system.infra.exception.cliente.ClienteNaoEncontradoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
public class ClienteService {
    private final ClienteRepository clienteRepository;
    private final ClienteMapper clienteMapper;

    public ClienteService(ClienteRepository clienteRepository, ClienteMapper clienteMapper) {
        this.clienteRepository = clienteRepository;
        this.clienteMapper = clienteMapper;
    }

    public Cliente cadastrarClienteApartiDoOrcamento(String nome, String telefone, ClienteRequestDTO dto) {
        log.info("Iniciando o processo de vínculo/cadastro de cliente a partir do orçamento: {}", nome);

        String tel = padronizar(telefone);

        // 1. Primeiro tenta buscar pelo CPF/CNPJ se ele foi enviado no DTO
        if (dto.cpfCnpj() != null && !dto.cpfCnpj().isBlank()) {
            Optional<Cliente> clientePorDocumento = clienteRepository.findByCpfCnpj(dto.cpfCnpj());
            if (clientePorDocumento.isPresent()) {
                log.info("Cliente já existente encontrado pelo CPF/CNPJ: {}", dto.cpfCnpj());
                return clientePorDocumento.get(); // Retorna o cliente que já existe para o Orçamento
            }
        }

        // 2. Se não achou pelo documento, tenta buscar pelo telefone padronizado
        return clienteRepository.findByTelefone(tel)
                .orElseGet(() -> {
                    log.info("Cliente não encontrado. Criando um novo registro para: {}", nome);

                    // 3. Validação extra: impede a criação se o CPF/CNPJ por acaso bater com outro na persistência
                    if (dto.cpfCnpj() != null && clienteRepository.existsByCpfCnpj(dto.cpfCnpj())) {
                        throw new ClienteJaCadastradoException("Cliente com este CPF/CNPJ já está cadastrado no sistema!");
                    }

                    Cliente clienteNovo = new Cliente();
                    clienteNovo.setNomeCliente(nome);
                    clienteNovo.setTelefone(tel);
                    clienteNovo.setCpfCnpj(dto.cpfCnpj());
                    clienteNovo.setEmail(dto.email());
                    clienteNovo.setInscricaoMunicipal(dto.inscricaoMunicipal());

                    if (dto.endereco() != null) {
                        Endereco endereco = new Endereco();
                        endereco.setRua(dto.endereco().rua());
                        endereco.setBairro(dto.endereco().bairro());
                        endereco.setCep(dto.endereco().cep());
                        endereco.setMunicipio(dto.endereco().municipio());
                        clienteNovo.setEndereco(endereco);
                    }

                    return clienteRepository.save(clienteNovo);
                });
    }

    public ClienteResponseDTO cadastrarCliente(ClienteRequestDTO dto) {
        log.info("Iniciando o cadastro de cliente com email: {}", dto.email());

        if (clienteRepository.existsByCpfCnpj(dto.cpfCnpj())) {
            throw new ClienteJaCadastradoException("Cliente já cadastrado!");
        }

        Cliente clienteEntity = clienteMapper.toEntity(dto);
        Cliente salvar = clienteRepository.save(clienteEntity);
        log.info("Cliente cadastrado com sucesso, id: {}", clienteEntity.getId());

        return clienteMapper.toResponse(salvar);
    }

    public AtualizarClienteResponseDTO editarCliente(long id, AtualizarClienteRequestDTO dto) {
        log.info("Editando o cliente pelo id: {}", id);

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ClienteNaoEncontradoException("Cliente não encontrado"));

        if (dto.nomeCliente() != null) {
            cliente.setNomeCliente(dto.nomeCliente());
        }
        if (dto.telefone() != null) {
            cliente.setTelefone(dto.telefone());
        }
        if (dto.cpfCnpj() != null) {
            cliente.setCpfCnpj(dto.cpfCnpj());
        }
        if (dto.email() != null) {
            cliente.setEmail(dto.email());
        }
        if (dto.inscricaoMunicipal() != null) {
            cliente.setInscricaoMunicipal(dto.inscricaoMunicipal());
        }
        if (dto.endereco() != null) {
            Endereco endereco = cliente.getEndereco();

            if (endereco == null) {
                endereco = new Endereco();
            }

            endereco.setRua(dto.endereco().rua());
            endereco.setBairro(dto.endereco().bairro());
            endereco.setCep(dto.endereco().cep());
            endereco.setMunicipio(dto.endereco().municipio());

            cliente.setEndereco(endereco);
        }

        Cliente atualizado = clienteRepository.save(cliente);
        log.info("Cliente atualizado com sucesso!");

        return clienteMapper.toResponseAtualizar(atualizado);
    }

    public void deletarCliente(Long id) {
        log.info("Deletar cliente com id: {}", id);

        if (!clienteRepository.existsById(id)) {
            throw new ClienteNaoEncontradoException("Cliente com id: " + id + " não encontrado");
        }

        clienteRepository.deleteById(id);
        log.info("Cliente deletado com sucesso, id: {}", id);
    }

    public Cliente listarclienteporid(Long id) {
        log.info("Buscando cliente por id: {}", id);
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ClienteNaoEncontradoException("Cliente não encontrado"));
    }

    public Page<ClienteResponseDTO> listarClientes(Pageable pageable) {
        log.info("Listando todos os clientes cadastrado");

        Page<Cliente> clientes = clienteRepository.findAll(pageable);
        log.info("Clientes listados: página {}, tamanho {}, total de elementos: {}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                clientes.getTotalElements());

        return clientes.map(clienteMapper::toResponse);
    }

    private String padronizar(String telefone) {
        if (telefone == null) {
            return null;
        }
        return telefone.replaceAll("\\D", "");
    }

    public Optional<ClienteResponseDTO> buscarCpfCnpj(String cpfCnpj){
        return clienteRepository.findByCpfCnpj(cpfCnpj)
                .map(clienteMapper::toResponse);
    }

    public Optional<ClienteResponseDTO> buscarPorTelefone(String telefone) {
        String telLimpo = padronizar(telefone);

        return clienteRepository.findByTelefone(telLimpo)
                .map(clienteMapper::toResponse);
    }


}
