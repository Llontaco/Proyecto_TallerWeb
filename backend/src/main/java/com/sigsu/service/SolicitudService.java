package com.sigsu.service;

import com.sigsu.domain.*;
import com.sigsu.dto.SolicitudDtos.*;
import com.sigsu.exception.ApiException;
import com.sigsu.repository.*;
import com.sigsu.security.UsuarioAutenticado;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

@Service
public class SolicitudService {

    private static final Logger log = LoggerFactory.getLogger(SolicitudService.class);
    public static final int MAX_EVIDENCIAS = 3;

    private final SolicitudRepository solicitudes;
    private final CategoriaRepository categorias;
    private final PrioridadRepository prioridades;
    private final UsuarioRepository usuarios;
    private final EvidenciaStorage storage;
    private final NotificacionService notificaciones;
    private final NotificacionRepository notificacionRepo;

    public SolicitudService(SolicitudRepository solicitudes, CategoriaRepository categorias,
                            PrioridadRepository prioridades, UsuarioRepository usuarios, EvidenciaStorage storage,
                            NotificacionService notificaciones, NotificacionRepository notificacionRepo) {
        this.solicitudes = solicitudes;
        this.categorias = categorias;
        this.prioridades = prioridades;
        this.usuarios = usuarios;
        this.storage = storage;
        this.notificaciones = notificaciones;
        this.notificacionRepo = notificacionRepo;
    }

    // ---------- Consultas ----------

    @Transactional(readOnly = true)
    public List<SolicitudResumenDto> listar(UsuarioAutenticado u, EstadoSolicitud estado, Long categoriaId, String q) {
        Specification<Solicitud> spec = switch (u.rol()) {
            case ESTUDIANTE -> SolicitudSpecs.deSolicitante(u.id());
            case TECNICO -> SolicitudSpecs.asignadaA(u.id());
            case SUPERVISOR, ADMIN -> Specification.where(null);
        };
        if (estado != null) spec = spec.and(SolicitudSpecs.conEstado(estado));
        if (categoriaId != null) spec = spec.and(SolicitudSpecs.deCategoria(categoriaId));
        if (q != null && !q.isBlank()) spec = spec.and(SolicitudSpecs.texto(q));
        Instant ahora = Instant.now();
        return solicitudes.findAll(spec, Sort.by(Sort.Direction.DESC, "fechaRegistro")).stream()
                .map(s -> resumen(s, ahora))
                .toList();
    }

    @Transactional(readOnly = true)
    public SolicitudDetalleDto obtener(UsuarioAutenticado u, Long id) {
        return detalle(cargarVisible(u, id), u);
    }

    // ---------- Comandos ----------

    @Transactional
    public SolicitudDetalleDto crear(UsuarioAutenticado u, SolicitudRequest req) {
        if (u.rol() != Rol.ESTUDIANTE) throw ApiException.prohibido("Solo los solicitantes registran solicitudes");
        Usuario solicitante = usuarios.getReferenceById(u.id());
        Solicitud s = new Solicitud(solicitante, categoriaActiva(req.categoriaId()), prioridad(req.prioridadId()),
                req.ubicacion().trim(), req.descripcion().trim());
        s.registrarHistorial(solicitante, null, "Solicitud registrada");
        solicitudes.saveAndFlush(s);
        s.setCodigo(generarCodigo(s));
        log.info("Solicitud {} registrada por el usuario {}", s.getCodigo(), u.id());
        notificaciones.notificarSupervisores(u.id(), s, "Nueva solicitud " + s.getCodigo() + " por evaluar");
        return detalle(s, u);
    }

