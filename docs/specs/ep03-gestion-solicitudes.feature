# language: es
Característica: EP-03 Gestión de solicitudes
  Para que cada solicitud tenga responsable y avance hasta cerrarse
  Como supervisor y técnico
  Quiero evaluar, asignar y cambiar el estado de las solicitudes

  Flujo de estados:
    Registrada → En evaluación → Asignada → En atención → Resuelta → Cerrada

  # HU-09 Evaluar y priorizar
  Escenario: Pasar a evaluación
    Dado que el supervisor ve una solicitud "Registrada"
    Cuando pulsa "Pasar a evaluación"
    Entonces la solicitud queda "En evaluación"
    Y el historial registra quién y cuándo hizo el cambio

  # HU-10 Asignar responsable
  Escenario: Asignación correcta
    Dado que el supervisor ve una solicitud en estado "En evaluación"
    Cuando selecciona un técnico, define la prioridad "Alta" y confirma
    Entonces la solicitud pasa a estado "Asignada"
    Y el técnico la ve en su bandeja
    Y se registra el cambio en el historial

  Escenario: Asignar sin evaluar
    Dado que una solicitud está "Registrada"
    Cuando el supervisor intenta asignarla
    Entonces el sistema responde 422 "Primero pasa la solicitud a \"En evaluación\""

  Escenario: Usuario sin permiso
    Dado que un estudiante está autenticado
    Cuando intenta asignar un responsable mediante la API
    Entonces el sistema responde 403 Forbidden

  # HU-11 Cambiar estado
  Escenario: Transición válida
    Dado que el técnico tiene una solicitud "Asignada"
    Cuando la cambia a "En atención"
    Entonces el sistema guarda el nuevo estado con fecha y hora

  Escenario: Resolver con comentario
    Dado que el técnico tiene una solicitud "En atención"
    Cuando la marca como "Resuelta" con el comentario "Se cambió la chapa"
    Entonces la solicitud queda "Resuelta" con fecha de resolución
    Y el comentario aparece en la solicitud

  Escenario: Transición no permitida
    Dado que una solicitud está en estado "Registrada"
    Cuando se intenta cambiarla directamente a "Resuelta"
    Entonces el sistema rechaza el cambio con el mensaje "Transición de estado no permitida"

  Escenario: El solicitante confirma el cierre
    Dado que la solicitud del estudiante está "Resuelta"
    Cuando el estudiante pulsa "Confirmar y cerrar"
    Entonces la solicitud queda "Cerrada"

  # HU-12 Comentarios
  Escenario: Agregar comentario
    Dado que el usuario puede ver la solicitud
    Cuando escribe un comentario y pulsa "Comentar"
    Entonces el comentario aparece con su nombre y la fecha

  Escenario: Comentario vacío
    Cuando pulsa "Comentar" sin escribir texto
    Entonces el sistema muestra "Escribe un comentario"

  # HU-13 Notificaciones
  Escenario: Notificar cambio de estado
    Dado que la solicitud "SOL-2026-00001" pertenece a "estudiante@uni.edu.pe"
    Cuando su estado cambia a "Resuelta"
    Entonces el sistema envía un correo al solicitante con el código y el nuevo estado
    Y muestra una notificación dentro de la aplicación
