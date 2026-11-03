package com.vdl.system.domain.model;

import com.vdl.system.domain.enumered.StatusOrcamento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "orcamentos")
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String codigo;

    private String nomeCliente;

    private String telefone;

    private LocalDate dataCriacaoOcr;

    private StatusOrcamento status;

    private boolean ordemCompraCriada = false;

    @ManyToOne
    private Cliente cliente;

    @OneToOne(mappedBy = "orcamento", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private Personalizacao personalizacao;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrcamentoItens> itens = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.dataCriacaoOcr == null) {
            this.dataCriacaoOcr = LocalDate.now();
        }
    }
}