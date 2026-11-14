package com.sigsu.dto;

import com.sigsu.domain.Area;
import com.sigsu.domain.Categoria;
import com.sigsu.domain.EstadoSolicitud;
import com.sigsu.domain.Prioridad;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class CatalogoDtos {

    private CatalogoDtos() {
    }

    public record CategoriaDto(Long id, String nombre, Long areaId, String area, boolean activa) {
        public static CategoriaDto de(Categoria c) {
            return new CategoriaDto(c.getId(), c.getNombre(), c.getArea().getId(), c.getArea().getNombre(), c.isActiva());
        }
    }

    public record CategoriaRequest(
            @NotBlank(message = "Ingresa un nombre")
            @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres") String nombre,
            @NotNull(message = "Selecciona un área") Long areaId,
            Boolean activa) {
    }

    public record PrioridadDto(Long id, String nombre, int horasMaximas, int nivel) {
        public static PrioridadDto de(Prioridad p) {
            return new PrioridadDto(p.getId(), p.getNombre(), p.getHorasMaximas(), p.getNivel());
        }
    }

    public record PrioridadRequest(
            @NotNull(message = "Indica las horas máximas")
            @Min(value = 1, message = "Mínimo 1 hora")
            @Max(value = 720, message = "Máximo 720 horas") Integer horasMaximas) {
    }

    public record AreaDto(Long id, String nombre) {
        public static AreaDto de(Area a) {
            return new AreaDto(a.getId(), a.getNombre());
        }
    }

    public record AreaRequest(
            @NotBlank(message = "Ingresa un nombre")
            @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres") String nombre) {
    }

    public record EstadoDto(EstadoSolicitud valor, String etiqueta) {
        public static EstadoDto de(EstadoSolicitud e) {
            return new EstadoDto(e, e.getEtiqueta());
        }
    }

    public record CatalogosDto(List<CategoriaDto> categorias, List<PrioridadDto> prioridades,
                               List<AreaDto> areas, List<EstadoDto> estados) {
    }
}
