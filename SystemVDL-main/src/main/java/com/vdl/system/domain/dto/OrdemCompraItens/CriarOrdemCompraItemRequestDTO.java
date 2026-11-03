package com.vdl.system.domain.dto.OrdemCompraItens;

import jakarta.validation.constraints.NotNull;

public record CriarOrdemCompraItemRequestDTO(
        @NotNull
        Long orcamentoItemId,
        @NotNull
        Integer quantidade
) {
}
