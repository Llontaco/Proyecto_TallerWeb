package com.sigsu.service;

import com.sigsu.domain.Rol;
import com.sigsu.domain.Usuario;
import com.sigsu.dto.UsuarioDto;
import com.sigsu.exception.ApiException;
import com.sigsu.repository.AreaRepository;
import com.sigsu.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final AreaRepository areas;

    public UsuarioService(UsuarioRepository usuarios, AreaRepository areas) {
        this.usuarios = usuarios;
        this.areas = areas;
    }

    @Transactional(readOnly = true)
    public List<UsuarioDto> listar(Rol rol) {
        List<Usuario> lista = rol == null
                ? usuarios.findAllByOrderByNombreAsc()
                : usuarios.findByRolAndActivoTrueOrderByNombreAsc(rol);
        return lista.stream().map(UsuarioDto::de).toList();
    }

    @Transactional
    public UsuarioDto actualizar(Long id, Long adminId, UsuarioDto.ActualizarRequest req) {
        Usuario u = usuarios.findById(id).orElseThrow(() -> ApiException.noEncontrado("Usuario no encontrado"));
        if (id.equals(adminId) && (req.rol() != null && req.rol() != Rol.ADMIN || Boolean.FALSE.equals(req.activo()))) {
            throw ApiException.reglaNegocio("No puedes quitarte el rol de administrador ni desactivarte");
        }
        if (req.rol() != null) u.setRol(req.rol());
        if (req.activo() != null) u.setActivo(req.activo());
        if (req.areaId() != null) {
            u.setArea(areas.findById(req.areaId())
                    .orElseThrow(() -> ApiException.campoInvalido("areaId", "Selecciona un área válida")));
        }
        return UsuarioDto.de(u);
    }
}
