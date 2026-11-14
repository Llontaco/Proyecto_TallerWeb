package com.sigsu.service;

import com.sigsu.service.NotificacionService.NotificacionCreada;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Envía el correo de cada notificación cuando la transacción ya se confirmó y en otro hilo,
 * para que un servidor SMTP lento o caído nunca bloquee ni revierta la operación del usuario.
 */
@Component
public class NotificacionCorreoListener {

    private static final Logger log = LoggerFactory.getLogger(NotificacionCorreoListener.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final boolean habilitado;
    private final String remitente;
    private final String urlFrontend;

    public NotificacionCorreoListener(ObjectProvider<JavaMailSender> mailSender,
                                      @Value("${app.notificaciones.correo-habilitado}") boolean habilitado,
                                      @Value("${app.notificaciones.remitente}") String remitente,
                                      @Value("${app.notificaciones.url-frontend}") String urlFrontend) {
        this.mailSender = mailSender;
        this.habilitado = habilitado;
        this.remitente = remitente;
        this.urlFrontend = urlFrontend;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void enviar(NotificacionCreada evento) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!habilitado || sender == null) {
            log.debug("Correo de notificación omitido (no configurado)");
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(remitente);
            msg.setTo(evento.correo());
            msg.setSubject("SIGSU – " + evento.mensaje());
            msg.setText("Hola " + evento.nombre() + ",\n\n" + evento.mensaje() + ".\n\nRevisa el detalle en "
                    + urlFrontend + "/solicitudes/" + evento.solicitudId() + "\n\nSIGSU");
            sender.send(msg);
            log.info("Correo de notificación enviado para la solicitud {}", evento.solicitudId());
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo de notificación: {}", e.getMessage());
        }
    }
}
