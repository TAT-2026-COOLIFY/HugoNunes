    package com.vdl.system.domain.dto.orcamento;

    import com.vdl.system.domain.dto.orcamentoItens.CriarOrcamentoItensResponseDTO;
    import com.vdl.system.domain.dto.personalizacao.PersonalizacaoResponseDTO;

    import java.util.List;

    public record OrcamentoResponseDTO(
            Long id,
            String codigo,
            String nomeCliente,
            String telefone,
            String status,
            Boolean clienteVinculado,
            List<CriarOrcamentoItensResponseDTO> itens,
            boolean ordemCompraCriada,
            PersonalizacaoResponseDTO personalizacao
    ) {
    }
