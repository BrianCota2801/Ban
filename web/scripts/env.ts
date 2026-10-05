// Carga .env para los scripts de línea de comandos (Next lo hace solo).
try {
  process.loadEnvFile(".env");
} catch {
  // Sin archivo .env: se usan las variables del sistema.
}
