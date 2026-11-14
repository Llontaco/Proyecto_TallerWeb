# language: es
Característica: EP-06 Calidad, seguridad y despliegue
  Para entregar con confianza
  Como equipo de desarrollo
  Queremos automatizar la construcción, las pruebas y el despliegue

  # HU-18 Pipeline CI/CD
  Escenario: Pull request con pruebas fallidas
    Dado que un integrante abre un pull request hacia "develop"
    Cuando una prueba unitaria falla
    Entonces el pipeline marca el pull request en rojo
    Y no se permite hacer merge

  Escenario: Despliegue automático
    Dado que se hace merge a la rama "main"
    Cuando el pipeline termina en verde
    Entonces se construyen las imágenes Docker del frontend y del backend
    Y se despliegan en el ambiente de producción

  Escenario: Secretos fuera del código
    Cuando se ejecuta el análisis estático (SAST) del repositorio
    Entonces no se encuentra ninguna contraseña, token ni cadena de conexión en el código fuente

  Escenario: Contraseñas protegidas
    Cuando se registra un usuario
    Entonces la contraseña se guarda cifrada con BCrypt y nunca se devuelve en la API
