package com.vdl.system.domain.dto.endereco;

public record EnderecoResponseDTO(
        String rua,
        String bairro,
        String cep,
        String municipio
) {
}
