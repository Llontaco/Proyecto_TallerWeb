package com.sigsu.security;

import com.sigsu.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Freno de fuerza bruta en el login (OWASP A07). */
class LoginAttemptServiceTest {

    /** Reloj que se puede adelantar en la prueba. */
    static class RelojMovil extends Clock {
        Instant ahora = Instant.parse("2026-11-13T10:00:00Z");
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return ahora; }
    }

    private final RelojMovil reloj = new RelojMovil();
    private final LoginAttemptService servicio = new LoginAttemptService(3, Duration.ofMinutes(15), reloj);

    @Test
    void permiteIntentarMientrasNoLlegueAlLimite() {
        servicio.registrarFallo("ana@uni.edu.pe");
        servicio.registrarFallo("ana@uni.edu.pe");
        assertThatCode(() -> servicio.verificar("ana@uni.edu.pe")).doesNotThrowAnyException();
    }

    @Test
    void bloqueaAlLlegarAlLimiteConCodigo429() {
        for (int i = 0; i < 3; i++) servicio.registrarFallo("Ana@Uni.edu.pe ");
        assertThatThrownBy(() -> servicio.verificar("ana@uni.edu.pe"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Demasiados intentos")
                .extracting(e -> ((ApiException) e).getStatus().value()).isEqualTo(429);
    }

    @Test
    void desbloqueaCuandoPasaLaVentana() {
        for (int i = 0; i < 3; i++) servicio.registrarFallo("ana@uni.edu.pe");
        reloj.ahora = reloj.ahora.plus(Duration.ofMinutes(16));
        assertThatCode(() -> servicio.verificar("ana@uni.edu.pe")).doesNotThrowAnyException();
    }

    @Test
    void unLoginExitosoReiniciaElContador() {
        servicio.registrarFallo("ana@uni.edu.pe");
        servicio.registrarFallo("ana@uni.edu.pe");
        servicio.registrarExito("ana@uni.edu.pe");
        servicio.registrarFallo("ana@uni.edu.pe");
        assertThatCode(() -> servicio.verificar("ana@uni.edu.pe")).doesNotThrowAnyException();
    }
}
