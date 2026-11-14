package com.sigsu.repository;

import com.sigsu.domain.Prioridad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrioridadRepository extends JpaRepository<Prioridad, Long> {
    List<Prioridad> findAllByOrderByNivelAsc();
}
