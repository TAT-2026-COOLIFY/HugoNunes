package com.vdl.system.infra.exception.ordemServico;

public class OrdemServicoNaoEstaoEmConcluidaException extends RuntimeException {
    public OrdemServicoNaoEstaoEmConcluidaException(String message) {
        super(message);
    }
}
