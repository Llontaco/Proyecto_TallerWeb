package com.sigsu.dto;

import com.sigsu.domain.EstadoSolicitud;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class SolicitudDtos {

    private SolicitudDtos() {
    }

    public record SolicitudRequest(
            @NotNull(message = "Selecciona una categoría") Long categoriaId,
            @NotNull(message = "Selecciona una prioridad") Long prioridadId,
            @NotBlank(message = "Indica la ubicación")
            @Size(min = 3, max = 150, message = "La ubicación debe tener entre 3 y 150 caracteres") String ubicacion,
            @NotBlank(message = "Describe el problema")
            @Size(min = 20, max = 1000, message = "Describe el problema con al menos 20 caracteres (máximo 1000)") String descripcion) {
    }

    public record CambioEstadoRequest(
            @NotNull(message = "Indica el nuevo estado") EstadoSolicitud estado,
            @Size(max = 500, message = "Máximo 500 caracteres") String comentario) {
    }

    public record AsignacionRequest(
            @NotNull(message = "Selecciona un técnico") Long tecnicoId,
            Long prioridadId) {
    }

    public record ComentarioRequest(
            @NotBlank(message = "Escribe un comentario")
            @Size(max = 500, message = "Máximo 500 caracteres") String texto) {
    }

    public record SolicitudResumenDto(Long id, String codigo, String categoria, String area, String prioridad,
                                      int prioridadNivel, EstadoSolicitud estado, String estadoEtiqueta,
                                      String ubicacion, String solicitante, String tecnico,
                                      Instant fechaRegistro, boolean vencida, Instant fechaLimite) {
    }

    public record ComentarioDto(Long id, String autor, String texto, Instant fecha) {
    }

    public record HistorialDto(Long id, String usuario, EstadoSolicitud estadoAnterior, EstadoSolicitud estadoNuevo,
                               String accion, Instant fecha) {
    }

    public record EvidenciaDto(Long id, String nombre, String contentType, long tamanoBytes, Instant fecha) {
    }

    public record TransicionDto(EstadoSolicitud estado, String etiqueta) {
    }

    /** Qué puede hacer el usuario actual con esta solicitud; el frontend solo muestra estos botones. */
    public record AccionesDto(List<TransicionDto> transiciones, boolean puedeAsignar, boolean puedeEditar,
                              boolean puedeEliminar, boolean puedeComentar, boolean puedeAdjuntar) {
    }

    public record SolicitudDetalleDto(Long id, String codigo, Long categoriaId, String categoria, String area,
                                      Long prioridadId, String prioridad, int horasMaximas,
                                      EstadoSolicitud estado, String estadoEtiqueta,
                                      String ubicacion, String descripcion,
                                      Long solicitanteId, String solicitante, Long tecnicoId, String tecnico,
                                      Instant fechaRegistro, Instant fechaActualizacion, Instant fechaResolucion,
                                      boolean vencida, List<ComentarioDto> comentarios, List<HistorialDto> historial,
                                      List<EvidenciaDto> evidencias, AccionesDto acciones) {
    }
}
