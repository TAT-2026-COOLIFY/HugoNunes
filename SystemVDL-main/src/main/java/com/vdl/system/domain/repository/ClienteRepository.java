package com.vdl.system.domain.repository;

import com.vdl.system.domain.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByTelefone(String telefone);

    boolean existsByTelefone(String telefone);

    Optional<Cliente> findByCpfCnpj(String cpfCnpj);

    boolean existsByCpfCnpj(String cpfCnpj);

    Optional<Cliente> findByTelefoneOrCpfCnpj(String telefone, String cpfCnpj);
}
