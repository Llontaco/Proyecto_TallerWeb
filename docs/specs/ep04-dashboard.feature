# language: es
Característica: EP-04 Dashboard de indicadores
  Para medir la calidad del servicio y tomar decisiones con datos
  Como supervisor
  Quiero ver indicadores de atención de las solicitudes

  Antecedentes:
    Dado que el supervisor está autenticado

  # HU-14 Indicadores de volumen
  Escenario: Indicadores generales
    Dado que existen 8 solicitudes, de las cuales 3 están Resueltas o Cerradas
    Cuando abre el dashboard
    Entonces ve "Registradas: 8", "Pendientes: 5", "Atendidas: 3" y "% resueltas: 38%"

  Escenario: Distribuciones
    Cuando abre el dashboard
    Entonces ve la cantidad de solicitudes por estado, por categoría, por prioridad y por responsable

  Escenario: Acceso restringido
    Dado que un estudiante está autenticado
    Cuando intenta abrir el dashboard
    Entonces el sistema lo redirige a "Mis solicitudes" con el mensaje "No tienes permiso para ver esa página"

  # HU-15 Tiempo promedio y vencidas
  Escenario: Tiempo promedio de atención
    Dado que dos solicitudes se resolvieron en 10 y 20 horas
    Cuando abre el dashboard
    Entonces el tiempo promedio de atención es "15 h"

  Escenario: Cálculo de vencidas
    Dado que la prioridad "Alta" tiene un tiempo máximo de 24 horas
    Y existe una solicitud Alta registrada hace 30 horas que no está Resuelta ni Cerrada
    Cuando el supervisor abre el dashboard
    Entonces esa solicitud se cuenta en "Solicitudes vencidas"
    Y aparece marcada como "Vencida" en el listado
