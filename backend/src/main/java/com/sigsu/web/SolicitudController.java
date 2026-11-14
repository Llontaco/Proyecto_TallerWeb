package com.sigsu.web;

import com.sigsu.domain.EstadoSolicitud;
import com.sigsu.dto.SolicitudDtos.*;
import com.sigsu.security.UsuarioAutenticado;
import com.sigsu.service.SolicitudService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
@Tag(name = "Solicitudes")
public class SolicitudController {

    private final SolicitudService service;

    public SolicitudController(SolicitudService service) {
        this.service = service;
    }

    /** Lista según el rol: el estudiante ve las suyas, el técnico sus asignadas y el supervisor todas. */
    @GetMapping
    @Operation(summary = "Lista solicitudes según el rol (estudiante: propias; técnico: asignadas; supervisor/admin: todas)")
    public List<SolicitudResumenDto> listar(@AuthenticationPrincipal UsuarioAutenticado u,
                                            @RequestParam(required = false) EstadoSolicitud estado,
                                            @RequestParam(required = false) Long categoriaId,
                                            @RequestParam(required = false) String q) {
        return service.listar(u, estado, categoriaId, q);
    }

    @PostMapping
    @Operation(summary = "Registra una solicitud y genera su código SOL-AAAA-NNNNN")
    public ResponseEntity<SolicitudDetalleDto> crear(@AuthenticationPrincipal UsuarioAutenticado u,
                                                     @Valid @RequestBody SolicitudRequest req) {
        SolicitudDetalleDto creada = service.crear(u, req);
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(creada.id()).toUri();
        return ResponseEntity.created(location).body(creada);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle con historial, comentarios, evidencias y acciones permitidas")
    public SolicitudDetalleDto obtener(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id) {
        return service.obtener(u, id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita una solicitud propia en estado Registrada")
    public SolicitudDetalleDto actualizar(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id,
                                          @Valid @RequestBody SolicitudRequest req) {
        return service.actualizar(u, id, req);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Elimina una solicitud en estado Registrada")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id) {
        service.eliminar(u, id);
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Cambia el estado validando la transición y el rol (422 si no está permitida)")
    public SolicitudDetalleDto cambiarEstado(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id,
                                             @Valid @RequestBody CambioEstadoRequest req) {
        return service.cambiarEstado(u, id, req);
    }

    @PatchMapping("/{id}/asignacion")
    @Operation(summary = "Asigna técnico y prioridad (supervisor o administrador)")
    public SolicitudDetalleDto asignar(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id,
                                       @Valid @RequestBody AsignacionRequest req) {
        return service.asignar(u, id, req);
    }

    @PostMapping("/{id}/comentarios")
    @Operation(summary = "Agrega un comentario")
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitudDetalleDto comentar(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id,
                                        @Valid @RequestBody ComentarioRequest req) {
        return service.comentar(u, id, req);
    }

    @PostMapping(path = "/{id}/evidencias", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Adjunta una evidencia JPG, PNG o PDF (máx. 5 MB, 3 por solicitud)")
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitudDetalleDto adjuntar(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id,
                                        @RequestParam("archivo") MultipartFile archivo) {
        return service.adjuntar(u, id, archivo);
    }

    @GetMapping("/{id}/evidencias/{evidenciaId}")
    @Operation(summary = "Descarga una evidencia")
    public ResponseEntity<Resource> descargar(@AuthenticationPrincipal UsuarioAutenticado u, @PathVariable Long id,
                                              @PathVariable Long evidenciaId) {
        var archivo = service.descargarEvidencia(u, id, evidenciaId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(archivo.nombre(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(archivo.recurso());
    }
}
