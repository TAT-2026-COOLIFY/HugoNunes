package com.vdl.system.domain.dto.pdf;

import com.vdl.system.domain.model.OrdemCompraItem;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record OrdemCompraPdfDTO(
        String codigo,
        String nomeCliente,
        String cpfCnpj,
        String inscricaoMunicipal,
        String rua,
        String bairro,
        String cep,
        String municipio,
        String telefone,
        String email,
        LocalDate data,
        String formaPagamento,
        List<OrdemCompraItem> itens,
        BigDecimal valorTotalProduto
) {
}
