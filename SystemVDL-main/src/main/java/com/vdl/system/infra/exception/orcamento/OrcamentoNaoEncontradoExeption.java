package com.vdl.system.infra.exception.orcamento;

public class OrcamentoNaoEncontradoExeption extends RuntimeException {
    public OrcamentoNaoEncontradoExeption(String message) {
        super(message);
    }
}
