package com.vdl.system.domain.mapper;

import com.vdl.system.domain.dto.OrdemCompraItens.OrdemCompraItemDTO;
import com.vdl.system.domain.model.OrdemCompraItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrdemCompraItensMapper {

    @Mapping(target = "comprimento", source = "orcamentoItens.comprimento")
    @Mapping(target = "largura", source = "orcamentoItens.largura")
    @Mapping(target = "altura", source = "orcamentoItens.altura")
    OrdemCompraItemDTO toResponse(OrdemCompraItem ordemCompraItem);
}