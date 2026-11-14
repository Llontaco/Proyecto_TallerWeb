# language: es
Característica: EP-05 Administración
  Para adaptar el sistema a la organización de la universidad
  Como administrador
  Quiero gestionar usuarios, roles y catálogos

  Antecedentes:
    Dado que el administrador está autenticado

  # HU-16 Usuarios y roles
  Escenario: Cambiar rol de un usuario
    Dado que "tecnico2@uni.edu.pe" tiene rol "Técnico"
    Cuando el administrador le asigna el rol "Supervisor"
    Entonces el usuario ve las opciones de Supervisor en su próximo inicio de sesión

  Escenario: Desactivar usuario
    Cuando el administrador desactiva a un usuario
    Entonces ese usuario ya no puede iniciar sesión

  # HU-17 Catálogos
  Escenario: Crear categoría
    Cuando crea la categoría "Limpieza" asociada al área "Mantenimiento e Infraestructura"
    Entonces la categoría aparece en el formulario de nueva solicitud

  Escenario: Categoría duplicada
    Dado que existe la categoría "Mantenimiento"
    Cuando intenta crear otra categoría llamada "mantenimiento"
    Entonces el sistema muestra "La categoría ya existe"

  Escenario: Eliminar categoría en uso
    Dado que hay solicitudes con la categoría "Mantenimiento"
    Cuando intenta eliminarla
    Entonces el sistema muestra "No se puede eliminar: hay solicitudes con esta categoría"

  Escenario: Configurar tiempo máximo de una prioridad
    Cuando cambia el tiempo máximo de la prioridad "Alta" a 48 horas
    Entonces el cálculo de solicitudes vencidas usa 48 horas para las solicitudes Altas
