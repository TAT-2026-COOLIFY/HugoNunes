package com.vdl.system.domain.dto.cliente;

import com.vdl.system.domain.dto.endereco.EnderecoResponseDTO;

public record ClienteResponseDTO(
        Long id,
        String nomeCliente,
        String telefone,
        String cpfCnpj,
        String email,

        EnderecoResponseDTO endereco,
        String inscricaoMunicipal
) {
}
