package com.vdl.system.infra.exception.orcamento;

public class OrcamentoNaoPodeSerEditadoException extends RuntimeException {
    public OrcamentoNaoPodeSerEditadoException(String message) {
        super(message);
    }
}
