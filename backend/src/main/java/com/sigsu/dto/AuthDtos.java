package com.sigsu.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    /** Al menos una letra y un número (OWASP ASVS 2.1). */
    public static final String POLITICA = "^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])(?=.*\\d).+$";
    public static final String MENSAJE_POLITICA = "La contraseña debe incluir letras y números";

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "Ingresa tu correo") String correo,
            @NotBlank(message = "Ingresa tu contraseña") String password) {
    }

    public record RegistroRequest(
            @NotBlank(message = "Ingresa tu nombre completo")
            @Size(min = 3, max = 120, message = "El nombre debe tener entre 3 y 120 caracteres") String nombre,
            @NotBlank(message = "Ingresa tu correo")
            @Email(message = "El correo no es válido")
            @Size(max = 150) String correo,
            @NotBlank(message = "Indica el tipo de usuario")
            @Pattern(regexp = "Estudiante|Docente|Personal administrativo", message = "Tipo de usuario no válido") String tipo,
            @NotBlank(message = "Ingresa una contraseña")
            @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
            @Pattern(regexp = POLITICA, message = MENSAJE_POLITICA) String password) {
    }

    public record CambioPasswordRequest(
            @NotBlank(message = "Ingresa tu contraseña actual") String actual,
            @NotBlank(message = "Ingresa la nueva contraseña")
            @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
            @Pattern(regexp = POLITICA, message = MENSAJE_POLITICA) String nueva) {
    }

    public record LoginResponse(String token, UsuarioDto usuario) {
    }
}
