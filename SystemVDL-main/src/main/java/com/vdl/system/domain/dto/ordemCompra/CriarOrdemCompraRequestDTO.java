package com.vdl.system.domain.dto.ordemCompra;

import com.vdl.system.domain.dto.OrdemCompraItens.CriarOrdemCompraItemRequestDTO;

import java.util.List;

public record CriarOrdemCompraRequestDTO(
        String formaPagamento,
        List<CriarOrdemCompraItemRequestDTO> itens
) {
}
