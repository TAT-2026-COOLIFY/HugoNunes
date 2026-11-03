package com.vdl.system.domain.dto.ordemServico;

import java.util.List;

public record ConcluirProducaoRequestDTO(
        String codigo,
        List<ItemProduzidoDTO> itens
) {
}