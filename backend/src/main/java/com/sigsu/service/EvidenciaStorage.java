package com.sigsu.service;

import com.sigsu.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Guarda las evidencias en disco. Valida tipo por extensión, content-type y firma del archivo
 * (bytes iniciales), y nunca usa el nombre enviado por el cliente como ruta.
 */
@Component
public class EvidenciaStorage {

    public static final long TAMANO_MAXIMO = 5L * 1024 * 1024;

    private static final Map<String, String> TIPOS = Map.of(
            "jpg", "image/jpeg", "jpeg", "image/jpeg", "png", "image/png", "pdf", "application/pdf");

    private final Path raiz;

    public EvidenciaStorage(@Value("${app.uploads.dir}") String dir) throws IOException {
        this.raiz = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(raiz);
    }

    public record Guardado(String nombreAlmacenado, String contentType, long tamano) {
    }

    public Guardado guardar(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) throw ApiException.campoInvalido("archivo", "Selecciona un archivo");
        if (archivo.getSize() > TAMANO_MAXIMO) {
            throw ApiException.campoInvalido("archivo", "Cada archivo debe pesar como máximo 5 MB");
        }
        String nombre = archivo.getOriginalFilename() == null ? "" : archivo.getOriginalFilename();
        String ext = nombre.contains(".") ? nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        String tipo = TIPOS.get(ext);
        if (tipo == null || !firmaValida(archivo, tipo)) {
            throw ApiException.campoInvalido("archivo", "Solo se permiten archivos JPG, PNG o PDF");
        }
        String almacenado = UUID.randomUUID() + "." + ext;
        try (InputStream in = archivo.getInputStream()) {
            Files.copy(in, raiz.resolve(almacenado));
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar la evidencia", e);
        }
        return new Guardado(almacenado, tipo, archivo.getSize());
    }

    public Resource cargar(String nombreAlmacenado) {
        Path ruta = raiz.resolve(nombreAlmacenado).normalize();
        if (!ruta.startsWith(raiz) || !Files.exists(ruta)) throw ApiException.noEncontrado("Archivo no encontrado");
        return new PathResource(ruta);
    }

    public void eliminar(String nombreAlmacenado) {
        try {
            Files.deleteIfExists(raiz.resolve(nombreAlmacenado).normalize());
        } catch (IOException ignored) {
            // Si el archivo ya no existe no es un error para el usuario.
        }
    }

    private boolean firmaValida(MultipartFile archivo, String tipo) {
        try (InputStream in = archivo.getInputStream()) {
            byte[] cabecera = in.readNBytes(8);
            return switch (tipo) {
                case "image/png" -> cabecera.length >= 4 && Arrays.equals(Arrays.copyOf(cabecera, 4),
                        new byte[]{(byte) 0x89, 'P', 'N', 'G'});
                case "image/jpeg" -> cabecera.length >= 3 && (cabecera[0] & 0xFF) == 0xFF
                        && (cabecera[1] & 0xFF) == 0xD8 && (cabecera[2] & 0xFF) == 0xFF;
                case "application/pdf" -> cabecera.length >= 4 && cabecera[0] == '%' && cabecera[1] == 'P'
                        && cabecera[2] == 'D' && cabecera[3] == 'F';
                default -> false;
            };
        } catch (IOException e) {
            return false;
        }
    }
}
