package com.sigsu.repository;

import com.sigsu.domain.Solicitud;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface SolicitudRepository extends JpaRepository<Solicitud, Long>, JpaSpecificationExecutor<Solicitud> {

    /** Carga las relaciones de la vista de lista en una sola consulta (evita N+1). */
    @Override
    @EntityGraph(attributePaths = {"solicitante", "tecnico", "categoria", "categoria.area", "prioridad"})
    List<Solicitud> findAll(Specification<Solicitud> spec, Sort sort);

    @Override
    @EntityGraph(attributePaths = {"solicitante", "tecnico", "categoria", "prioridad"})
    List<Solicitud> findAll();

    boolean existsByCategoriaId(Long categoriaId);
}
