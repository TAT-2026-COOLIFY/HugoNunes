package com.vdl.system.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vdl.system.domain.enumered.StatusProducao;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

import java.time.LocalDate;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ordem_servico")
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigo;

    private Integer sequencial;

    @ManyToOne(optional = false)
    // Impedir que a ordem de compra puxe dados cíclicos desnecessários na produção
    @JsonIgnoreProperties({"itens", "orcamento"})
    private OrdemCompra ordemCompra;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties({"ordemCompra"})
    private OrdemCompraItem ordemCompraItem;

    @Column(nullable = false)
    private Integer quantidade;

    private Integer quantidadeProduzida;

    @Column(precision = 15, scale = 2)
    private BigDecimal valorTotalFinal;

    private LocalDate dataCriacao;

    private LocalDate prazoMaximoEntrega;

    @Enumerated(EnumType.STRING)
    private StatusProducao statusProducao;
}