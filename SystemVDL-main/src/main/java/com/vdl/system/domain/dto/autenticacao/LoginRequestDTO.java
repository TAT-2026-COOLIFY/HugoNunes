package com.vdl.system.domain.dto.autenticacao;

public record LoginRequestDTO(
        String username,
        String password
) {}
