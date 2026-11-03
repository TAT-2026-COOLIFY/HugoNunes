package com.vdl.system.domain.repository;

import com.vdl.system.domain.enumered.StatusOrcamento;
import com.vdl.system.domain.model.Orcamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {
    Page<Orcamento> findAllByOrderByIdDesc(Pageable pageable);

    Page<Orcamento> findByStatus(StatusOrcamento status, Pageable pageable);

    List<Orcamento> findByClienteId(Long clienteId);
}
