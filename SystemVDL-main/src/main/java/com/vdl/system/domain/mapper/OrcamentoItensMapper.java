package com.vdl.system.domain.mapper;

import com.vdl.system.domain.dto.orcamentoItens.CriarOrcamentoItensResponseDTO;
import com.vdl.system.domain.model.OrcamentoItens;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrcamentoItensMapper {

    @Mapping(source = "gramatura.id", target = "idGramatura")
    @Mapping(source = "gramatura.descGramatura", target = "descGramatura")
    @Mapping(source = "gramatura.numeroGramatura", target = "numeroGramatura")
    @Mapping(source = "gramatura.valor", target = "valor")
    CriarOrcamentoItensResponseDTO toResponse(OrcamentoItens itens);
}
