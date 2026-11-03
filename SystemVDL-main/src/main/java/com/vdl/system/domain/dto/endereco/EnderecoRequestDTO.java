package com.vdl.system.domain.dto.endereco;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EnderecoRequestDTO(
        @NotBlank(message = "o campo 'rua' não pode está nulo")
        String rua,
        @NotBlank(message = "o campo 'bairro' não pode está nulo")
        String bairro,
        @NotBlank(message = "o campo 'cep' não pode está nulo")
        @Pattern(regexp = "\\d{5}-?\\d{3}", message = "'cep' inválido. use 00000-000 ou 00000000")
        String cep,
        @NotBlank(message = "o campo 'municipio' não pode está nulo")
        String municipio
) {
}
