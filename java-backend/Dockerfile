# ---- Build Stage ----
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy entire project (no caching)
COPY . .

# Build the Spring Boot jar (skip tests to speed up)
RUN mvn clean package -DskipTests

# ---- Runtime Stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose Render’s dynamic port
ENV PORT=8001
EXPOSE 8001

# Run Spring Boot app
CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]
