package com.sigsu.dto;

import com.sigsu.domain.Rol;
import com.sigsu.domain.Usuario;

public record UsuarioDto(Long id, String nombre, String correo, String tipo, Rol rol,
                         Long areaId, String area, boolean activo) {

    public static UsuarioDto de(Usuario u) {
        return new UsuarioDto(u.getId(), u.getNombre(), u.getCorreo(), u.getTipo(), u.getRol(),
                u.getArea() == null ? null : u.getArea().getId(),
                u.getArea() == null ? null : u.getArea().getNombre(),
                u.isActivo());
    }

    public record ActualizarRequest(Rol rol, Boolean activo, Long areaId) {
    }
}
