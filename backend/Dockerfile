# syntax=docker/dockerfile:1
# ---------- Etapa 1: compilación con Maven ----------
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
# Primero solo el pom: las dependencias quedan en caché mientras no cambie
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package && cp target/sigsu-backend-*.jar app.jar

# ---------- Etapa 2: imagen de ejecución mínima ----------
FROM eclipse-temurin:25-jre-alpine
LABEL org.opencontainers.image.title="sigsu-backend" \
      org.opencontainers.image.description="API REST de SIGSU (Spring Boot)"

# Usuario sin privilegios: el proceso nunca corre como root
RUN addgroup -S sigsu && adduser -S -G sigsu sigsu \
    && mkdir -p /app/uploads && chown -R sigsu:sigsu /app
WORKDIR /app
COPY --from=build --chown=sigsu:sigsu /app/app.jar app.jar
USER sigsu

ENV SPRING_PROFILES_ACTIVE=prod \
    UPLOADS_DIR=/app/uploads \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
VOLUME ["/app/uploads"]

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
