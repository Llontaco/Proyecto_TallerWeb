package com.sigsu.security;

import com.sigsu.domain.Rol;
import com.sigsu.domain.Usuario;

/** Principal que los controladores reciben con @AuthenticationPrincipal. */
public record UsuarioAutenticado(Long id, String nombre, String correo, Rol rol) {

    public static UsuarioAutenticado de(Usuario u) {
        return new UsuarioAutenticado(u.getId(), u.getNombre(), u.getCorreo(), u.getRol());
    }
}
