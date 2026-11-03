package com.vdl.system.domain.repository;

import com.vdl.system.domain.model.OrcamentoItens;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrcamentoItensRepository extends JpaRepository<OrcamentoItens, Long> {
    List<OrcamentoItensRepository> findByOrcamentoId(Long orcamentoId);
}
