package com.vdl.system.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ordem_entrega_item")
public class OrdemEntregaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ordem_entrega_id", nullable = false)
    private OrdemEntrega ordemEntrega;

    private Integer quantidade;

    private Double largura;
    private Double altura;
    private Double comprimento;

    private Double numeroGramatura;
    private String descricaoGramatura;

    private BigDecimal precoUnitario;
    private BigDecimal valorTotal;
}
