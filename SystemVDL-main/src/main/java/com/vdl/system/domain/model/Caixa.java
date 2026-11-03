package com.vdl.system.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "caixas")
public class Caixa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipoCaixa;  //maleta ou xxxx

    private Integer quantidade;

    private Double comprimento;

    private Double largura;

    private Double altura;

    private Boolean personalizada;

    private String tipoPapelao;

    @ManyToOne
    private Gramatura gramatura;

    @ManyToOne
    private Cliente cliente;

    @ManyToOne
    private OrdemCompraItem ordemCompraItem;
}
