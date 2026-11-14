package com.sigsu.security;

import com.sigsu.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Lee el JWT del header "Authorization: Bearer ..." (Postman, pruebas de API)
 * o de la cookie HttpOnly (navegador) y autentica la petición.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarios;
    private final AuthCookieService cookies;

    public JwtAuthFilter(JwtService jwtService, UsuarioRepository usuarios, AuthCookieService cookies) {
        this.jwtService = jwtService;
        this.usuarios = usuarios;
        this.cookies = cookies;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        extraerToken(request)
                .flatMap(jwtService::validar)
                .flatMap(usuarios::findById)
                .filter(u -> u.isActivo())
                .ifPresent(u -> {
                    var principal = UsuarioAutenticado.de(u);
                    var auth = new UsernamePasswordAuthenticationToken(principal, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + u.getRol().name())));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
        chain.doFilter(request, response);
    }

    private Optional<String> extraerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return Optional.of(header.substring(7));
        }
        Cookie[] lista = request.getCookies();
        if (lista == null) return Optional.empty();
        return Arrays.stream(lista)
                .filter(c -> cookies.getNombre().equals(c.getName()) && !c.getValue().isBlank())
                .map(Cookie::getValue)
                .findFirst();
    }
}
