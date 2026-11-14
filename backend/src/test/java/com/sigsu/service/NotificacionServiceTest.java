package com.sigsu.service;

import com.sigsu.domain.*;
import com.sigsu.repository.NotificacionRepository;
import com.sigsu.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** HU-13: cada destinatario recibe un aviso, nunca quien hizo la acción ni dos veces la misma persona. */
@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock NotificacionRepository repo;
    @Mock UsuarioRepository usuarios;
    @Mock ApplicationEventPublisher eventos;
    @InjectMocks NotificacionService servicio;

    private static Usuario usuario(long id, Rol rol) {
        Usuario u = new Usuario("U" + id, "u" + id + "@uni.edu.pe", "hash", "Estudiante", rol);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private final Usuario ana = usuario(1, Rol.ESTUDIANTE);
    private final Usuario luis = usuario(2, Rol.TECNICO);
    private final Solicitud solicitud = new Solicitud(ana, new Categoria("C", new Area("A")),
            new Prioridad("Alta", 24, 3), "Aula", "Descripción suficientemente larga");

    @Test
    void noNotificaAQuienHizoLaAccionNiDuplica() {
        servicio.notificar(List.of(ana, luis, ana), luis.getId(), solicitud, "La solicitud pasó a Resuelta");

        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(repo, times(1)).save(captor.capture());
        assertThat(captor.getValue().getUsuario()).isSameAs(ana);
        assertThat(captor.getValue().getMensaje()).isEqualTo("La solicitud pasó a Resuelta");
        verify(eventos, times(1)).publishEvent(any(NotificacionService.NotificacionCreada.class));
    }

    @Test
    void notificaATodosLosSupervisoresActivos() {
        Usuario s1 = usuario(10, Rol.SUPERVISOR), s2 = usuario(11, Rol.SUPERVISOR);
        when(usuarios.findByRolAndActivoTrueOrderByNombreAsc(Rol.SUPERVISOR)).thenReturn(List.of(s1, s2));

        servicio.notificarSupervisores(ana.getId(), solicitud, "Nueva solicitud por evaluar");

        verify(repo, times(2)).save(any(Notificacion.class));
    }
}
