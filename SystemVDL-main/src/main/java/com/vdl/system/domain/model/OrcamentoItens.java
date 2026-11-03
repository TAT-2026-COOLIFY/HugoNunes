package com.vdl.system.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrcamentoItens {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "orcamento_id")
    @JsonIgnore
    private Orcamento orcamento;

    private String tipoCaixa;

    private Double Comprimento;
    private Double Largura;
    private Double Altura;

    @ManyToOne(optional = false)
    private Gramatura gramatura;

    private Boolean personalizada;

    private String tipoPapelao;

    private BigDecimal valorQtdPequena;
    private BigDecimal valorQtdMedia;
    private BigDecimal valorQtdGrande;
}
