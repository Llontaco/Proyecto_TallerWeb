package com.sigsu.dto;

import java.util.Map;

public record DashboardDto(long registradas, long pendientes, long atendidas, int porcentajeResueltas,
                           double tiempoPromedioHoras, long vencidas,
                           Map<String, Long> porEstado, Map<String, Long> porCategoria,
                           Map<String, Long> porPrioridad, Map<String, Long> porResponsable) {
}
