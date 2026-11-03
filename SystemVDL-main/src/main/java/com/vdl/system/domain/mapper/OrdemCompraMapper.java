package com.vdl.system.domain.mapper;

import com.vdl.system.domain.dto.ordemCompra.OrdemCompraResponseDTO;
import com.vdl.system.domain.model.OrdemCompra;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = OrdemCompraItensMapper.class)
public interface OrdemCompraMapper {

    @Mapping(target = "nomeCliente", source = "cliente.nomeCliente")
    @Mapping(target = "cpfCnpj", source = "cliente.cpfCnpj")
    @Mapping(target = "rua", source = "cliente.endereco.rua")
    @Mapping(target = "bairro", source = "cliente.endereco.bairro")
    @Mapping(target = "cep", source = "cliente.endereco.cep")
    @Mapping(target = "municipio", source = "cliente.endereco.municipio")
    OrdemCompraResponseDTO toResponse(OrdemCompra ordemCompra);
}