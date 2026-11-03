package com.vdl.system.domain.dto.ordemCompra;

import com.vdl.system.domain.dto.OrdemCompraItens.OrdemCompraItemDTO;
import com.vdl.system.domain.model.OrdemCompraItem;

import java.util.List;

public record OrdemCompraResponseDTO(
        String codigo,
        String nomeCliente,
        String cpfCnpj,
        String formaPagamento,
        Long id,
        String status,
        String inscricaoMunicipal,
        String rua,
        String bairro,
        String cep,
        String municipio,
        String telefone,
        String email,
        List<OrdemCompraItemDTO> itens
) {
}
