package com.sigsu.exception;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(int status, String error, String mensaje, Map<String, String> errores,
                            String ruta, Instant timestamp) {

    public static ErrorResponse of(int status, String error, String mensaje, Map<String, String> errores, String ruta) {
        return new ErrorResponse(status, error, mensaje, errores == null ? Map.of() : errores, ruta, Instant.now());
    }
}
