package com.sigsu.web;

import com.sigsu.domain.Rol;
import com.sigsu.dto.UsuarioDto;
import com.sigsu.security.UsuarioAutenticado;
import com.sigsu.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@Tag(name = "Usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista usuarios, opcionalmente filtrados por rol")
    @PreAuthorize("hasAnyRole('SUPERVISOR','ADMIN')")
    public List<UsuarioDto> listar(@RequestParam(required = false) Rol rol) {
        return service.listar(rol);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Cambia rol, área o estado de un usuario (administrador)")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioDto actualizar(@AuthenticationPrincipal UsuarioAutenticado admin, @PathVariable Long id,
                                 @RequestBody UsuarioDto.ActualizarRequest req) {
        return service.actualizar(id, admin.id(), req);
    }
}
