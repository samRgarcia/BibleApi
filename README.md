# Bible API / API Bíblica

> [!NOTE]
> This API is still in development. If you found a bug or want to request documentation, create an issue in this repository.
>
> Esta API aún está en desarrollo. Si encuentras un bug o deseas solicitar documentación, crea un issue en este repositorio.

## Documentation / Documentación

| Document | Descripción |
|----------|-------------|
| [Architecture / Arquitectura](docs/architecture.md) | Project structure, flow diagrams, and layers / Estructura del proyecto, diagramas de flujo y capas |
| [API Reference / Referencia de API](docs/api-reference.md) | Complete endpoint documentation / Documentación completa de todos los endpoints |
| [Authentication / Autenticación](docs/authentication.md) | Registration, login, and protected endpoints guide / Guía de registro, login y endpoints protegidos |
| [Data Models / Modelos de Datos](docs/data-models.md) | Schemas, types, and database structure / Esquemas, tipos y estructura de bases de datos |

## Examples / Ejemplos

| Language / Lenguaje | File / Archivo |
|---------------------|----------------|
| [cURL](docs/examples/curl.md) | HTTP request examples with curl |
| [Python](docs/examples/python.md) | Examples with `requests` and `asyncio` |
| [JavaScript](docs/examples/javascript.md) | Examples with `fetch` (Node.js and browser) |
| [Go](docs/examples/golang.md) | Examples with `net/http` and full client |
| [Elixir](docs/examples/elixir.md) | Examples with `Req`, `Task`, and GenServer |
| [Java](docs/examples/java.md) | Examples with `HttpClient` (Java 11+) and Jackson |
| [C#](docs/examples/csharp.md) | Examples with `HttpClient` and `System.Text.Json` |

## Available Bible Versions / Versiones Disponibles

| Code | Name / Nombre |
|------|---------------|
| `rv1960` | Reina Valera 1960 |
| `rv1995` | Reina Valera 1995 |
| `nvi` | Nueva Versión Internacional |
| `dhh` | Dios Habla Hoy |
| `pdt` | Palabra de Dios para Todos |
| `kjv` | King James Version |

---

## Endpoints

_Get chapter book / Obtener capítulo de libro_

```
/api/read/<version>/<book>/<chapter>
```

```ts
enum Version {
  "rv1960",
  "rv1995",
  "dhh",
  "nvi",
  "pdt",
  "kjv"
}
```

- Examples / Ejemplos

```
GET /api/read/rv1960/genesis/1
GET /api/read/nvi/apocalipsis/22
```

Live example: https://bible-api.deno.dev/api/read/rv1960/genesis/1

### Search query / Búsqueda

```
/api/read/<version>/search?q=Dios&testament=old&take=5&page=4
```

_query is required / query es requerido_

```ts
interface Parameters {
  q: string
  testament?: string
  take?: number
  page?: number
}
```

- Examples / Ejemplos

```
GET /api/read/nvi/search?q=Dios
GET /api/read/nvi/search?q=Dios&page=2
GET /api/read/nvi/search?q=Dios&page=2&take=3
```

Live example: https://bible-api.deno.dev/api/read/nvi/search?q=Dios

---

## Quick Start / Inicio Rápido

### Get Genesis 1 (Reina Valera 1960) / Obtener Génesis 1 (Reina Valera 1960)

```bash
curl https://bible-api.deno.dev/api/read/rv1960/genesis/1
```

### Search "Dios" in NVI / Buscar "Dios" en NVI

```bash
curl "https://bible-api.deno.dev/api/read/nvi/search?q=Dios&testament=old&take=5"
```

## Technologies / Tecnologías

- **Runtime:** [Deno](https://deno.land/)
- **Framework:** [Hono](https://hono.dev/)
- **Database (verses):** PostgreSQL
- **Database (users/notes):** Deno KV
- **Validation:** [Zod](https://zod.dev/)
- **Authentication:** JWT with `jose`

## Development / Desarrollo

### Dev server / Servidor de desarrollo

```bash
deno task dev
```

### Scrape / Scraping

```bash
deno task scrape
```
