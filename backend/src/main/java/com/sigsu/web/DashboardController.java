package com.sigsu.web;

import com.sigsu.dto.DashboardDto;
import com.sigsu.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Indicadores de atención en un rango de fechas")
    @PreAuthorize("hasAnyRole('SUPERVISOR','ADMIN')")
    public DashboardDto indicadores(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return service.indicadores(
                desde == null ? null : desde.atStartOfDay().toInstant(ZoneOffset.UTC),
                hasta == null ? null : hasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC));
    }
}
