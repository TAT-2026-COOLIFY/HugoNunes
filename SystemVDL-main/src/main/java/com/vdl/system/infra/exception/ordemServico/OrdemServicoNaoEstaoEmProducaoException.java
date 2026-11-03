package com.vdl.system.infra.exception.ordemServico;

public class OrdemServicoNaoEstaoEmProducaoException extends RuntimeException {
    public OrdemServicoNaoEstaoEmProducaoException(String message) {
        super(message);
    }
}
