package com.sigsu.domain;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/** Pruebas unitarias del cálculo de solicitudes vencidas (HU-15). */
class SolicitudTest {

    private final Prioridad alta = new Prioridad("Alta", 24, 3);
    private final Categoria categoria = new Categoria("Mantenimiento", new Area("Mantenimiento"));
    private final Usuario usuario = new Usuario("Ana", "ana@uni.edu.pe", "hash", "Estudiante", Rol.ESTUDIANTE);

    private Solicitud registradaHace(long horas) {
        Solicitud s = new Solicitud(usuario, categoria, alta, "Aula 101", "Descripción suficientemente larga");
        s.setFechaRegistro(Instant.now().minus(Duration.ofHours(horas)));
        return s;
    }

    @Test
    void abiertaQueSuperaElTiempoMaximoEstaVencida() {
        assertThat(registradaHace(30).estaVencida(Instant.now())).isTrue();
    }

    @Test
    void abiertaDentroDelTiempoNoEstaVencida() {
        assertThat(registradaHace(10).estaVencida(Instant.now())).isFalse();
    }

    @Test
    void resueltaNuncaEstaVencida() {
        Solicitud s = registradaHace(100);
        s.setEstado(EstadoSolicitud.RESUELTA);
        assertThat(s.estaVencida(Instant.now())).isFalse();
    }
}