    @Transactional
    public SolicitudDetalleDto actualizar(UsuarioAutenticado u, Long id, SolicitudRequest req) {
        Solicitud s = cargarVisible(u, id);
        if (!puedeEditar(u, s)) {
            throw ApiException.reglaNegocio("Solo puedes editar tus solicitudes mientras estén en estado Registrada");
        }
        s.setCategoria(categoriaActiva(req.categoriaId()));
        s.setPrioridad(prioridad(req.prioridadId()));
        s.setUbicacion(req.ubicacion().trim());
        s.setDescripcion(req.descripcion().trim());
        s.registrarHistorial(usuarios.getReferenceById(u.id()), s.getEstado(), "Datos de la solicitud editados");
        return detalle(s, u);
    }

    @Transactional
    public void eliminar(UsuarioAutenticado u, Long id) {
        Solicitud s = cargarVisible(u, id);
        if (!puedeEliminar(u, s)) {
            throw ApiException.reglaNegocio("Solo se pueden eliminar solicitudes en estado Registrada");
        }
        s.getEvidencias().forEach(e -> storage.eliminar(e.getNombreAlmacenado()));
        notificacionRepo.eliminarDeSolicitud(s.getId());
        solicitudes.delete(s);
        log.info("Solicitud {} eliminada por el usuario {}", s.getCodigo(), u.id());
    }

    @Transactional
    public SolicitudDetalleDto cambiarEstado(UsuarioAutenticado u, Long id, CambioEstadoRequest req) {
        Solicitud s = cargarVisible(u, id);
        EstadoSolicitud anterior = s.getEstado();
        EstadoSolicitud destino = req.estado();
        if (!anterior.transicionExiste(destino)) {
            throw ApiException.reglaNegocio("Transición de estado no permitida");
        }
        if (!anterior.rolPuedeCambiarA(destino, u.rol())) {
            throw ApiException.prohibido("Tu rol no puede realizar este cambio de estado");
        }
        Usuario actor = usuarios.getReferenceById(u.id());
        s.setEstado(destino);
        if (destino == EstadoSolicitud.RESUELTA) s.setFechaResolucion(Instant.now());
        if (destino == EstadoSolicitud.EN_ATENCION && anterior == EstadoSolicitud.RESUELTA) s.setFechaResolucion(null);
        s.registrarHistorial(actor, anterior, "Estado cambiado a " + destino.getEtiqueta());
        if (req.comentario() != null && !req.comentario().isBlank()) {
            s.getComentarios().add(new Comentario(s, actor, req.comentario().trim()));
        }
        log.info("Solicitud {}: {} -> {} por el usuario {}", s.getCodigo(), anterior, destino, u.id());
        notificaciones.notificar(List.of(s.getSolicitante(), s.getTecnico() == null ? s.getSolicitante() : s.getTecnico()),
                u.id(), s, "La solicitud " + s.getCodigo() + " pasó a " + destino.getEtiqueta());
        return detalle(s, u);
    }

    @Transactional
    public SolicitudDetalleDto asignar(UsuarioAutenticado u, Long id, AsignacionRequest req) {
        if (!u.rol().esGestor()) throw ApiException.prohibido("Solo el supervisor asigna responsables");
        Solicitud s = cargarVisible(u, id);
        if (!s.getEstado().admiteAsignacion()) {
            throw ApiException.reglaNegocio("Primero pasa la solicitud a \"En evaluación\"");
        }
        Usuario tecnico = usuarios.findById(req.tecnicoId())
                .filter(t -> t.getRol() == Rol.TECNICO && t.isActivo())
                .orElseThrow(() -> ApiException.campoInvalido("tecnicoId", "Selecciona un técnico válido"));
        if (req.prioridadId() != null) s.setPrioridad(prioridad(req.prioridadId()));
        EstadoSolicitud anterior = s.getEstado();
        s.setTecnico(tecnico);
        s.setEstado(EstadoSolicitud.ASIGNADA);
        s.registrarHistorial(usuarios.getReferenceById(u.id()), anterior,
                "Asignada a " + tecnico.getNombre() + " con prioridad " + s.getPrioridad().getNombre());
        notificaciones.notificar(List.of(tecnico), u.id(), s, "Se te asignó la solicitud " + s.getCodigo());
        notificaciones.notificar(List.of(s.getSolicitante()), u.id(), s,
                "Tu solicitud " + s.getCodigo() + " fue asignada a " + tecnico.getNombre());
        return detalle(s, u);
    }

