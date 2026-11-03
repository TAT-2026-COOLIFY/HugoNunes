package com.vdl.system.infra.exception.personalizacao;

public class QuantidadeCorMaiorQueLimiteException extends RuntimeException {
    public QuantidadeCorMaiorQueLimiteException(String message) {
        super(message);
    }
}
