package com.sigsu.security;

import com.sigsu.domain.Rol;
import com.sigsu.domain.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRETO = Base64.getEncoder().encodeToString(new byte[64]);

    private static Usuario usuario() {
        Usuario u = new Usuario("Ana", "ana@uni.edu.pe", "hash", "Estudiante", Rol.ESTUDIANTE);
        ReflectionTestUtils.setField(u, "id", 7L);
        return u;
    }

    @Test
    void generaYValidaUnTokenDelUsuario() {
        JwtService jwt = new JwtService(SECRETO, 8);
        assertThat(jwt.validar(jwt.generar(usuario()))).contains(7L);
    }

    @Test
    void rechazaUnTokenAlterado() {
        JwtService jwt = new JwtService(SECRETO, 8);
        String token = jwt.generar(usuario());
        assertThat(jwt.validar(token.substring(0, token.length() - 3) + "abc")).isEmpty();
        assertThat(jwt.validar("no-es-un-jwt")).isEmpty();
    }

    @Test
    void rechazaUnTokenFirmadoConOtraClave() {
        String otroSecreto = Base64.getEncoder().encodeToString("otra-clave-de-al-menos-treinta-y-dos-bytes!!".getBytes());
        String token = new JwtService(otroSecreto, 8).generar(usuario());
        assertThat(new JwtService(SECRETO, 8).validar(token)).isEmpty();
    }

    @Test
    void aceptaSecretosEnBase64Url() {
        String base64Url = Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[]{-1, -2, -3, -4, -5, -6, -7, -8,
                -9, -10, -11, -12, -13, -14, -15, -16, -17, -18, -19, -20, -21, -22, -23, -24, -25, -26, -27, -28, -29, -30, -31, -32});
        assertThat(new JwtService(base64Url, 1).validar(new JwtService(base64Url, 1).generar(usuario()))).contains(7L);
    }

    @Test
    void exigeUnSecretoDeAlMenos256Bits() {
        assertThatThrownBy(() -> new JwtService(Base64.getEncoder().encodeToString(new byte[16]), 8))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new JwtService("", 8)).isInstanceOf(IllegalStateException.class);
    }
}
