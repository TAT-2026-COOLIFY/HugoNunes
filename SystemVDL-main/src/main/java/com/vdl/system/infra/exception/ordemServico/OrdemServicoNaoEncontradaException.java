package com.vdl.system.infra.exception.ordemServico;

public class OrdemServicoNaoEncontradaException extends RuntimeException {
    public OrdemServicoNaoEncontradaException(String message) {
        super(message);
    }
}
