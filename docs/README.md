# Bible API - Documentación

API REST para consultar textos bíblicos en múltiples versiones en español e inglés.

> **Nota:** Esta API está en desarrollo. Si encuentras un bug o deseas solicitar documentación, crea un issue en el repositorio.

## Tabla de Contenidos

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura](architecture.md) | Estructura del proyecto, diagramas de flujo y capas |
| [Referencia de API](api-reference.md) | Documentación completa de todos los endpoints |
| [Autenticación](authentication.md) | Guía de registro, login y endpoints protegidos |
| [Modelos de Datos](data-models.md) | Esquemas, tipos y estructura de bases de datos |

## Ejemplos de Uso

| Lenguaje | Archivo |
|----------|---------|
| [cURL](examples/curl.md) | Ejemplos de peticiones HTTP con curl |
| [Python](examples/python.md) | Ejemplos con la librería `requests` y `asyncio` |
| [JavaScript](examples/javascript.md) | Ejemplos con `fetch` (Node.js y navegador) |
| [Go](examples/golang.md) | Ejemplos con `net/http` y cliente completo |
| [Elixir](examples/elixir.md) | Ejemplos con `Req`, `Task` y GenServer |
| [Java](examples/java.md) | Ejemplos con `HttpClient` (Java 11+) y Jackson |
| [C#](examples/csharp.md) | Ejemplos con `HttpClient` y `System.Text.Json` |

## Versiones Disponibles

| Código | Nombre |
|--------|--------|
| `rv1960` | Reina Valera 1960 |
| `rv1995` | Reina Valera 1995 |
| `nvi` | Nueva Versión Internacional |
| `dhh` | Dios Habla Hoy |
| `pdt` | Palabra de Dios para Todos |
| `kjv` | King James Version |

## Inicio Rápido

### Servidor de desarrollo

```bash
deno task dev
```

### Ejemplo: Obtener Génesis 1 (Reina Valera 1960)

```bash
curl https://bible-api.deno.dev/api/read/rv1960/genesis/1
```

### Ejemplo: Buscar "Dios" en NVI

```bash
curl "https://bible-api.deno.dev/api/read/nvi/search?q=Dios&testament=old&take=5"
```

## Tecnologías

- **Runtime:** [Deno](https://deno.land/)
- **Framework:** [Hono](https://hono.dev/)
- **Base de datos (versículos):** PostgreSQL
- **Base de datos (usuarios/notas):** Deno KV
- **Validación:** [Zod](https://zod.dev/)
- **Autenticación:** JWT con `jose`
