package com.vdl.system.domain.dto.orcamentoItens;

import java.math.BigDecimal;

public record CriarOrcamentoItensResponseDTO(
        Long id,
        String tipoCaixa,
        Double comprimento,
        Double largura,
        Double altura,
        Long idGramatura,
        String descGramatura,
        Double numeroGramatura,
        Double valor,
        Boolean personalizada,
        BigDecimal valorQtdPequena,
        BigDecimal valorQtdMedia,
        BigDecimal valorQtdGrande
) {
}
