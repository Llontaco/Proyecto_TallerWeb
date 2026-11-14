package com.sigsu.service;

import com.sigsu.domain.EstadoSolicitud;
import com.sigsu.domain.Solicitud;
import com.sigsu.dto.DashboardDto;
import com.sigsu.repository.SolicitudRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final SolicitudRepository solicitudes;

    public DashboardService(SolicitudRepository solicitudes) {
        this.solicitudes = solicitudes;
    }

    @Transactional(readOnly = true)
    public DashboardDto indicadores(Instant desde, Instant hasta) {
        Instant ahora = Instant.now();
        List<Solicitud> todas = solicitudes.findAll().stream()
                .filter(s -> desde == null || !s.getFechaRegistro().isBefore(desde))
                .filter(s -> hasta == null || s.getFechaRegistro().isBefore(hasta))
                .toList();

        List<Solicitud> atendidas = todas.stream().filter(s -> !s.getEstado().estaAbierta()).toList();
        double promedioHoras = atendidas.stream()
                .filter(s -> s.getFechaResolucion() != null)
                .mapToLong(s -> Duration.between(s.getFechaRegistro(), s.getFechaResolucion()).toMinutes())
                .average().orElse(0) / 60.0;

        Map<String, Long> porEstado = new LinkedHashMap<>();
        Arrays.stream(EstadoSolicitud.values()).forEach(e -> porEstado.put(e.getEtiqueta(),
                todas.stream().filter(s -> s.getEstado() == e).count()));

        return new DashboardDto(
                todas.size(),
                todas.size() - atendidas.size(),
                atendidas.size(),
                todas.isEmpty() ? 0 : (int) Math.round(atendidas.size() * 100.0 / todas.size()),
                Math.round(promedioHoras * 10) / 10.0,
                todas.stream().filter(s -> s.estaVencida(ahora)).count(),
                porEstado,
                contar(todas, s -> s.getCategoria().getNombre()),
                contar(todas, s -> s.getPrioridad().getNombre()),
                contar(todas, s -> s.getTecnico() == null ? "Sin asignar" : s.getTecnico().getNombre()));
    }

    /** Agrupa y ordena de mayor a menor. */
    private Map<String, Long> contar(List<Solicitud> lista, Function<Solicitud, String> clave) {
        return lista.stream().collect(Collectors.groupingBy(clave, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
    }
}
