package com.vdl.system.domain.dto.OrdemCompraItens;

import java.math.BigDecimal;

public record OrdemCompraItemDTO(
        Long id,
        Integer quantidade,
        BigDecimal precoUnitario,
        BigDecimal valorTotal,

        Double comprimento,
        Double largura,
        Double altura
) {
}
