package com.vdl.system.infra.exception.ordemServico;

public class OrdemServicoJaAprovadaOuRecusadaException extends RuntimeException {
    public OrdemServicoJaAprovadaOuRecusadaException(String message) {
        super(message);
    }
}
