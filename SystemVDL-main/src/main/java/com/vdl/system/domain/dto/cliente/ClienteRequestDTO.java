package com.vdl.system.domain.dto.cliente;

import com.vdl.system.domain.dto.endereco.EnderecoRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRequestDTO(

        @NotBlank(message = "O campo 'cpfCnpj' não pode está nulo")
        String cpfCnpj,
        @Email(message = "Coloque um email válido")
        String email,
        @Size(max = 20, message = "A 'inscricaoMunicipal' está inválida")
        String inscricaoMunicipal,
        @Valid
        EnderecoRequestDTO endereco
) {
}
