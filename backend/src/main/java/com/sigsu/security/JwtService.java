package com.sigsu.security;

import com.sigsu.domain.Usuario;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private final SecretKey clave;
    private final Duration duracion;

    public JwtService(@Value("${app.jwt.secret}") String secretoBase64,
                      @Value("${app.jwt.expiration-hours}") long horas) {
        if (secretoBase64 == null || secretoBase64.isBlank()) {
            throw new IllegalStateException("Falta la variable de entorno JWT_SECRET");
        }
        byte[] bytes = decodificar(secretoBase64.trim());
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos 256 bits (32 bytes)");
        }
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.duracion = Duration.ofHours(horas);
    }

    /** Acepta Base64 estándar o Base64URL (el formato que generan algunos proveedores cloud). */
    private static byte[] decodificar(String secreto) {
        try {
            return Decoders.BASE64.decode(secreto);
        } catch (RuntimeException e) {
            return Decoders.BASE64URL.decode(secreto);
        }
    }

    public String generar(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("rol", usuario.getRol().name())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(duracion)))
                .signWith(clave)
                .compact();
    }

    /** Devuelve el id del usuario si el token es válido y no expiró. */
    public Optional<Long> validar(String token) {
        try {
            String sub = Jwts.parser().verifyWith(clave).build()
                    .parseSignedClaims(token).getPayload().getSubject();
            return Optional.of(Long.parseLong(sub));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public Duration getDuracion() {
        return duracion;
    }
}
