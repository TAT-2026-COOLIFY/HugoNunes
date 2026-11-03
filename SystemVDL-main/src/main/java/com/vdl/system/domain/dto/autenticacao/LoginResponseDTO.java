package com.vdl.system.domain.dto.autenticacao;

public record LoginResponseDTO(
        String token,
        String username
) {}
