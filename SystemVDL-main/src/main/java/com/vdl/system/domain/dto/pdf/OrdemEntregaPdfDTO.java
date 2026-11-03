package com.vdl.system.domain.dto.pdf;

import com.vdl.system.domain.model.OrdemEntregaItem;

import java.time.LocalDate;
import java.util.List;

public record OrdemEntregaPdfDTO(
        String codigo,
        String nomeCliente,
        String cpfCnpj,
        String inscricaoMunicipal,
        String endereco,
        String telefone,
        String email,
        LocalDate dataEntrega,
        List<OrdemEntregaItem> itens
) {
}
