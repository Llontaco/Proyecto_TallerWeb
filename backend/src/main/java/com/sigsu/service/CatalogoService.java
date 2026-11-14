package com.sigsu.service;

import com.sigsu.domain.Area;
import com.sigsu.domain.Categoria;
import com.sigsu.domain.EstadoSolicitud;
import com.sigsu.domain.Prioridad;
import com.sigsu.dto.CatalogoDtos.*;
import com.sigsu.exception.ApiException;
import com.sigsu.repository.AreaRepository;
import com.sigsu.repository.CategoriaRepository;
import com.sigsu.repository.PrioridadRepository;
import com.sigsu.repository.SolicitudRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class CatalogoService {

    private final CategoriaRepository categorias;
    private final PrioridadRepository prioridades;
    private final AreaRepository areas;
    private final SolicitudRepository solicitudes;

    public CatalogoService(CategoriaRepository categorias, PrioridadRepository prioridades,
                           AreaRepository areas, SolicitudRepository solicitudes) {
        this.categorias = categorias;
        this.prioridades = prioridades;
        this.areas = areas;
        this.solicitudes = solicitudes;
    }

    @Transactional(readOnly = true)
    public CatalogosDto catalogos() {
        return new CatalogosDto(
                categorias.findByActivaTrueOrderByNombreAsc().stream().map(CategoriaDto::de).toList(),
                listarPrioridades(),
                listarAreas(),
                Arrays.stream(EstadoSolicitud.values()).map(EstadoDto::de).toList());
    }

    // ---------- Categorías ----------

    @Transactional(readOnly = true)
    public List<CategoriaDto> listarCategorias() {
        return categorias.findAllByOrderByNombreAsc().stream().map(CategoriaDto::de).toList();
    }

    @Transactional
    public CategoriaDto crearCategoria(CategoriaRequest req) {
        String nombre = req.nombre().trim();
        if (categorias.existsByNombreIgnoreCase(nombre)) throw ApiException.conflicto("La categoría ya existe");
        Categoria c = new Categoria(nombre, area(req.areaId()));
        if (req.activa() != null) c.setActiva(req.activa());
        return CategoriaDto.de(categorias.save(c));
    }

    @Transactional
    public CategoriaDto actualizarCategoria(Long id, CategoriaRequest req) {
        Categoria c = categorias.findById(id).orElseThrow(() -> ApiException.noEncontrado("Categoría no encontrada"));
        String nombre = req.nombre().trim();
        if (categorias.existsByNombreIgnoreCaseAndIdNot(nombre, id)) throw ApiException.conflicto("La categoría ya existe");
        c.setNombre(nombre);
        c.setArea(area(req.areaId()));
        if (req.activa() != null) c.setActiva(req.activa());
        return CategoriaDto.de(c);
    }

    @Transactional
    public void eliminarCategoria(Long id) {
        if (!categorias.existsById(id)) throw ApiException.noEncontrado("Categoría no encontrada");
        if (solicitudes.existsByCategoriaId(id)) {
            throw ApiException.conflicto("No se puede eliminar: hay solicitudes con esta categoría. Puedes desactivarla.");
        }
        categorias.deleteById(id);
    }

    // ---------- Prioridades ----------

    @Transactional(readOnly = true)
    public List<PrioridadDto> listarPrioridades() {
        return prioridades.findAllByOrderByNivelAsc().stream().map(PrioridadDto::de).toList();
    }

    @Transactional
    public PrioridadDto actualizarPrioridad(Long id, PrioridadRequest req) {
        Prioridad p = prioridades.findById(id).orElseThrow(() -> ApiException.noEncontrado("Prioridad no encontrada"));
        p.setHorasMaximas(req.horasMaximas());
        return PrioridadDto.de(p);
    }

    // ---------- Áreas ----------

    @Transactional(readOnly = true)
    public List<AreaDto> listarAreas() {
        return areas.findAll().stream().map(AreaDto::de).toList();
    }

    @Transactional
    public AreaDto crearArea(AreaRequest req) {
        String nombre = req.nombre().trim();
        if (areas.existsByNombreIgnoreCase(nombre)) throw ApiException.conflicto("El área ya existe");
        return AreaDto.de(areas.save(new Area(nombre)));
    }

    private Area area(Long id) {
        return areas.findById(id).orElseThrow(() -> ApiException.campoInvalido("areaId", "Selecciona un área válida"));
    }
}
