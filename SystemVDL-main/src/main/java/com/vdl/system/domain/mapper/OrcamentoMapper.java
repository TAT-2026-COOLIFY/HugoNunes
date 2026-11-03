package com.vdl.system.domain.mapper;

import com.vdl.system.domain.dto.orcamento.CriarOrcamentoResponseDTO;
import com.vdl.system.domain.dto.orcamento.OrcamentoResponseDTO;
import com.vdl.system.domain.dto.personalizacao.PersonalizacaoResponseDTO;
import com.vdl.system.domain.model.Orcamento;
import com.vdl.system.domain.model.Personalizacao;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {OrcamentoItensMapper.class})
public interface OrcamentoMapper {

    @Mapping(target = "status", expression = "java(orcamento.getStatus().name())")
    @Mapping(target = "clienteVinculado", expression = "java(orcamento.getCliente() != null)")
    CriarOrcamentoResponseDTO toResponseCriar(Orcamento orcamento);

    @Mapping(target = "status", expression = "java(orcamento.getStatus().name())")
    @Mapping(target = "clienteVinculado", expression = "java(orcamento.getCliente() != null)")
    OrcamentoResponseDTO toResponse(Orcamento orcamento);

    PersonalizacaoResponseDTO toPersonalizacaoResponse(Personalizacao personalizacao);
}
