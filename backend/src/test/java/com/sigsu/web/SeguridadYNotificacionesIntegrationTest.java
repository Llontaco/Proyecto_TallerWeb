package com.sigsu.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Fase III: seguridad (fuerza bruta, contraseñas, roles), notificaciones y salud del servicio. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SeguridadYNotificacionesIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String token(String correo) throws Exception {
        String res = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"" + correo + "\",\"password\":\"Prueba123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("token").asText();
    }

    private MockHttpServletRequestBuilder con(MockHttpServletRequestBuilder req, String token) {
        return req.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
    }

    @Test
    void bloqueaElLoginTrasCincoIntentosFallidos() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"correo\":\"tecnico2@uni.edu.pe\",\"password\":\"incorrecta1\"}"))
                    .andExpect(status().isUnauthorized());
        }
        // Incluso con la contraseña correcta, el correo queda bloqueado temporalmente.
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"tecnico2@uni.edu.pe\",\"password\":\"Prueba123\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.mensaje", containsString("Demasiados intentos")));
    }

    @Test
    void rechazaContrasenasSinNumeros() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Nuevo Alumno\",\"correo\":\"nuevo@uni.edu.pe\",\"tipo\":\"Estudiante\",\"password\":\"solotexto\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.password").value("La contraseña debe incluir letras y números"));
    }

    @Test
    void rechazaCorreosNoInstitucionales() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Nuevo Alumno\",\"correo\":\"nuevo@gmail.com\",\"tipo\":\"Estudiante\",\"password\":\"Clave1234\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.correo", containsString("@uni.edu.pe")));
    }

    @Test
    void unEstudianteNoPuedeVerLaSolicitudDeOtro() throws Exception {
        // La solicitud 3 de los datos de demostración pertenece al docente, no a la estudiante.
        mvc.perform(con(get("/api/solicitudes/3"), token("estudiante@uni.edu.pe")))
                .andExpect(status().isForbidden());
    }

    @Test
    void elTecnicoRecibeUnaNotificacionAlSerAsignado() throws Exception {
        String estudiante = token("estudiante@uni.edu.pe");
        String supervisor = token("supervisor@uni.edu.pe");
        String tecnico = token("tecnico@uni.edu.pe");

        long antes = json.readTree(mvc.perform(con(get("/api/notificaciones"), tecnico))
                .andReturn().getResponse().getContentAsString()).get("noLeidas").asLong();

        String creada = mvc.perform(con(post("/api/solicitudes"), estudiante)
                        .content("{\"categoriaId\":1,\"prioridadId\":2,\"ubicacion\":\"Aula 410\","
                                + "\"descripcion\":\"El ventilador del aula 410 hace mucho ruido.\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(creada).get("id").asLong();

        // El supervisor fue avisado de la nueva solicitud
        mvc.perform(con(get("/api/notificaciones"), supervisor))
                .andExpect(jsonPath("$.items[0].mensaje", containsString("por evaluar")));

        mvc.perform(con(patch("/api/solicitudes/" + id + "/estado"), supervisor).content("{\"estado\":\"EN_EVALUACION\"}"));
        JsonNode tecnicos = json.readTree(mvc.perform(con(get("/api/usuarios?rol=TECNICO"), supervisor))
                .andReturn().getResponse().getContentAsString());
        long tecnicoId = 0;
        for (JsonNode t : tecnicos) if (t.get("correo").asText().equals("tecnico@uni.edu.pe")) tecnicoId = t.get("id").asLong();
        mvc.perform(con(patch("/api/solicitudes/" + id + "/asignacion"), supervisor).content("{\"tecnicoId\":" + tecnicoId + "}"))
                .andExpect(status().isOk());

        String bandeja = mvc.perform(con(get("/api/notificaciones"), tecnico))
                .andExpect(jsonPath("$.noLeidas").value((int) antes + 1))
                .andExpect(jsonPath("$.items[0].mensaje", startsWith("Se te asignó la solicitud SOL-")))
                .andReturn().getResponse().getContentAsString();
        long notifId = json.readTree(bandeja).get("items").get(0).get("id").asLong();

        mvc.perform(con(patch("/api/notificaciones/" + notifId + "/leida"), tecnico)).andExpect(status().isNoContent());
        mvc.perform(con(patch("/api/notificaciones/leidas"), tecnico)).andExpect(status().isNoContent());
        mvc.perform(con(get("/api/notificaciones"), tecnico)).andExpect(jsonPath("$.noLeidas").value(0));

        // Nadie puede marcar como leída la notificación de otra persona
        mvc.perform(con(patch("/api/notificaciones/" + notifId + "/leida"), estudiante)).andExpect(status().isNotFound());
    }

    @Test
    void elHealthCheckEsPublicoParaLosContenedores() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void laDocumentacionOpenApiEstaDisponible() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("SIGSU API"))
                .andExpect(jsonPath("$.paths['/api/solicitudes']").exists());
    }
}
