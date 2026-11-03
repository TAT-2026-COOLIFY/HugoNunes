package com.vdl.system.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
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
@Table(name = "gramaturas")
public class Gramatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("desc_gramatura")
    @Column(name = "desc_gramatura", nullable = false)
    private String descGramatura;

    @Column(name = "numero_gramatura", nullable = false)
    private Double numeroGramatura;

    @Column(name = "valor", nullable = false)
    private Double valor;
}
