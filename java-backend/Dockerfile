# Dockerfile (multi-stage build for clean JAR)
FROM maven:3.9.6-openjdk-17 AS build
WORKDIR /app
COPY . .
# Build JAR (skip tests for speed)
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM openjdk:17-jre-slim
WORKDIR /app
# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar
# Render sets PORT env var
EXPOSE ${PORT:-8001}
ENTRYPOINT ["java", "-jar", "app.jar"]