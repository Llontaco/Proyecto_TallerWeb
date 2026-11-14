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

/**
 * Prueba de integración del flujo end-to-end del MVP contra la API real (H2 en memoria):
 * login → registrar → consultar → evaluar → asignar → atender → resolver → cerrar.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FlujoSolicitudIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private String token(String correo) throws Exception {
        String res = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"" + correo + "\",\"password\":\"Prueba123\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("token").asText();
    }

    private MockHttpServletRequestBuilder con(MockHttpServletRequestBuilder req, String token) {
        return req.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
    }

    @Test
    void credencialesIncorrectasDevuelven401SinRevelarCualFallo() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"estudiante@uni.edu.pe\",\"password\":\"mala\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Correo o contraseña incorrectos"));
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mvc.perform(get("/api/solicitudes")).andExpect(status().isUnauthorized());
    }

    @Test
    void solicitudIncompletaDevuelve400ConErrorPorCampo() throws Exception {
        mvc.perform(con(post("/api/solicitudes"), token("estudiante@uni.edu.pe"))
                        .content("{\"categoriaId\":1,\"prioridadId\":1,\"ubicacion\":\"Aula\",\"descripcion\":\"corta\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.descripcion").exists());
    }

    @Test
    void estudianteNoPuedeVerElDashboard() throws Exception {
        mvc.perform(con(get("/api/dashboard"), token("estudiante@uni.edu.pe"))).andExpect(status().isForbidden());
    }

    @Test
    void flujoCompletoDeUnaSolicitud() throws Exception {
        String estudiante = token("estudiante@uni.edu.pe");
        String supervisor = token("supervisor@uni.edu.pe");
        String tecnico = token("tecnico@uni.edu.pe");

        // Registrar
        String creada = mvc.perform(con(post("/api/solicitudes"), estudiante)
                        .content("{\"categoriaId\":1,\"prioridadId\":2,\"ubicacion\":\"Aula 305\","
                                + "\"descripcion\":\"La puerta del aula 305 no cierra correctamente.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo", matchesPattern("SOL-\\d{4}-\\d{5}")))
                .andExpect(jsonPath("$.estado").value("REGISTRADA"))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(creada).get("id").asLong();

        // Salto no permitido
        mvc.perform(con(patch("/api/solicitudes/" + id + "/estado"), supervisor).content("{\"estado\":\"RESUELTA\"}"))
                .andExpect(status().isUnprocessableEntity());

        // El estudiante no puede asignar
        mvc.perform(con(patch("/api/solicitudes/" + id + "/asignacion"), estudiante).content("{\"tecnicoId\":3}"))
                .andExpect(status().isForbidden());

        // Evaluar y asignar
        mvc.perform(con(patch("/api/solicitudes/" + id + "/estado"), supervisor).content("{\"estado\":\"EN_EVALUACION\"}"))
                .andExpect(jsonPath("$.estado").value("EN_EVALUACION"));
        JsonNode tecnicos = json.readTree(mvc.perform(con(get("/api/usuarios?rol=TECNICO"), supervisor))
                .andReturn().getResponse().getContentAsString());
        long tecnicoId = 0;
        for (JsonNode t : tecnicos) if (t.get("correo").asText().equals("tecnico@uni.edu.pe")) tecnicoId = t.get("id").asLong();
        mvc.perform(con(patch("/api/solicitudes/" + id + "/asignacion"), supervisor).content("{\"tecnicoId\":" + tecnicoId + "}"))
                .andExpect(jsonPath("$.estado").value("ASIGNADA"))
                .andExpect(jsonPath("$.tecnico").value("Luis Paredes"));

        // Atender y resolver
        mvc.perform(con(patch("/api/solicitudes/" + id + "/estado"), tecnico).content("{\"estado\":\"EN_ATENCION\"}"))
                .andExpect(status().isOk());
        mvc.perform(con(patch("/api/solicitudes/" + id + "/estado"), tecnico)
                        .content("{\"estado\":\"RESUELTA\",\"comentario\":\"Se cambió la chapa\"}"))
                .andExpect(jsonPath("$.estado").value("RESUELTA"))
                .andExpect(jsonPath("$.fechaResolucion").isNotEmpty())
                .andExpect(jsonPath("$.comentarios", hasSize(1)));

        // Cerrar y consultar historial
        mvc.perform(con(patch("/api/solicitudes/" + id + "/estado"), estudiante).content("{\"estado\":\"CERRADA\"}"))
                .andExpect(jsonPath("$.estado").value("CERRADA"))
                .andExpect(jsonPath("$.historial", hasSize(6)));

        // Una solicitud cerrada ya no se puede eliminar
        mvc.perform(con(delete("/api/solicitudes/" + id), estudiante)).andExpect(status().isUnprocessableEntity());
    }

    @Test
    void crudDeCategoriasPorAdministrador() throws Exception {
        String admin = token("admin@uni.edu.pe");
        String res = mvc.perform(con(post("/api/categorias"), admin).content("{\"nombre\":\"Limpieza\",\"areaId\":1}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(res).get("id").asLong();
        mvc.perform(con(put("/api/categorias/" + id), admin).content("{\"nombre\":\"Limpieza y aseo\",\"areaId\":1}"))
                .andExpect(jsonPath("$.nombre").value("Limpieza y aseo"));
        mvc.perform(con(post("/api/categorias"), admin).content("{\"nombre\":\"limpieza y aseo\",\"areaId\":1}"))
                .andExpect(status().isConflict());
        mvc.perform(con(delete("/api/categorias/" + id), admin)).andExpect(status().isNoContent());
        mvc.perform(con(delete("/api/categorias/1"), admin)).andExpect(status().isConflict());
        mvc.perform(con(post("/api/categorias"), token("supervisor@uni.edu.pe")).content("{\"nombre\":\"Otra\",\"areaId\":1}"))
                .andExpect(status().isForbidden());
    }
}
