# language: es
Característica: EP-02 Registro de solicitudes
  Para informar problemas o pedir servicios sin correos ni llamadas
  Como solicitante (estudiante, docente o personal administrativo)
  Quiero registrar y consultar mis solicitudes

  Antecedentes:
    Dado que el estudiante "estudiante@uni.edu.pe" está autenticado

  # HU-05 Registrar solicitud
  Escenario: Registro correcto
    Cuando registra una solicitud con todos los datos obligatorios
    Entonces el sistema debe registrar la solicitud
    Y generar un código único con formato "SOL-AAAA-NNNNN"
    Y mostrar el estado "Registrada"

  Escenario: Datos incompletos
    Dado que el estudiante está registrando una solicitud
    Cuando omite un campo obligatorio
    Entonces el sistema debe mostrar un mensaje de validación junto al campo
    Y no debe registrar la solicitud

  Escenario: Descripción demasiado corta
    Cuando escribe una descripción de menos de 20 caracteres
    Entonces el sistema muestra "Describe el problema con al menos 20 caracteres"

  # HU-06 Evidencias
  Escenario: Adjuntar evidencias válidas
    Cuando adjunta 2 imágenes JPG de 1 MB cada una
    Entonces la solicitud se registra con 2 evidencias

  Escenario: Archivo demasiado grande
    Cuando adjunta un PDF de 8 MB
    Entonces el sistema muestra "Cada archivo debe pesar como máximo 5 MB"
    Y no registra la solicitud

  Escenario: Formato no permitido
    Cuando adjunta un archivo ".exe"
    Entonces el sistema muestra "Solo se permiten JPG, PNG o PDF"

  # HU-07 Listar mis solicitudes
  Escenario: Ver solo mis solicitudes
    Dado que existen solicitudes de otros usuarios
    Cuando abre "Mis solicitudes"
    Entonces solo ve las solicitudes que él registró, de la más reciente a la más antigua

  Escenario: Filtrar por estado
    Cuando filtra por el estado "Resuelta"
    Entonces solo ve solicitudes en estado "Resuelta"

  # HU-08 Detalle e historial
  Escenario: Ver detalle de una solicitud propia
    Cuando abre la solicitud "SOL-2026-00001"
    Entonces ve categoría, ubicación, prioridad, responsable, evidencias, comentarios e historial

  Escenario: Intentar ver una solicitud ajena
    Cuando intenta abrir una solicitud registrada por otro usuario
    Entonces el sistema responde 403 "No tienes acceso a esta solicitud"
