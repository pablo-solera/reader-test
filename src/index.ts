// server.ts
import { serve } from "bun";
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

// ========================================
// Configurar Registro de Métricas
// ========================================

const register = new Registry();

// Métricas del sistema (CPU, memoria, event loop)
collectDefaultMetrics({
    register,
    timeout: 5000
});

// ========================================
// Métricas Personalizadas
// ========================================

// 1. COUNTER: Total de requests
const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total de HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

// 2. HISTOGRAM: Duración de requests
const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de HTTP requests en segundos',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register]
});

// 3. GAUGE: Usuarios activos
const activeUsers = new Gauge({
    name: 'active_users',
    help: 'Número de usuarios activos actualmente',
    registers: [register]
});

// 4. COUNTER: Errores totales
const errorsTotal = new Counter({
    name: 'errors_total',
    help: 'Total de errores',
    labelNames: ['type', 'route'],
    registers: [register]
});

// 5. GAUGE: Conexiones a base de datos
const dbConnections = new Gauge({
    name: 'database_connections',
    help: 'Conexiones activas a la base de datos',
    registers: [register]
});

// 6. HISTOGRAM: Queries a la DB
const dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duración de queries a la base de datos',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [register]
});

// ========================================
// Helper para Medir Duración
// ========================================

function measureDuration(histogram: Histogram, labels: Record<string, string>) {
    const start = performance.now();

    return () => {
        const duration = (performance.now() - start) / 1000;
        histogram.observe(labels, duration);
    };
}

// ========================================
// Router Simple
// ========================================

const routes = {
    // Endpoint de métricas para Prometheus
    '/metrics': async () => {
        const metrics = await register.metrics();
        return new Response(metrics, {
            headers: { 'Content-Type': register.contentType }
        });
    },

    // Endpoint de health check
    '/health': async () => {
        return Response.json({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    },

    // Ejemplo: API de usuarios
    '/api/users': async () => {
        const endTimer = measureDuration(httpRequestDuration, {
            method: 'GET',
            route: '/api/users',
            status_code: '200'
        });

        // Simular usuarios activos
        activeUsers.set(Math.floor(Math.random() * 100) + 50);

        const users = [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Charlie' }
        ];

        endTimer();
        return Response.json(users);
    },

    // Ejemplo: Crear usuario (con DB simulada)
    '/api/users/create': async () => {
        const endTimer = measureDuration(httpRequestDuration, {
            method: 'POST',
            route: '/api/users/create',
            status_code: '201'
        });

        // Simular query a DB
        const endDbTimer = measureDuration(dbQueryDuration, {
            operation: 'INSERT',
            table: 'users'
        });

        dbConnections.inc();

        // Simular latencia de DB
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

        dbConnections.dec();
        endDbTimer();

        const user = { id: Date.now(), name: 'New User' };

        endTimer();
        return Response.json(user, { status: 201 });
    },

    // Ejemplo: Endpoint con error
    '/api/error': async () => {
        errorsTotal.inc({
            type: 'server_error',
            route: '/api/error'
        });

        httpRequestsTotal.inc({
            method: 'GET',
            route: '/api/error',
            status_code: '500'
        });

        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
};

// ========================================
// Servidor HTTP
// ========================================

const server = serve({
    port: 3001,

    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;

        // Encontrar ruta
        const handler = routes[path as keyof typeof routes];

        if (handler) {
            try {
                const response = await handler();

                // Registrar métrica de request exitoso
                if (!path.startsWith('/metrics')) {
                    httpRequestsTotal.inc({
                        method,
                        route: path,
                        status_code: String(response.status)
                    });
                }

                return response;
            } catch (error) {
                console.error('Error:', error);

                // Registrar error
                errorsTotal.inc({
                    type: 'unhandled_exception',
                    route: path
                });

                return Response.json(
                    { error: 'Internal Server Error' },
                    { status: 500 }
                );
            }
        }

        // 404 Not Found
        httpRequestsTotal.inc({
            method,
            route: path,
            status_code: '404'
        });

        return Response.json(
            { error: 'Not Found' },
            { status: 404 }
        );
    }
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
console.log(`📊 Metrics available at http://localhost:${server.port}/metrics`);