package com.vdl.system.domain.dto.cliente;

import com.vdl.system.domain.dto.endereco.EnderecoResponseDTO;

public record AtualizarClienteResponseDTO(
        String nomeCliente,
        String telefone,
        String cpfCnpj,
        String email,
        String inscricaoMunicipal,
        EnderecoResponseDTO endereco
) {
}
