package com.vdl.system.domain.dto.notaFiscal;

public record NotaFiscalResponseDTO(
        String codigoOs,
        Long blingNfeId,
        String numero,
        Integer situacao,
        String situacaoDescricao,
        String chaveAcesso,
        String linkDanfe
) {
}