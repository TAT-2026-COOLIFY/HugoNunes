package com.vdl.system.domain.repository;

import com.vdl.system.domain.model.BlingToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlingTokenRepository extends JpaRepository<BlingToken, Long> {
}