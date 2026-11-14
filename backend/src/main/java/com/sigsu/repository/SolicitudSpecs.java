package com.sigsu.repository;

import com.sigsu.domain.EstadoSolicitud;
import com.sigsu.domain.Solicitud;
import org.springframework.data.jpa.domain.Specification;

/** Filtros combinables para el listado de solicitudes. */
public final class SolicitudSpecs {

    private SolicitudSpecs() {
    }

    public static Specification<Solicitud> deSolicitante(Long usuarioId) {
        return (root, q, cb) -> cb.equal(root.get("solicitante").get("id"), usuarioId);
    }

    public static Specification<Solicitud> asignadaA(Long tecnicoId) {
        return (root, q, cb) -> cb.equal(root.get("tecnico").get("id"), tecnicoId);
    }

    public static Specification<Solicitud> conEstado(EstadoSolicitud estado) {
        return (root, q, cb) -> cb.equal(root.get("estado"), estado);
    }

    public static Specification<Solicitud> deCategoria(Long categoriaId) {
        return (root, q, cb) -> cb.equal(root.get("categoria").get("id"), categoriaId);
    }

    public static Specification<Solicitud> texto(String texto) {
        String patron = "%" + texto.toLowerCase().trim() + "%";
        return (root, q, cb) -> cb.or(
                cb.like(cb.lower(root.get("codigo")), patron),
                cb.like(cb.lower(root.get("descripcion")), patron),
                cb.like(cb.lower(root.get("ubicacion")), patron));
    }
}
