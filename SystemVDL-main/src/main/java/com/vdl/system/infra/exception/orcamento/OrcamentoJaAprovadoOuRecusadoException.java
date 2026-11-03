package com.vdl.system.infra.exception.orcamento;

public class OrcamentoJaAprovadoOuRecusadoException extends RuntimeException{
    public OrcamentoJaAprovadoOuRecusadoException(String message){
        super(message);
    }
}
