package com.vdl.system.domain.repository;

import com.vdl.system.domain.model.OrdemEntrega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrdemEntregaRepository extends JpaRepository<OrdemEntrega, Long> {

    Optional<OrdemEntrega> findFirstByOrdemServicoCodigo(String codigoOs);

    List<OrdemEntrega> findByBlingNfeIdIsNotNull();
}