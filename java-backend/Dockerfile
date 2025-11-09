# Dockerfile – multi-stage, works on Render
# -------------------------------------------------
# 1. Build stage – Maven + JDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
# Build the JAR (skip tests – faster on Render)
RUN ./mvnw clean package -DskipTests

# 2. Runtime stage – tiny JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render injects $PORT
ENV PORT=8080
EXPOSE $PORT

ENTRYPOINT ["java","-jar","app.jar"]