    @Transactional
    public SolicitudDetalleDto comentar(UsuarioAutenticado u, Long id, ComentarioRequest req) {
        Solicitud s = cargarVisible(u, id);
        if (s.getEstado() == EstadoSolicitud.CERRADA) throw ApiException.reglaNegocio("La solicitud está cerrada");
        s.getComentarios().add(new Comentario(s, usuarios.getReferenceById(u.id()), req.texto().trim()));
        notificaciones.notificar(List.of(s.getSolicitante(), s.getTecnico() == null ? s.getSolicitante() : s.getTecnico()),
                u.id(), s, "Nuevo comentario en la solicitud " + s.getCodigo());
        return detalle(s, u);
    }

    @Transactional
    public SolicitudDetalleDto adjuntar(UsuarioAutenticado u, Long id, MultipartFile archivo) {
        Solicitud s = cargarVisible(u, id);
        if (!puedeAdjuntar(u, s)) throw ApiException.reglaNegocio("No se pueden adjuntar evidencias a esta solicitud");
        if (s.getEvidencias().size() >= MAX_EVIDENCIAS) {
            throw ApiException.campoInvalido("archivo", "Máximo " + MAX_EVIDENCIAS + " evidencias por solicitud");
        }
        var guardado = storage.guardar(archivo);
        String nombre = archivo.getOriginalFilename() == null ? "evidencia" : archivo.getOriginalFilename();
        nombre = nombre.replaceAll("[\\\\/:*?\"<>|]", "_");
        if (nombre.length() > 200) nombre = nombre.substring(nombre.length() - 200);
        s.getEvidencias().add(new Evidencia(s, nombre, guardado.nombreAlmacenado(), guardado.contentType(), guardado.tamano()));
        return detalle(s, u);
    }

    public record ArchivoEvidencia(Resource recurso, String nombre, String contentType) {
    }

    @Transactional(readOnly = true)
    public ArchivoEvidencia descargarEvidencia(UsuarioAutenticado u, Long id, Long evidenciaId) {
        Solicitud s = cargarVisible(u, id);
        Evidencia e = s.getEvidencias().stream().filter(x -> x.getId().equals(evidenciaId)).findFirst()
                .orElseThrow(() -> ApiException.noEncontrado("Evidencia no encontrada"));
        return new ArchivoEvidencia(storage.cargar(e.getNombreAlmacenado()), e.getNombreOriginal(), e.getContentType());
    }

    // ---------- Reglas de acceso ----------

    static boolean puedeVer(UsuarioAutenticado u, Solicitud s) {
        return switch (u.rol()) {
            case SUPERVISOR, ADMIN -> true;
            case ESTUDIANTE -> s.getSolicitante().getId().equals(u.id());
            case TECNICO -> s.getTecnico() != null && s.getTecnico().getId().equals(u.id());
        };
    }

    private static boolean esDueno(UsuarioAutenticado u, Solicitud s) {
        return s.getSolicitante().getId().equals(u.id());
    }

    static boolean puedeEditar(UsuarioAutenticado u, Solicitud s) {
        return esDueno(u, s) && s.getEstado() == EstadoSolicitud.REGISTRADA;
    }

    static boolean puedeEliminar(UsuarioAutenticado u, Solicitud s) {
        return s.getEstado() == EstadoSolicitud.REGISTRADA && (esDueno(u, s) || u.rol() == Rol.ADMIN);
    }

    static boolean puedeAdjuntar(UsuarioAutenticado u, Solicitud s) {
        return s.getEstado() != EstadoSolicitud.CERRADA && s.getEvidencias().size() < MAX_EVIDENCIAS;
    }

    // ---------- Apoyo ----------

