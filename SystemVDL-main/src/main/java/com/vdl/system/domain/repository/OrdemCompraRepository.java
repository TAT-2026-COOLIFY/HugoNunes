package com.vdl.system.domain.repository;

import com.vdl.system.domain.enumered.StatusOrdemCompra;
import com.vdl.system.domain.model.OrdemCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdemCompraRepository extends JpaRepository<OrdemCompra, Long> {

    boolean existsByOrcamentoId(Long orcamentoId);

    List<OrdemCompra> findByStatus(StatusOrdemCompra status);
}