package com.vdl.system.infra.exception.ordemServico;

public class OrdemServicoVaziaException extends RuntimeException {
    public OrdemServicoVaziaException(String message) {
        super(message);
    }
}
