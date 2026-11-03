package com.vdl.system.domain.repository;

import com.vdl.system.domain.model.OrdemCompraItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdemCompraItensRepository extends JpaRepository<OrdemCompraItem, Long> {
}
