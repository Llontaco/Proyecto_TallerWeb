package com.sigsu.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * El JWT viaja en una cookie HttpOnly (JavaScript no puede leerla: protege contra robo por XSS)
 * con SameSite=Strict (el navegador no la envía desde otros sitios: protege contra CSRF).
 */
@Component
public class AuthCookieService {

    private final String nombre;
    private final boolean secure;

    public AuthCookieService(@Value("${app.cookie.name}") String nombre,
                             @Value("${app.cookie.secure}") boolean secure) {
        this.nombre = nombre;
        this.secure = secure;
    }

    public ResponseCookie crear(String token, Duration duracion) {
        return base(token).maxAge(duracion).build();
    }

    public ResponseCookie borrar() {
        return base("").maxAge(0).build();
    }

    public String getNombre() {
        return nombre;
    }

    private ResponseCookie.ResponseCookieBuilder base(String valor) {
        return ResponseCookie.from(nombre, valor)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/api");
    }
}
