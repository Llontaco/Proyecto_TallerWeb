package com.sigsu.service;

import com.sigsu.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** HU-06: solo JPG, PNG o PDF reales; el nombre del cliente nunca se usa como ruta. */
class EvidenciaStorageTest {

    @TempDir Path dir;

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};
    private static final byte[] PDF = "%PDF-1.7 contenido".getBytes();

    @Test
    void guardaUnPngValidoConNombreGenerado() throws Exception {
        EvidenciaStorage storage = new EvidenciaStorage(dir.toString());
        var r = storage.guardar(new MockMultipartFile("archivo", "../../foto.png", "image/png", PNG));
        assertThat(r.nombreAlmacenado()).endsWith(".png").doesNotContain("..");
        assertThat(r.contentType()).isEqualTo("image/png");
        assertThat(Files.exists(dir.resolve(r.nombreAlmacenado()))).isTrue();
    }

    @Test
    void aceptaUnPdfValido() throws Exception {
        EvidenciaStorage storage = new EvidenciaStorage(dir.toString());
        assertThat(storage.guardar(new MockMultipartFile("archivo", "acta.pdf", "application/pdf", PDF)).contentType())
                .isEqualTo("application/pdf");
    }

    @Test
    void rechazaUnArchivoDisfrazadoDePdf() throws Exception {
        EvidenciaStorage storage = new EvidenciaStorage(dir.toString());
        assertThatThrownBy(() -> storage.guardar(new MockMultipartFile("archivo", "virus.pdf", "application/pdf", "MZ...".getBytes())))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getErrores().get("archivo"))
                .isEqualTo("Solo se permiten archivos JPG, PNG o PDF");
    }

    @Test
    void rechazaExtensionesNoPermitidas() throws Exception {
        EvidenciaStorage storage = new EvidenciaStorage(dir.toString());
        assertThatThrownBy(() -> storage.guardar(new MockMultipartFile("archivo", "script.exe", "application/octet-stream", PNG)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void noPermiteSalirDeLaCarpetaAlDescargar() throws Exception {
        EvidenciaStorage storage = new EvidenciaStorage(dir.toString());
        assertThatThrownBy(() -> storage.cargar("../../etc/passwd")).isInstanceOf(ApiException.class);
    }
}
