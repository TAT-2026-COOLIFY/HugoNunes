package com.vdl.system.domain.dto.cliente;

import com.vdl.system.domain.model.Cliente;

public record ClienteJaExistenteDTO(
        Cliente cliente,
        boolean jaExistente
) {
}
