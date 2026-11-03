package com.vdl.system.services;

import com.vdl.system.domain.model.OrcamentoItens;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PrazoEntregaService {

    public int calcularPrazoDiasUteis(List<OrcamentoItens> itens) {
        if (itens == null || itens.isEmpty()) {
            return 10; // Prazo padrão caso a lista esteja vazia ou nula
        }

        boolean temKraft = itens.stream()
                .filter(item -> item != null && item.getGramatura() != null) // Filtra nulos com segurança
                .map(OrcamentoItens::getGramatura)
                .anyMatch(g ->
                        g.getDescGramatura() != null &&
                                g.getDescGramatura().toLowerCase().contains("kraft")
                );

        return temKraft ? 15 : 10;
    }
}