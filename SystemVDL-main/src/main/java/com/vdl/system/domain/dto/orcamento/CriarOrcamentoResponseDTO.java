package com.vdl.system.domain.dto.orcamento;

import com.vdl.system.domain.dto.orcamentoItens.CriarOrcamentoItensResponseDTO;

import java.util.List;

public record CriarOrcamentoResponseDTO(
        Long id,
        String codigo,
        String nomeCliente,
        String telefone,
        String status,
        boolean clienteVinculado,
        boolean ordemCompraCriada,
        List<CriarOrcamentoItensResponseDTO> itens
) {
}
