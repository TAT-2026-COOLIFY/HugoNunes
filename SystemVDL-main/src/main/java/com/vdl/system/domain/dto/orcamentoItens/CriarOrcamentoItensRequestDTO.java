package com.vdl.system.domain.dto.orcamentoItens;

import jakarta.validation.constraints.NotNull;

public record CriarOrcamentoItensRequestDTO(
        String tipoCaixa,
        @NotNull(message = "Comprimento não pode esté nulo")
        Double comprimento,
        @NotNull(message = "largura não pode esté nulo")
        Double largura,
        @NotNull(message = "Altura não pode esté nulo")
        Double altura,
        @NotNull(message = "Id gramatura não pode ser nulo")
        Long idGramatura,
        @NotNull(message = "Personalizada não pode esté nulo")
        Boolean personalizada,
        String tipoPapelao
) {
}
