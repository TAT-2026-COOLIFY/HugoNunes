package com.vdl.system.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vdl.system.domain.enumered.StatusOrdemCompra;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ordem_compra")
public class OrdemCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String codigo;

    private LocalDate dataCriacao;

    private String formaPagamento;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal valorTotalProduto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOrdemCompra status = StatusOrdemCompra.PENDENTE;

    @ManyToOne(optional = false)
    // AJUSTE CRÍTICO: Impede que o orçamento puxe a ordem de compra ou clientes de forma cíclica
    @JsonIgnoreProperties({"ordemCompra", "itens"})
    private Orcamento orcamento;

    @ManyToOne(optional = false)
    private Cliente cliente;

    @OneToMany(mappedBy = "ordemCompra", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("ordemCompra")
    private List<OrdemCompraItem> itens = new ArrayList<>();
}