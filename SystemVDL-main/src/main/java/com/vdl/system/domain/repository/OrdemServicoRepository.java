package com.vdl.system.domain.repository;

import com.vdl.system.domain.model.OrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    @Query("SELECT os FROM OrdemServico os " +
            "JOIN FETCH os.ordemCompra oc " +
            "JOIN FETCH os.ordemCompraItem oci " +
            "WHERE os.ordemCompra.id = :ordemCompraId")
    List<OrdemServico> findByOrdemCompraId(@Param("ordemCompraId") Long ordemCompraId);

    @Query("SELECT os FROM OrdemServico os " +
            "JOIN FETCH os.ordemCompra oc " +
            "JOIN FETCH os.ordemCompraItem oci " +
            "WHERE os.ordemCompra.id = :id " +
            "ORDER BY os.sequencial")
    List<OrdemServico> findAllByOrdemCompraIdOrderBySequencial(@Param("id") Long id);

    boolean existsByOrdemCompraId(Long ordemCompraId);

    List<OrdemServico> findByCodigo(String codigo);
}