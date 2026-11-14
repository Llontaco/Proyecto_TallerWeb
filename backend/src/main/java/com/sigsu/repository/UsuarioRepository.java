package com.sigsu.repository;

import com.sigsu.domain.Rol;
import com.sigsu.domain.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    @EntityGraph(attributePaths = "area")
    List<Usuario> findAllByOrderByNombreAsc();

    @EntityGraph(attributePaths = "area")
    List<Usuario> findByRolAndActivoTrueOrderByNombreAsc(Rol rol);
}