    private Solicitud cargarVisible(UsuarioAutenticado u, Long id) {
        Solicitud s = solicitudes.findById(id).orElseThrow(() -> ApiException.noEncontrado("Solicitud no encontrada"));
        if (!puedeVer(u, s)) throw ApiException.prohibido("No tienes acceso a esta solicitud");
        return s;
    }

    private Categoria categoriaActiva(Long id) {
        return categorias.findById(id).filter(Categoria::isActiva)
                .orElseThrow(() -> ApiException.campoInvalido("categoriaId", "Selecciona una categoría válida"));
    }

    private Prioridad prioridad(Long id) {
        return prioridades.findById(id)
                .orElseThrow(() -> ApiException.campoInvalido("prioridadId", "Selecciona una prioridad válida"));
    }

    static String generarCodigo(Solicitud s) {
        int anio = s.getFechaRegistro().atZone(ZoneOffset.UTC).getYear();
        return String.format("SOL-%d-%05d", anio, s.getId());
    }

    private SolicitudResumenDto resumen(Solicitud s, Instant ahora) {
        return new SolicitudResumenDto(s.getId(), s.getCodigo(), s.getCategoria().getNombre(),
                s.getCategoria().getArea().getNombre(), s.getPrioridad().getNombre(), s.getPrioridad().getNivel(),
                s.getEstado(), s.getEstado().getEtiqueta(), s.getUbicacion(), s.getSolicitante().getNombre(),
                s.getTecnico() == null ? null : s.getTecnico().getNombre(), s.getFechaRegistro(), s.estaVencida(ahora),
                s.getFechaRegistro().plus(java.time.Duration.ofHours(s.getPrioridad().getHorasMaximas())));
    }

    private SolicitudDetalleDto detalle(Solicitud s, UsuarioAutenticado u) {
        List<TransicionDto> transiciones = s.getEstado().destinosPosibles().stream()
                .filter(d -> s.getEstado().rolPuedeCambiarA(d, u.rol()))
                .filter(d -> u.rol() != Rol.TECNICO || (s.getTecnico() != null && s.getTecnico().getId().equals(u.id())))
                .sorted(Comparator.comparing(Enum::ordinal, Comparator.reverseOrder()))
                .map(d -> new TransicionDto(d, d.getEtiqueta()))
                .toList();
        var acciones = new AccionesDto(transiciones,
                u.rol().esGestor() && s.getEstado().admiteAsignacion(),
                puedeEditar(u, s), puedeEliminar(u, s),
                s.getEstado() != EstadoSolicitud.CERRADA, puedeAdjuntar(u, s));
        return new SolicitudDetalleDto(s.getId(), s.getCodigo(), s.getCategoria().getId(), s.getCategoria().getNombre(),
                s.getCategoria().getArea().getNombre(), s.getPrioridad().getId(), s.getPrioridad().getNombre(),
                s.getPrioridad().getHorasMaximas(), s.getEstado(), s.getEstado().getEtiqueta(),
                s.getUbicacion(), s.getDescripcion(),
                s.getSolicitante().getId(), s.getSolicitante().getNombre(),
                s.getTecnico() == null ? null : s.getTecnico().getId(),
                s.getTecnico() == null ? null : s.getTecnico().getNombre(),
                s.getFechaRegistro(), s.getFechaActualizacion(), s.getFechaResolucion(), s.estaVencida(Instant.now()),
                s.getComentarios().stream().map(c -> new ComentarioDto(c.getId(), c.getAutor().getNombre(), c.getTexto(), c.getFecha())).toList(),
                s.getHistorial().stream().map(h -> new HistorialDto(h.getId(), h.getUsuario().getNombre(),
                        h.getEstadoAnterior(), h.getEstadoNuevo(), h.getAccion(), h.getFecha())).toList(),
                s.getEvidencias().stream().map(e -> new EvidenciaDto(e.getId(), e.getNombreOriginal(), e.getContentType(),
                        e.getTamanoBytes(), e.getFecha())).toList(),
                acciones);
    }
}
