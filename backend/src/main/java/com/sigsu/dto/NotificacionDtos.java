package com.sigsu.dto;

import com.sigsu.domain.Notificacion;

import java.time.Instant;
import java.util.List;

public final class NotificacionDtos {

    private NotificacionDtos() {
    }

    public record NotificacionDto(Long id, String mensaje, Long solicitudId, String codigo, boolean leida, Instant fecha) {
        public static NotificacionDto de(Notificacion n) {
            return new NotificacionDto(n.getId(), n.getMensaje(),
                    n.getSolicitud() == null ? null : n.getSolicitud().getId(),
                    n.getSolicitud() == null ? null : n.getSolicitud().getCodigo(),
                    n.isLeida(), n.getFecha());
        }
    }

    public record BandejaDto(long noLeidas, List<NotificacionDto> items) {
    }
}
