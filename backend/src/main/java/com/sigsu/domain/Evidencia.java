package com.sigsu.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "evidencia")
public class Evidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private Solicitud solicitud;

    @Column(name = "nombre_original", nullable = false, length = 200)
    private String nombreOriginal;

    /** Nombre generado en el servidor (UUID): nunca se usa el nombre que envía el cliente para guardar. */
    @Column(name = "nombre_almacenado", nullable = false, unique = true, length = 80)
    private String nombreAlmacenado;

    @Column(name = "content_type", nullable = false, length = 60)
    private String contentType;

    @Column(name = "tamano_bytes", nullable = false)
    private long tamanoBytes;

    @Column(nullable = false)
    private Instant fecha;

    protected Evidencia() {
    }

    public Evidencia(Solicitud solicitud, String nombreOriginal, String nombreAlmacenado, String contentType, long tamanoBytes) {
        this.solicitud = solicitud;
        this.nombreOriginal = nombreOriginal;
        this.nombreAlmacenado = nombreAlmacenado;
        this.contentType = contentType;
        this.tamanoBytes = tamanoBytes;
        this.fecha = Instant.now();
    }

    public Long getId() { return id; }
    public Solicitud getSolicitud() { return solicitud; }
    public String getNombreOriginal() { return nombreOriginal; }
    public String getNombreAlmacenado() { return nombreAlmacenado; }
    public String getContentType() { return contentType; }
    public long getTamanoBytes() { return tamanoBytes; }
    public Instant getFecha() { return fecha; }
}
