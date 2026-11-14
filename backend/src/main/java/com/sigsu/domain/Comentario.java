package com.sigsu.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "comentario")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private Solicitud solicitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario autor;

    @Column(nullable = false, length = 500)
    private String texto;

    @Column(nullable = false)
    private Instant fecha;

    protected Comentario() {
    }

    public Comentario(Solicitud solicitud, Usuario autor, String texto) {
        this.solicitud = solicitud;
        this.autor = autor;
        this.texto = texto;
        this.fecha = Instant.now();
    }

    public Long getId() { return id; }
    public Usuario getAutor() { return autor; }
    public String getTexto() { return texto; }
    public Instant getFecha() { return fecha; }
}
