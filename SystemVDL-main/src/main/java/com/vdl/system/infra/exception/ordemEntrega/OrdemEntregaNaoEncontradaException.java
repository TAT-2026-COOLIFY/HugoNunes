package com.vdl.system.infra.exception.ordemEntrega;

public class OrdemEntregaNaoEncontradaException extends RuntimeException {
    public OrdemEntregaNaoEncontradaException(String message) {
        super(message);
    }
}
