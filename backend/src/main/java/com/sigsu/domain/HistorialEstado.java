package com.sigsu.domain;

import jakarta.persistence.*;

import java.time.Instant;

/** Trazabilidad: cada cambio de una solicitud queda registrado con quién, cuándo y qué. */
@Entity
@Table(name = "historial_estado")
public class HistorialEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private Solicitud solicitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 20)
    private EstadoSolicitud estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false, length = 20)
    private EstadoSolicitud estadoNuevo;

    @Column(nullable = false, length = 200)
    private String accion;

    @Column(nullable = false)
    private Instant fecha;

    protected HistorialEstado() {
    }

    HistorialEstado(Solicitud solicitud, Usuario usuario, EstadoSolicitud anterior, EstadoSolicitud nuevo, String accion) {
        this.solicitud = solicitud;
        this.usuario = usuario;
        this.estadoAnterior = anterior;
        this.estadoNuevo = nuevo;
        this.accion = accion;
        this.fecha = Instant.now();
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public EstadoSolicitud getEstadoAnterior() { return estadoAnterior; }
    public EstadoSolicitud getEstadoNuevo() { return estadoNuevo; }
    public String getAccion() { return accion; }
    public Instant getFecha() { return fecha; }
    public void setFecha(Instant fecha) { this.fecha = fecha; }
}
