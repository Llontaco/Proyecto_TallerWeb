package com.sigsu.web;

import com.sigsu.dto.CatalogoDtos.*;
import com.sigsu.service.CatalogoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Catálogos")
public class CatalogoController {

    private final CatalogoService service;

    public CatalogoController(CatalogoService service) {
        this.service = service;
    }

    @GetMapping("/catalogos")
    @Operation(summary = "Catálogos activos: categorías, prioridades, áreas y estados")
    public CatalogosDto catalogos() {
        return service.catalogos();
    }

    // ---------- Categorías: CRUD completo (solo administrador modifica) ----------

    @GetMapping("/categorias")
    @Operation(summary = "Lista todas las categorías")
    public List<CategoriaDto> categorias() {
        return service.listarCategorias();
    }

    @PostMapping("/categorias")
    @Operation(summary = "Crea una categoría (administrador)")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CategoriaDto crearCategoria(@Valid @RequestBody CategoriaRequest req) {
        return service.crearCategoria(req);
    }

    @PutMapping("/categorias/{id}")
    @Operation(summary = "Actualiza una categoría (administrador)")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoriaDto actualizarCategoria(@PathVariable Long id, @Valid @RequestBody CategoriaRequest req) {
        return service.actualizarCategoria(id, req);
    }

    @DeleteMapping("/categorias/{id}")
    @Operation(summary = "Elimina una categoría sin solicitudes (409 si está en uso)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void eliminarCategoria(@PathVariable Long id) {
        service.eliminarCategoria(id);
    }

    // ---------- Prioridades y áreas ----------

    @GetMapping("/prioridades")
    @Operation(summary = "Lista las prioridades")
    public List<PrioridadDto> prioridades() {
        return service.listarPrioridades();
    }

    @PutMapping("/prioridades/{id}")
    @Operation(summary = "Cambia las horas máximas de una prioridad (administrador)")
    @PreAuthorize("hasRole('ADMIN')")
    public PrioridadDto actualizarPrioridad(@PathVariable Long id, @Valid @RequestBody PrioridadRequest req) {
        return service.actualizarPrioridad(id, req);
    }

    @GetMapping("/areas")
    @Operation(summary = "Lista las áreas responsables")
    public List<AreaDto> areas() {
        return service.listarAreas();
    }

    @PostMapping("/areas")
    @Operation(summary = "Crea un área responsable (administrador)")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public AreaDto crearArea(@Valid @RequestBody AreaRequest req) {
        return service.crearArea(req);
    }
}
