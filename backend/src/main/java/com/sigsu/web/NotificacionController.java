package com.sigsu.web;

import com.sigsu.dto.NotificacionDtos.BandejaDto;
import com.sigsu.security.UsuarioAutenticado;
import com.sigsu.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notificaciones")
@Tag(name = "Notificaciones")
public class NotificacionController {

    private final NotificacionService service;

    public NotificacionController(NotificacionService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Últimas 20 notificaciones del usuario y cantidad sin leer")
    public BandejaDto bandeja(@AuthenticationPrincipal UsuarioAutenticado u) {
        return service.bandeja(u.id());
    }

    @PatchMapping("/{id}/leida")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Marca una notificación como leída")
    public void marcarLeida(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id) {
        service.marcarLeida(u.id(), id);
    }

    @PatchMapping("/leidas")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Marca todas las notificaciones como leídas")
    public void marcarTodas(@AuthenticationPrincipal UsuarioAutenticado u) {
        service.marcarTodasLeidas(u.id());
    }
}
