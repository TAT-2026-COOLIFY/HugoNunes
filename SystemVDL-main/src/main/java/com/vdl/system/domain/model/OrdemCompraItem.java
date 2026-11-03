package com.vdl.system.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@Table(name = "ordem_compra_itens")
public class OrdemCompraItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties("itens")
    private OrdemCompra ordemCompra;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties("orcamento")
    private OrcamentoItens orcamentoItens;

    private Integer quantidade;

    private BigDecimal precoUnitario;

    private BigDecimal valorTotal;
}