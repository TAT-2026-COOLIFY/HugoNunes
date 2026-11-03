package com.vdl.system.infra.exception.orcamento;

public class OrcamentoNaoAprovadoException extends RuntimeException {
    public OrcamentoNaoAprovadoException(String message) {
        super(message);
    }
}
