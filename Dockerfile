# Imagen base ligera con Bun
FROM oven/bun:1.1-alpine

WORKDIR /app

# Copiar dependencias primero (mejor cache)
COPY bun.lock package.json ./
RUN bun install

# Copiar código
COPY . .
ENV TEST_ENV=algodeprueba
# Exponer puerto (ajusta si usas otro)
EXPOSE 3000

# Comando de arranque
CMD ["bun", "run", "start"]
