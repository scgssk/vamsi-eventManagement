# Dockerfile – works 100% on Render
# -------------------------------------------------
# 1. Build stage – Maven + JDK 17 (Temurin)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy only what's needed (faster cache)
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .
COPY mvnw.cmd .

# Make mvnw executable (critical!)
RUN chmod +x mvnw

# Download dependencies (cached layer)
RUN ./mvnw dependency:go-offline -B

# Copy source + build
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# 2. Runtime stage – tiny JRE (Alpine)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render sets PORT
EXPOSE $PORT
ENTRYPOINT ["java", "-jar", "app.jar"]
