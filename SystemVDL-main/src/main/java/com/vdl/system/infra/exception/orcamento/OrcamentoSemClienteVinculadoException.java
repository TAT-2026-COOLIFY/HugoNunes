package com.vdl.system.infra.exception.orcamento;

public class OrcamentoSemClienteVinculadoException extends RuntimeException {
    public OrcamentoSemClienteVinculadoException(String message) {
        super(message);
    }
}
