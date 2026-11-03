package com.vdl.system.domain.model;

import com.vdl.system.domain.enumered.Cor;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "personalizacao")
public class Personalizacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Boolean ativa;

    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(
            name = "personalizacao_cores",
            joinColumns = @JoinColumn(name = "personalizacao_id")
    )
    @Column(name = "cor")
    private List<Cor> cores;

    @OneToOne
    @JoinColumn(name = "orcamento_id")
    private Orcamento orcamento;

}
