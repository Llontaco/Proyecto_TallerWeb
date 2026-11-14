package com.sigsu.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "prioridad")
public class Prioridad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String nombre;

    /** Tiempo máximo de atención; se usa para calcular las solicitudes vencidas. */
    @Column(name = "horas_maximas", nullable = false)
    private int horasMaximas;

    /** Orden de urgencia: 1 = menos urgente. */
    @Column(nullable = false)
    private int nivel;

    protected Prioridad() {
    }

    public Prioridad(String nombre, int horasMaximas, int nivel) {
        this.nombre = nombre;
        this.horasMaximas = horasMaximas;
        this.nivel = nivel;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public int getHorasMaximas() { return horasMaximas; }
    public void setHorasMaximas(int horasMaximas) { this.horasMaximas = horasMaximas; }
    public int getNivel() { return nivel; }
}
