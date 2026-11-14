package com.sigsu.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

/** Error de negocio con su código HTTP. El GlobalExceptionHandler lo convierte en JSON. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, String> errores;

    public ApiException(HttpStatus status, String mensaje, Map<String, String> errores) {
        super(mensaje);
        this.status = status;
        this.errores = errores == null ? Map.of() : errores;
    }

    public ApiException(HttpStatus status, String mensaje) {
        this(status, mensaje, null);
    }

    public static ApiException noEncontrado(String mensaje) {
        return new ApiException(HttpStatus.NOT_FOUND, mensaje);
    }

    public static ApiException prohibido(String mensaje) {
        return new ApiException(HttpStatus.FORBIDDEN, mensaje);
    }

    public static ApiException conflicto(String mensaje) {
        return new ApiException(HttpStatus.CONFLICT, mensaje);
    }

    public static ApiException reglaNegocio(String mensaje) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, mensaje);
    }

    public static ApiException campoInvalido(String campo, String mensaje) {
        return new ApiException(HttpStatus.BAD_REQUEST, "Datos inválidos", Map.of(campo, mensaje));
    }

    public HttpStatus getStatus() { return status; }
    public Map<String, String> getErrores() { return errores; }
}
