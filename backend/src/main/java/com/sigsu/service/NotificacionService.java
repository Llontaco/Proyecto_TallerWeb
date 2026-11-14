package com.sigsu.service;

import com.sigsu.domain.Notificacion;
import com.sigsu.domain.Rol;
import com.sigsu.domain.Solicitud;
import com.sigsu.domain.Usuario;
import com.sigsu.dto.NotificacionDtos.BandejaDto;
import com.sigsu.dto.NotificacionDtos.NotificacionDto;
import com.sigsu.exception.ApiException;
import com.sigsu.repository.NotificacionRepository;
import com.sigsu.repository.UsuarioRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

/**
 * Crea avisos dentro de la aplicación y publica un evento para el envío opcional por correo
 * (el correo se manda después del commit, ver NotificacionCorreoListener).
 */
@Service
public class NotificacionService {

    private static final int MAXIMO_BANDEJA = 20;

    private final NotificacionRepository notificaciones;
    private final UsuarioRepository usuarios;
    private final ApplicationEventPublisher eventos;

    public NotificacionService(NotificacionRepository notificaciones, UsuarioRepository usuarios,
                               ApplicationEventPublisher eventos) {
        this.notificaciones = notificaciones;
        this.usuarios = usuarios;
        this.eventos = eventos;
    }

    /** Evento que escucha el envío de correo. */
    public record NotificacionCreada(String correo, String nombre, String mensaje, Long solicitudId) {
    }

    /** Notifica a cada destinatario una sola vez, excepto a quien hizo la acción. */
    @Transactional
    public void notificar(Collection<Usuario> destinatarios, Long actorId, Solicitud solicitud, String mensaje) {
        Set<Usuario> unicos = new LinkedHashSet<>();
        destinatarios.stream().filter(Objects::nonNull)
                .filter(u -> !u.getId().equals(actorId))
                .filter(u -> unicos.stream().noneMatch(x -> x.getId().equals(u.getId())))
                .forEach(unicos::add);
        for (Usuario u : unicos) {
            notificaciones.save(new Notificacion(u, solicitud, mensaje));
            eventos.publishEvent(new NotificacionCreada(u.getCorreo(), u.getNombre(), mensaje, solicitud.getId()));
        }
    }

    @Transactional
    public void notificarSupervisores(Long actorId, Solicitud solicitud, String mensaje) {
        notificar(usuarios.findByRolAndActivoTrueOrderByNombreAsc(Rol.SUPERVISOR), actorId, solicitud, mensaje);
    }

    @Transactional(readOnly = true)
    public BandejaDto bandeja(Long usuarioId) {
        return new BandejaDto(notificaciones.countByUsuarioIdAndLeidaFalse(usuarioId),
                notificaciones.findByUsuarioIdOrderByFechaDesc(usuarioId, PageRequest.of(0, MAXIMO_BANDEJA))
                        .stream().map(NotificacionDto::de).toList());
    }

    @Transactional
    public void marcarLeida(Long usuarioId, Long notificacionId) {
        notificaciones.findByIdAndUsuarioId(notificacionId, usuarioId)
                .orElseThrow(() -> ApiException.noEncontrado("Notificación no encontrada"))
                .marcarLeida();
    }

    @Transactional
    public int marcarTodasLeidas(Long usuarioId) {
        return notificaciones.marcarTodasLeidas(usuarioId);
    }
}
