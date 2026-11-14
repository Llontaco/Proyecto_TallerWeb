package com.sigsu.web;

import com.sigsu.dto.AuthDtos.CambioPasswordRequest;
import com.sigsu.dto.AuthDtos.LoginRequest;
import com.sigsu.dto.AuthDtos.LoginResponse;
import com.sigsu.dto.AuthDtos.RegistroRequest;
import com.sigsu.dto.UsuarioDto;
import com.sigsu.security.AuthCookieService;
import com.sigsu.security.JwtService;
import com.sigsu.security.UsuarioAutenticado;
import com.sigsu.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService cookies;
    private final JwtService jwtService;

    public AuthController(AuthService authService, AuthCookieService cookies, JwtService jwtService) {
        this.authService = authService;
        this.cookies = cookies;
        this.jwtService = jwtService;
    }

    /** Devuelve el token en el cuerpo (para clientes de API) y en una cookie HttpOnly (para el navegador). */
    @PostMapping("/login")
    @Operation(summary = "Inicia sesión: devuelve el JWT y lo guarda en una cookie HttpOnly")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        LoginResponse res = authService.login(req);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookies.crear(res.token(), jwtService.getDuracion()).toString())
                .body(res);
    }

    @PostMapping("/registro")
    @Operation(summary = "Registra una cuenta de solicitante con correo institucional")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioDto registro(@Valid @RequestBody RegistroRequest req) {
        return authService.registrar(req);
    }

    @PostMapping("/logout")
    @Operation(summary = "Cierra la sesión borrando la cookie")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.borrar().toString()).build();
    }

    @GetMapping("/me")
    @Operation(summary = "Datos del usuario autenticado")
    public UsuarioDto me(@AuthenticationPrincipal UsuarioAutenticado u) {
        return authService.actual(u.id());
    }

    @PutMapping("/password")
    @Operation(summary = "Cambia la contraseña del usuario autenticado")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarPassword(@AuthenticationPrincipal UsuarioAutenticado u, @Valid @RequestBody CambioPasswordRequest req) {
        authService.cambiarPassword(u.id(), req);
    }
}
