package com.sigsu.repository;

import com.sigsu.domain.Area;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AreaRepository extends JpaRepository<Area, Long> {
    boolean existsByNombreIgnoreCase(String nombre);
}
