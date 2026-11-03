package com.vdl.system.domain.mapper;

import com.vdl.system.domain.dto.cliente.AtualizarClienteResponseDTO;
import com.vdl.system.domain.dto.cliente.ClienteRequestDTO;
import com.vdl.system.domain.dto.cliente.ClienteResponseDTO;
import com.vdl.system.domain.model.Cliente;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ClienteMapper {

    ClienteResponseDTO toResponse(Cliente cliente);

    AtualizarClienteResponseDTO toResponseAtualizar(Cliente cliente);

    Cliente toEntity(ClienteRequestDTO clienteRequestDTO);
}