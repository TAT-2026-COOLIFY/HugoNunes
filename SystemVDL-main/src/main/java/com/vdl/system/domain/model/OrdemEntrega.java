package com.vdl.system.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vdl.system.domain.enumered.StatusProducao;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ordem_entrega")
public class OrdemEntrega {

    @CreationTimestamp
    LocalDate dataEntrega;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String codigo;

    @Enumerated(EnumType.STRING)
    private StatusProducao statusOrdemEntrega;

    @OneToOne
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    // Impede o travamento entre o vínculo bilateral da OS e OE
    @JsonIgnoreProperties("ordemCompra")
    private OrdemServico ordemServico;

    private Long blingNfeId;
    private String numeroNotaFiscal;
    private Integer situacaoNotaFiscal;
    private String chaveAcesso;
    @Column(length = 500)
    private String linkDanfe;

    @OneToMany(mappedBy = "ordemEntrega", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("ordemEntrega")
    private List<OrdemEntregaItem> itens = new ArrayList<>();

}