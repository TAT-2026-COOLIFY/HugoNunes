package com.vdl.system.infra.exception.ordemServico;

public class OrdemServicoNaoEstaEmProducaoException extends RuntimeException {
    public OrdemServicoNaoEstaEmProducaoException(String message) {
        super(message);
    }
}
