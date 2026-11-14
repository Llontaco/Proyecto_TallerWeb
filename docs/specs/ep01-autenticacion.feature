# language: es
Característica: EP-01 Autenticación y roles
  Para proteger la información de las solicitudes
  Como universidad
  Quiero que solo usuarios registrados y con el rol adecuado accedan al sistema

  # HU-01 Registro de usuario
  Escenario: Registro correcto
    Dado que el visitante está en la página de registro
    Cuando ingresa nombre "Ana Quispe", correo "ana@uni.edu.pe" y una contraseña de 8 caracteres
    Entonces el sistema crea la cuenta con rol "Estudiante"
    Y lo redirige al inicio de sesión con el mensaje "Cuenta creada"

  Escenario: Correo ya registrado
    Dado que existe una cuenta con el correo "estudiante@uni.edu.pe"
    Cuando un visitante intenta registrarse con ese correo
    Entonces el sistema muestra "El correo ya está registrado"
    Y no crea una nueva cuenta

  Escenario: Correo no institucional
    Dado que el visitante está en la página de registro
    Cuando ingresa el correo "ana@gmail.com"
    Entonces el sistema muestra "Usa tu correo institucional (@uni.edu.pe)"

  # HU-02 Inicio de sesión
  Escenario: Credenciales correctas
    Dado que el usuario tiene una cuenta activa
    Cuando ingresa su correo y contraseña correctos
    Entonces el sistema genera un token JWT
    Y lo dirige al panel correspondiente a su rol

  Escenario: Credenciales incorrectas
    Dado que el usuario está en la pantalla de login
    Cuando ingresa una contraseña incorrecta
    Entonces el sistema muestra "Correo o contraseña incorrectos"
    Y no revela cuál de los dos datos falló

  # HU-03 Cambio de contraseña
  Escenario: Cambio de contraseña correcto
    Dado que el usuario está autenticado
    Cuando ingresa su contraseña actual y una nueva de al menos 8 caracteres
    Entonces el sistema actualiza la contraseña
    Y le pide iniciar sesión nuevamente

  # HU-04 Acceso por rol
  Esquema del escenario: Cada rol ve solo sus opciones
    Dado que un usuario con rol "<rol>" inicia sesión
    Entonces el menú muestra "<opciones>"
    Y no puede abrir la página "<prohibida>"

    Ejemplos:
      | rol           | opciones                                   | prohibida       |
      | Estudiante    | Mis solicitudes, Nueva solicitud           | Dashboard       |
      | Técnico       | Mis asignaciones                           | Administración  |
      | Supervisor    | Dashboard, Solicitudes                     | Administración  |
      | Administrador | Dashboard, Solicitudes, Administración     | Nueva solicitud |

  Escenario: Token expirado
    Dado que el token del usuario expiró
    Cuando realiza cualquier petición a la API
    Entonces el sistema responde 401
    Y lo redirige al inicio de sesión
