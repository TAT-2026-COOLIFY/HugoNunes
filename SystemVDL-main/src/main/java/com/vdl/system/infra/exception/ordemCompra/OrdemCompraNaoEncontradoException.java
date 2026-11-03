package com.vdl.system.infra.exception.ordemCompra;

public class OrdemCompraNaoEncontradoException extends RuntimeException {
    public OrdemCompraNaoEncontradoException(String message) {
        super(message);
    }
}
