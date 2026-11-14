package com.sigsu.service;

import com.sigsu.domain.*;
import com.sigsu.security.UsuarioAutenticado;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/** Quién puede ver, editar y eliminar una solicitud (control de acceso, OWASP A01). */
class ReglasAccesoTest {

    private Usuario ana, otro, tecnico;
    private Solicitud solicitud;

    private static Usuario usuario(long id, Rol rol) {
        Usuario u = new Usuario("U" + id, "u" + id + "@uni.edu.pe", "hash", "Estudiante", rol);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private static UsuarioAutenticado sesion(Usuario u) {
        return UsuarioAutenticado.de(u);
    }

    @BeforeEach
    void preparar() {
        ana = usuario(1, Rol.ESTUDIANTE);
        otro = usuario(2, Rol.ESTUDIANTE);
        tecnico = usuario(3, Rol.TECNICO);
        solicitud = new Solicitud(ana, new Categoria("Mantenimiento", new Area("Mant")),
                new Prioridad("Alta", 24, 3), "Aula 101", "Descripción suficientemente larga");
        solicitud.setFechaRegistro(Instant.parse("2026-11-01T10:00:00Z"));
        ReflectionTestUtils.setField(solicitud, "id", 9L);
    }

    @Test
    void elEstudianteSoloVeSusSolicitudes() {
        assertThat(SolicitudService.puedeVer(sesion(ana), solicitud)).isTrue();
        assertThat(SolicitudService.puedeVer(sesion(otro), solicitud)).isFalse();
    }

    @Test
    void elTecnicoSoloVeLasQueTieneAsignadas() {
        assertThat(SolicitudService.puedeVer(sesion(tecnico), solicitud)).isFalse();
        solicitud.setTecnico(tecnico);
        assertThat(SolicitudService.puedeVer(sesion(tecnico), solicitud)).isTrue();
    }

    @Test
    void supervisorYAdministradorVenTodas() {
        assertThat(SolicitudService.puedeVer(sesion(usuario(4, Rol.SUPERVISOR)), solicitud)).isTrue();
        assertThat(SolicitudService.puedeVer(sesion(usuario(5, Rol.ADMIN)), solicitud)).isTrue();
    }

    @Test
    void soloElDuenoEditaYSoloMientrasEstaRegistrada() {
        assertThat(SolicitudService.puedeEditar(sesion(ana), solicitud)).isTrue();
        assertThat(SolicitudService.puedeEditar(sesion(otro), solicitud)).isFalse();
        solicitud.setEstado(EstadoSolicitud.EN_EVALUACION);
        assertThat(SolicitudService.puedeEditar(sesion(ana), solicitud)).isFalse();
    }

    @Test
    void elAdministradorPuedeEliminarUnaRegistradaAjena() {
        assertThat(SolicitudService.puedeEliminar(sesion(usuario(5, Rol.ADMIN)), solicitud)).isTrue();
        assertThat(SolicitudService.puedeEliminar(sesion(usuario(4, Rol.SUPERVISOR)), solicitud)).isFalse();
    }

    @Test
    void noSeAdjuntaEnUnaCerrada() {
        solicitud.setEstado(EstadoSolicitud.CERRADA);
        assertThat(SolicitudService.puedeAdjuntar(sesion(ana), solicitud)).isFalse();
    }

    @Test
    void elCodigoUsaElAnioYCincoDigitos() {
        assertThat(SolicitudService.generarCodigo(solicitud)).isEqualTo("SOL-2026-00009");
    }
}
