package com.vdl.system.domain.dto.cliente;

import com.vdl.system.domain.dto.endereco.EnderecoResponseDTO;
import jakarta.validation.Valid;

public record AtualizarClienteRequestDTO(
        String nomeCliente,
        String telefone,
        String cpfCnpj,
        String email,
        String inscricaoMunicipal,
        @Valid
        EnderecoResponseDTO endereco
) {
}
