package com.sigsu.config;

import com.sigsu.domain.*;
import com.sigsu.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

/**
 * Carga catálogos y datos de demostración solo si la base está vacía.
 * La contraseña de los usuarios demo viene de SEED_DEMO_PASSWORD (nunca está en el código).
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final AreaRepository areas;
    private final CategoriaRepository categorias;
    private final PrioridadRepository prioridades;
    private final UsuarioRepository usuarios;
    private final SolicitudRepository solicitudes;
    private final PasswordEncoder encoder;
    private final boolean habilitado;
    private final String passwordDemo;

    public DataInitializer(AreaRepository areas, CategoriaRepository categorias, PrioridadRepository prioridades,
                           UsuarioRepository usuarios, SolicitudRepository solicitudes, PasswordEncoder encoder,
                           @Value("${app.seed.enabled}") boolean habilitado,
                           @Value("${app.seed.demo-password}") String passwordDemo) {
        this.areas = areas;
        this.categorias = categorias;
        this.prioridades = prioridades;
        this.usuarios = usuarios;
        this.solicitudes = solicitudes;
        this.encoder = encoder;
        this.habilitado = habilitado;
        this.passwordDemo = passwordDemo;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!habilitado || usuarios.count() > 0) return;
        if (passwordDemo == null || passwordDemo.length() < 8) {
            log.warn("SEED_DEMO_PASSWORD no está definida (mín. 8 caracteres): no se crean datos de demostración");
            return;
        }
        log.info("Base de datos vacía: cargando catálogos y datos de demostración");

        Area mant = areas.save(new Area("Mantenimiento e Infraestructura"));
        Area soporte = areas.save(new Area("Soporte Informático"));
        Area academicos = areas.save(new Area("Servicios Académicos"));

        Categoria cMant = categorias.save(new Categoria("Mantenimiento", mant));
        Categoria cInfra = categorias.save(new Categoria("Infraestructura", mant));
        Categoria cSoporte = categorias.save(new Categoria("Soporte informático", soporte));
        Categoria cAdmin = categorias.save(new Categoria("Solicitud administrativa", academicos));
        Categoria cReserva = categorias.save(new Categoria("Reserva de ambiente", academicos));

        Prioridad baja = prioridades.save(new Prioridad("Baja", 120, 1));
        Prioridad media = prioridades.save(new Prioridad("Media", 72, 2));
        Prioridad alta = prioridades.save(new Prioridad("Alta", 24, 3));
        Prioridad critica = prioridades.save(new Prioridad("Crítica", 4, 4));

        String hash = encoder.encode(passwordDemo);
        Usuario ana = usuarios.save(new Usuario("Ana Quispe", "estudiante@uni.edu.pe", hash, "Estudiante", Rol.ESTUDIANTE));
        Usuario carlos = usuarios.save(new Usuario("Carlos Ramos", "docente@uni.edu.pe", hash, "Docente", Rol.ESTUDIANTE));
        Usuario luis = new Usuario("Luis Paredes", "tecnico@uni.edu.pe", hash, "Personal administrativo", Rol.TECNICO);
        luis.setArea(mant);
        usuarios.save(luis);
        Usuario maria = new Usuario("María Torres", "tecnico2@uni.edu.pe", hash, "Personal administrativo", Rol.TECNICO);
        maria.setArea(soporte);
        usuarios.save(maria);
        Usuario jorge = usuarios.save(new Usuario("Jorge Salas", "supervisor@uni.edu.pe", hash, "Personal administrativo", Rol.SUPERVISOR));
        usuarios.save(new Usuario("Rosa Medina", "admin@uni.edu.pe", hash, "Personal administrativo", Rol.ADMIN));

        crear(ana, cMant, alta, "Facultad de Ingeniería – Aula 204", "El proyector del aula 204 no enciende desde el lunes.", 30, EstadoSolicitud.EN_ATENCION, luis, jorge, null);
        crear(ana, cSoporte, media, "Biblioteca central – Sala de cómputo", "Tres computadoras de la sala no tienen acceso a internet.", 96, EstadoSolicitud.RESUELTA, maria, jorge, 50);
        crear(carlos, cInfra, critica, "Pabellón B – Baños 2.º piso", "Fuga de agua en los baños del segundo piso, el piso está mojado.", 2, EstadoSolicitud.ASIGNADA, luis, jorge, null);
        crear(ana, cAdmin, baja, "Oficina de Registro Académico", "Solicito constancia de matrícula del ciclo 2026-II.", 5, EstadoSolicitud.REGISTRADA, null, jorge, null);
        crear(carlos, cReserva, media, "Auditorio principal", "Reserva del auditorio para la sustentación del 20 de noviembre.", 20, EstadoSolicitud.EN_EVALUACION, null, jorge, null);
        crear(ana, cSoporte, alta, "Laboratorio de Redes", "El switch del laboratorio se reinicia constantemente.", 200, EstadoSolicitud.CERRADA, maria, jorge, 185);
        crear(carlos, cMant, media, "Facultad de Ciencias – Aula 101", "Dos sillas rotas en la última fila del aula 101.", 150, EstadoSolicitud.CERRADA, luis, jorge, 110);
        crear(ana, cInfra, alta, "Cafetería – Entrada principal", "Luminaria apagada en la entrada, de noche está muy oscuro.", 40, EstadoSolicitud.REGISTRADA, null, jorge, null);
        log.info("Datos de demostración cargados: 6 usuarios y 8 solicitudes");
    }

    /** Crea una solicitud de ejemplo y reconstruye su historial hasta el estado indicado. */
    private void crear(Usuario solicitante, Categoria cat, Prioridad pri, String ubicacion, String descripcion,
                       int horasAtras, EstadoSolicitud estadoFinal, Usuario tecnico, Usuario supervisor,
                       Integer horasAtrasResolucion) {
        Instant registro = Instant.now().minus(Duration.ofHours(horasAtras));
        Solicitud s = new Solicitud(solicitante, cat, pri, ubicacion, descripcion);
        s.setFechaRegistro(registro);
        s.registrarHistorial(solicitante, null, "Solicitud registrada");
        s.getHistorial().getLast().setFecha(registro);

        EstadoSolicitud[] camino = EstadoSolicitud.values();
        EstadoSolicitud anterior = EstadoSolicitud.REGISTRADA;
        for (int i = 1; i <= estadoFinal.ordinal(); i++) {
            EstadoSolicitud e = camino[i];
            s.setEstado(e);
            Usuario actor = switch (e) {
                case EN_ATENCION, RESUELTA -> tecnico;
                case CERRADA -> solicitante;
                default -> supervisor;
            };
            if (e == EstadoSolicitud.ASIGNADA) s.setTecnico(tecnico);
            String accion = e == EstadoSolicitud.ASIGNADA
                    ? "Asignada a " + tecnico.getNombre() + " con prioridad " + pri.getNombre()
                    : "Estado cambiado a " + e.getEtiqueta();
            s.registrarHistorial(actor, anterior, accion);
            Instant fecha = registro.plus(Duration.ofMinutes(30L * i));
            if (e == EstadoSolicitud.RESUELTA && horasAtrasResolucion != null) {
                fecha = Instant.now().minus(Duration.ofHours(horasAtrasResolucion));
                s.setFechaResolucion(fecha);
            }
            if (e == EstadoSolicitud.CERRADA) fecha = s.getFechaResolucion().plus(Duration.ofHours(2));
            s.getHistorial().getLast().setFecha(fecha);
            anterior = e;
        }
        solicitudes.saveAndFlush(s);
        s.setCodigo(String.format("SOL-%d-%05d", registro.atZone(ZoneOffset.UTC).getYear(), s.getId()));
    }
}
