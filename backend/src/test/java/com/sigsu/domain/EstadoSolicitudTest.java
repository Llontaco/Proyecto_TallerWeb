package com.sigsu.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/** Pruebas unitarias del flujo de estados (HU-11). */
class EstadoSolicitudTest {

    @ParameterizedTest(name = "{0} -> {1} por {2}: {3}")
    @CsvSource({
            "REGISTRADA,    EN_EVALUACION, SUPERVISOR, true",
            "REGISTRADA,    EN_EVALUACION, ESTUDIANTE, false",
            "ASIGNADA,      EN_ATENCION,   TECNICO,    true",
            "ASIGNADA,      EN_ATENCION,   SUPERVISOR, false",
            "EN_ATENCION,   RESUELTA,      TECNICO,    true",
            "RESUELTA,      CERRADA,       ESTUDIANTE, true",
            "RESUELTA,      EN_ATENCION,   SUPERVISOR, true",
            "RESUELTA,      EN_ATENCION,   ESTUDIANTE, false",
            "REGISTRADA,    RESUELTA,      ADMIN,      false",
            "CERRADA,       REGISTRADA,    ADMIN,      false"
    })
    void validaTransicionesPorRol(EstadoSolicitud desde, EstadoSolicitud hacia, Rol rol, boolean esperado) {
        assertThat(desde.rolPuedeCambiarA(hacia, rol)).isEqualTo(esperado);
    }

    @Test
    void asignadaSoloSeAlcanzaPorAsignacion() {
        assertThat(EstadoSolicitud.EN_EVALUACION.transicionExiste(EstadoSolicitud.ASIGNADA)).isFalse();
        assertThat(EstadoSolicitud.EN_EVALUACION.admiteAsignacion()).isTrue();
        assertThat(EstadoSolicitud.REGISTRADA.admiteAsignacion()).isFalse();
    }

    @Test
    void resueltaYCerradaNoEstanAbiertas() {
        assertThat(EstadoSolicitud.RESUELTA.estaAbierta()).isFalse();
        assertThat(EstadoSolicitud.CERRADA.estaAbierta()).isFalse();
        assertThat(EstadoSolicitud.EN_ATENCION.estaAbierta()).isTrue();
    }
}
