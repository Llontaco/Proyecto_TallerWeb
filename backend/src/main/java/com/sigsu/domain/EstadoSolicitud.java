package com.sigsu.domain;

import java.util.Map;
import java.util.Set;

/**
 * Ciclo de vida de una solicitud:
 * Registrada → En evaluación → Asignada → En atención → Resuelta → Cerrada.
 * Las transiciones y los roles que pueden ejecutarlas están definidos aquí, en un solo lugar.
 */
public enum EstadoSolicitud {
    REGISTRADA("Registrada"),
    EN_EVALUACION("En evaluación"),
    ASIGNADA("Asignada"),
    EN_ATENCION("En atención"),
    RESUELTA("Resuelta"),
    CERRADA("Cerrada");

    private final String etiqueta;

    EstadoSolicitud(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    /** Transiciones manuales permitidas. ASIGNADA solo se alcanza mediante la asignación de responsable. */
    private static final Map<EstadoSolicitud, Map<EstadoSolicitud, Set<Rol>>> TRANSICIONES = Map.of(
            REGISTRADA, Map.of(EN_EVALUACION, Set.of(Rol.SUPERVISOR, Rol.ADMIN)),
            EN_EVALUACION, Map.of(),
            ASIGNADA, Map.of(EN_ATENCION, Set.of(Rol.TECNICO)),
            EN_ATENCION, Map.of(RESUELTA, Set.of(Rol.TECNICO)),
            RESUELTA, Map.of(
                    CERRADA, Set.of(Rol.ESTUDIANTE, Rol.SUPERVISOR, Rol.ADMIN),
                    EN_ATENCION, Set.of(Rol.SUPERVISOR, Rol.ADMIN)),
            CERRADA, Map.of()
    );

    public boolean transicionExiste(EstadoSolicitud destino) {
        return TRANSICIONES.get(this).containsKey(destino);
    }

    public boolean rolPuedeCambiarA(EstadoSolicitud destino, Rol rol) {
        return transicionExiste(destino) && TRANSICIONES.get(this).get(destino).contains(rol);
    }

    public Set<EstadoSolicitud> destinosPosibles() {
        return TRANSICIONES.get(this).keySet();
    }

    public boolean estaAbierta() {
        return this != RESUELTA && this != CERRADA;
    }

    public boolean admiteAsignacion() {
        return this == EN_EVALUACION || this == ASIGNADA;
    }
}
