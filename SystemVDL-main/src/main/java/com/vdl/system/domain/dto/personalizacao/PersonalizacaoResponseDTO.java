package com.vdl.system.domain.dto.personalizacao;

import com.vdl.system.domain.enumered.Cor;

import java.util.List;

public record PersonalizacaoResponseDTO(
        Boolean ativa,
        List<Cor> cores
) {
}
