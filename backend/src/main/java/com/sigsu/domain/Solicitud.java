package com.sigsu.domain;

import jakarta.persistence.*;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "solicitud", indexes = {
        @Index(name = "idx_solicitud_estado", columnList = "estado"),
        @Index(name = "idx_solicitud_solicitante", columnList = "solicitante_id"),
        @Index(name = "idx_solicitud_tecnico", columnList = "tecnico_id")
})
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Código legible SOL-AAAA-NNNNN; se asigna después de obtener el id. */
    @Column(unique = true, length = 20)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tecnico_id")
    private Usuario tecnico;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prioridad_id", nullable = false)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoSolicitud estado = EstadoSolicitud.REGISTRADA;

    @Column(nullable = false, length = 150)
    private String ubicacion;

    @Column(nullable = false, length = 1000)
    private String descripcion;

    @Column(name = "fecha_registro", nullable = false, updatable = false)
    private Instant fechaRegistro;

    @Column(name = "fecha_actualizacion", nullable = false)
    private Instant fechaActualizacion;

    @Column(name = "fecha_resolucion")
    private Instant fechaResolucion;

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fecha ASC")
    private List<Comentario> comentarios = new ArrayList<>();

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fecha ASC")
    private List<HistorialEstado> historial = new ArrayList<>();

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fecha ASC")
    private List<Evidencia> evidencias = new ArrayList<>();

    protected Solicitud() {
    }

    public Solicitud(Usuario solicitante, Categoria categoria, Prioridad prioridad, String ubicacion, String descripcion) {
        this.solicitante = solicitante;
        this.categoria = categoria;
        this.prioridad = prioridad;
        this.ubicacion = ubicacion;
        this.descripcion = descripcion;
    }

    @PrePersist
    void alCrear() {
        if (fechaRegistro == null) fechaRegistro = Instant.now();
        if (fechaActualizacion == null) fechaActualizacion = fechaRegistro;
    }

    @PreUpdate
    void alActualizar() {
        fechaActualizacion = Instant.now();
    }

    /** Vencida = sigue abierta y superó el tiempo máximo de su prioridad. */
    public boolean estaVencida(Instant ahora) {
        return estado.estaAbierta()
                && ahora.isAfter(fechaRegistro.plus(Duration.ofHours(prioridad.getHorasMaximas())));
    }

    public void registrarHistorial(Usuario usuario, EstadoSolicitud anterior, String accion) {
        historial.add(new HistorialEstado(this, usuario, anterior, estado, accion));
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public Usuario getSolicitante() { return solicitante; }
    public Usuario getTecnico() { return tecnico; }
    public void setTecnico(Usuario tecnico) { this.tecnico = tecnico; }
    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }
    public Prioridad getPrioridad() { return prioridad; }
    public void setPrioridad(Prioridad prioridad) { this.prioridad = prioridad; }
    public EstadoSolicitud getEstado() { return estado; }
    public void setEstado(EstadoSolicitud estado) { this.estado = estado; }
    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Instant getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(Instant fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public Instant getFechaActualizacion() { return fechaActualizacion; }
    public Instant getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(Instant fechaResolucion) { this.fechaResolucion = fechaResolucion; }
    public List<Comentario> getComentarios() { return comentarios; }
    public List<HistorialEstado> getHistorial() { return historial; }
    public List<Evidencia> getEvidencias() { return evidencias; }
}
