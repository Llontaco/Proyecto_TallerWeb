package com.sigsu.security;

import com.sigsu.exception.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Freno contra ataques de fuerza bruta (OWASP A07): tras N intentos fallidos para un mismo correo
 * dentro de la ventana de tiempo, el login responde 429 hasta que la ventana expire.
 */
@Component
public class LoginAttemptService {

    private final int maxIntentos;
    private final Duration ventana;
    private final Clock reloj;
    private final Map<String, Deque<Instant>> fallos = new ConcurrentHashMap<>();

    @Autowired
    public LoginAttemptService(@Value("${app.seguridad.login.max-intentos}") int maxIntentos,
                               @Value("${app.seguridad.login.ventana-minutos}") long ventanaMinutos) {
        this(maxIntentos, Duration.ofMinutes(ventanaMinutos), Clock.systemUTC());
    }

    LoginAttemptService(int maxIntentos, Duration ventana, Clock reloj) {
        this.maxIntentos = maxIntentos;
        this.ventana = ventana;
        this.reloj = reloj;
    }

    /** Lanza 429 si el correo está bloqueado temporalmente. */
    public void verificar(String correo) {
        Deque<Instant> intentos = fallos.get(clave(correo));
        if (intentos == null) return;
        synchronized (intentos) {
            purgar(intentos);
            if (intentos.size() >= maxIntentos) {
                long minutos = Math.max(1, Duration.between(reloj.instant(), intentos.peekFirst().plus(ventana)).toMinutes() + 1);
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Demasiados intentos fallidos. Vuelve a intentarlo en " + minutos + " minuto(s)");
            }
        }
    }

    public void registrarFallo(String correo) {
        Deque<Instant> intentos = fallos.computeIfAbsent(clave(correo), k -> new ArrayDeque<>());
        synchronized (intentos) {
            purgar(intentos);
            intentos.addLast(reloj.instant());
        }
    }

    public void registrarExito(String correo) {
        fallos.remove(clave(correo));
    }

    private void purgar(Deque<Instant> intentos) {
        Instant limite = reloj.instant().minus(ventana);
        while (!intentos.isEmpty() && intentos.peekFirst().isBefore(limite)) intentos.pollFirst();
    }

    private static String clave(String correo) {
        return correo == null ? "" : correo.trim().toLowerCase(Locale.ROOT);
    }
}
