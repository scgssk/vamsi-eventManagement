# ---- Build Stage ----
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /build

# Copy only the backend folder (assuming Dockerfile is inside it)
COPY . .

# Explicitly point Maven to the pom.xml file
RUN mvn -f /build/pom.xml clean package -DskipTests

# ---- Runtime Stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

ENV PORT=8001
EXPOSE 8001

CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]
