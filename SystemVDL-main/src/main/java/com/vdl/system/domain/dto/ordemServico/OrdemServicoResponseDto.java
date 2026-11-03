package com.vdl.system.domain.dto.ordemServico;

import com.vdl.system.domain.model.OrdemCompraItem;

import java.util.List;

public record OrdemServicoResponseDto(
        String nomeCliente,
        String cpfCnpj,
        String inscricaoMunicipal,
        String rua,
        String bairro,
        String cep,
        String municipio,
        String telefone,
        String email,
        List<OrdemCompraItem> itens
) {
}
