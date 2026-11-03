package com.vdl.system.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeCliente;

    private String telefone;

    @Column(name = "cpf_cnpj", unique = true, length = 18)
    private String cpfCnpj;

    private String email;

    private String inscricaoMunicipal;

    @Embedded
    private Endereco endereco;
}
