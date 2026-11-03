package com.vdl.system.domain.dto.orcamento;

import com.vdl.system.domain.dto.orcamentoItens.CriarOrcamentoItensRequestDTO;
import com.vdl.system.domain.enumered.Cor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CriarOrcamentoRequestDTO(
        @NotBlank(message = "O campo 'nome' não pode estar em branco!")
        String nomeCliente,
        @NotBlank(message = "O campo 'telefone' não pode estar em branco!")
        String telefone,
        List<Cor> coresPersonalizada,
        Boolean personalizacaoAtiva,
        @NotNull(message = "A lista de itens não pode ser nula!")
        @NotEmpty(message = "A lista de itens não poder estar vazia!")
        @Valid
        List<CriarOrcamentoItensRequestDTO> itens
) {
}
