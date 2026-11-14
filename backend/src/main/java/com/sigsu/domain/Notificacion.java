package com.sigsu.domain;

import jakarta.persistence.*;

import java.time.Instant;

/** Aviso dentro de la aplicación para un usuario (HU-13). */
@Entity
@Table(name = "notificacion", indexes = @Index(name = "idx_notificacion_usuario", columnList = "usuario_id, leida"))
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitud_id")
    private Solicitud solicitud;

    @Column(nullable = false, length = 300)
    private String mensaje;

    @Column(nullable = false)
    private boolean leida = false;

    @Column(nullable = false)
    private Instant fecha;

    protected Notificacion() {
    }

    public Notificacion(Usuario usuario, Solicitud solicitud, String mensaje) {
        this.usuario = usuario;
        this.solicitud = solicitud;
        this.mensaje = mensaje;
        this.fecha = Instant.now();
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public Solicitud getSolicitud() { return solicitud; }
    public String getMensaje() { return mensaje; }
    public boolean isLeida() { return leida; }
    public void marcarLeida() { this.leida = true; }
    public Instant getFecha() { return fecha; }
}
