package com.sigsu.repository;

import com.sigsu.domain.Notificacion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    @EntityGraph(attributePaths = "solicitud")
    List<Notificacion> findByUsuarioIdOrderByFechaDesc(Long usuarioId, Pageable pagina);

    long countByUsuarioIdAndLeidaFalse(Long usuarioId);

    Optional<Notificacion> findByIdAndUsuarioId(Long id, Long usuarioId);

    @Modifying
    @Query("update Notificacion n set n.leida = true where n.usuario.id = :usuarioId and n.leida = false")
    int marcarTodasLeidas(Long usuarioId);

    @Modifying
    @Query("delete from Notificacion n where n.solicitud.id = :solicitudId")
    void eliminarDeSolicitud(Long solicitudId);
}
