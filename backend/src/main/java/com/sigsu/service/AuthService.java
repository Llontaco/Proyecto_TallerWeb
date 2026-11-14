package com.sigsu.service;

import com.sigsu.domain.Rol;
import com.sigsu.domain.Usuario;
import com.sigsu.dto.AuthDtos.CambioPasswordRequest;
import com.sigsu.dto.AuthDtos.LoginRequest;
import com.sigsu.dto.AuthDtos.LoginResponse;
import com.sigsu.dto.AuthDtos.RegistroRequest;
import com.sigsu.dto.UsuarioDto;
import com.sigsu.exception.ApiException;
import com.sigsu.repository.UsuarioRepository;
import com.sigsu.security.JwtService;
import com.sigsu.security.LoginAttemptService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String CREDENCIALES_INVALIDAS = "Correo o contraseña incorrectos";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String dominioInstitucional;
    private final LoginAttemptService intentos;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder, JwtService jwtService,
                       @Value("${app.correo.dominio}") String dominioInstitucional, LoginAttemptService intentos) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.intentos = intentos;
        this.dominioInstitucional = dominioInstitucional.toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        intentos.verificar(req.correo());
        Usuario u = usuarios.findByCorreoIgnoreCase(req.correo().trim())
                .filter(Usuario::isActivo)
                .filter(x -> passwordEncoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> {
                    // Mismo mensaje para correo o contraseña incorrectos: no revela cuál falló.
                    intentos.registrarFallo(req.correo());
                    log.warn("Intento de inicio de sesión fallido");
                    return new ApiException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INVALIDAS);
                });
        intentos.registrarExito(req.correo());
        log.info("Inicio de sesión del usuario {}", u.getId());
        return new LoginResponse(jwtService.generar(u), UsuarioDto.de(u));
    }

    @Transactional
    public UsuarioDto registrar(RegistroRequest req) {
        String correo = req.correo().trim().toLowerCase(Locale.ROOT);
        if (!correo.endsWith("@" + dominioInstitucional)) {
            throw ApiException.campoInvalido("correo", "Usa tu correo institucional (@" + dominioInstitucional + ")");
        }
        if (usuarios.existsByCorreoIgnoreCase(correo)) {
            throw ApiException.conflicto("El correo ya está registrado");
        }
        Usuario nuevo = new Usuario(req.nombre().trim(), correo, passwordEncoder.encode(req.password()),
                req.tipo(), Rol.ESTUDIANTE);
        return UsuarioDto.de(usuarios.save(nuevo));
    }

    @Transactional(readOnly = true)
    public UsuarioDto actual(Long usuarioId) {
        return usuarios.findById(usuarioId).map(UsuarioDto::de)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sesión no válida o expirada"));
    }

    @Transactional
    public void cambiarPassword(Long usuarioId, CambioPasswordRequest req) {
        Usuario u = usuarios.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sesión no válida o expirada"));
        if (!passwordEncoder.matches(req.actual(), u.getPasswordHash())) {
            throw ApiException.campoInvalido("actual", "La contraseña actual no es correcta");
        }
        u.setPasswordHash(passwordEncoder.encode(req.nueva()));
    }
}
