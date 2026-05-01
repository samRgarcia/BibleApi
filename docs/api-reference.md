# Referencia de API

## URL Base

```
https://bible-api.deno.dev
```

## Endpoints Públicos

### Health Check

```
GET /api/checkhealth
```

**Response 200:**
```json
{
  "ok": true
}
```

---

### Información General de la API

```
GET /api
```

**Response 200:**
```json
{
  "versions": [
    { "name": "Reina Valera 1960", "version": "rv1960", "uri": "/api/read/rv1960" },
    { "name": "Reina Valera 1995", "version": "rv1995", "uri": "/api/read/rv1995" },
    { "name": "Nueva version internacional", "version": "nvi", "uri": "/api/read/nvi" },
    { "name": "Dios habla hoy", "version": "dhh", "uri": "/api/read/dhh" },
    { "name": "Palabra de Dios para todos", "version": "pdt", "uri": "/api/read/pdt" },
    { "name": "King James Version", "version": "kjv", "uri": "/api/read/kjv" }
  ],
  "endpoints": [
    "/api/read/rv1960/genesis/1",
    "/api/read/rv1995/genesis/1",
    "/api/read/nvi/genesis/1",
    "/api/read/dhh/genesis/1",
    "/api/read/pdt/genesis/1",
    "/api/read/kjv/genesis/1"
  ]
}
```

---

### Listar Versiones

```
GET /api/versions
```

**Response 200:**
```json
[
  { "name": "Reina Valera 1960", "version": "rv1960", "uri": "/api/read/rv1960" },
  { "name": "Reina Valera 1995", "version": "rv1995", "uri": "/api/read/rv1995" },
  { "name": "Nueva version internacional", "version": "nvi", "uri": "/api/read/nvi" },
  { "name": "Dios habla hoy", "version": "dhh", "uri": "/api/read/dhh" },
  { "name": "Palabra de Dios para todos", "version": "pdt", "uri": "/api/read/pdt" },
  { "name": "King James Version", "version": "kjv", "uri": "/api/read/kjv" }
]
```

---

### Listar Libros

#### Todos los libros

```
GET /api/books
```

**Response 200:**
```json
[
  {
    "names": ["Genesis"],
    "abrev": "GN",
    "chapters": 50,
    "testament": "Antiguo Testamento"
  },
  {
    "names": ["Exodo", "Exodus"],
    "abrev": "EX",
    "chapters": 40,
    "testament": "Antiguo Testamento"
  }
]
```

#### Libros del Antiguo Testamento

```
GET /api/books/oldTestament
```

#### Libros del Nuevo Testamento

```
GET /api/books/newTestament
```

---

### Información de un Libro

```
GET /api/book/:book
```

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción | Ejemplos |
|-----------|------|-------------|----------|
| `book` | string | Nombre, abreviación o nombre en inglés | `genesis`, `GN`, `Genesis` |

**Response 200:**
```json
{
  "names": ["Genesis"],
  "abrev": "GN",
  "chapters": 50,
  "testament": "Antiguo Testamento"
}
```

**Errores:**

| Código | Cuerpo |
|--------|--------|
| 400 | `{ "error": "Invalid book", "book": "..." }` |

---

### Endpoints Disponibles por Versión

```
GET /api/read/:version
```

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `version` | string | Versión de la Biblia |

**Versiones válidas:** `rv1960`, `rv1995`, `nvi`, `dhh`, `pdt`, `kjv`

**Response 200:**
```json
[
  {
    "name": "genesis endpoint",
    "info": "/api/book/genesis/",
    "byChapter": "/api/read/rv1960/genesis/1"
  },
  {
    "name": "exodo endpoint",
    "info": "/api/book/exodo/",
    "byChapter": "/api/read/rv1960/exodo/1"
  }
]
```

---

### Obtener Capítulo Completo

```
GET /api/read/:version/:book/:chapter
```

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción | Ejemplos |
|-----------|------|-------------|----------|
| `version` | string | Versión de la Biblia | `rv1960`, `nvi`, `dhh` |
| `book` | string | Nombre del libro | `genesis`, `GN`, `Genesis` |
| `chapter` | number | Número de capítulo | `1`, `22` |

**Response 200:**
```json
{
  "testament": "old",
  "name": "Genesis",
  "num_chapters": 50,
  "chapter": 1,
  "vers": [
    { "verse": "En el principio creó Dios los cielos y la tierra.", "number": 1, "id": 1 },
    { "verse": "Y la tierra estaba desordenada y vacía...", "number": 2, "id": 2 }
  ]
}
```

**Errores:**

| Código | Cuerpo |
|--------|--------|
| 400 | `{ "error": "Invalid version", "version": "..." }` |
| 400 | `{ "error": "Invalid book", "book": "..." }` |
| 400 | `{ "error": "Invalid chapter", "chapter": "...", "max_chapters": 50 }` |
| 404 | `{ "message": "Not Found" }` |

---

### Obtener un Versículo o Rango de Versículos

```
GET /api/read/:version/:book/:chapter/:verse
```

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción | Ejemplos |
|-----------|------|-------------|----------|
| `version` | string | Versión de la Biblia | `rv1960`, `nvi` |
| `book` | string | Nombre del libro | `genesis`, `JN` |
| `chapter` | number | Número de capítulo | `1` |
| `verse` | number/range | Versículo o rango | `1`, `1-5` |

**Response 200 (versículo único):**
```json
{
  "verse": "En el principio creó Dios los cielos y la tierra.",
  "number": 1,
  "id": 1
}
```

**Response 200 (rango de versículos):**
```json
[
  { "verse": "En el principio creó Dios los cielos y la tierra.", "number": 1, "id": 1 },
  { "verse": "Y la tierra estaba desordenada y vacía...", "number": 2, "id": 2 },
  { "verse": "Y dijo Dios: Sea la luz; y fue la luz.", "number": 3, "id": 3 }
]
```

---

### Versículo Aleatorio

```
GET /api/read/:version/verse/random
```

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `version` | string | Versión de la Biblia |

**Query parameters (opcionales):**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `testament` | string | Filtrar por testamento: `old`, `new`, `Antiguo Testamento`, `Nuevo Testamento` |

**Response 200:**
```json
{
  "verse": "Porque de tal manera amó Dios al mundo...",
  "book": "Juan",
  "chapter": 3,
  "number": 16,
  "id": 29876
}
```

---

### Buscar Versículos

```
GET /api/read/:version/search
```

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `version` | string | Versión de la Biblia |

**Query parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `q` | string | **Sí** | - | Término de búsqueda |
| `testament` | string | No | `both` | `old`, `new`, `both` |
| `take` | number | No | `10` | Resultados por página |
| `page` | number | No | `1` | Número de página |

**Response 200:**
```json
{
  "data": [
    {
      "verse": "En el principio creó Dios los cielos y la tierra.",
      "study": null,
      "number": 1,
      "id": 1,
      "book": "Genesis",
      "chapter": 1
    },
    {
      "verse": "...la gloria de Dios...",
      "study": null,
      "number": 5,
      "id": 120,
      "book": "Exodo",
      "chapter": 16
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 4375,
    "pageCount": 438
  }
}
```

**Errores:**

| Código | Cuerpo |
|--------|--------|
| 400 | `{ "error": "query is required", "path": ["q"] }` |
| 400 | `{ "error": "testament must be old, new or both", "path": ["testament"] }` |
| 400 | `{ "errors": [...] }` |

---

### Versículo a Través de Versiones

```
GET /api/verses/across/:book/:chapter/:verse
```

Compara el mismo versículo en 4 versiones: DHH, PDT, RV1960, RV1995.

**Parámetros de ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `book` | string | Nombre del libro |
| `chapter` | number | Número de capítulo |
| `verse` | number | Número de versículo |

**Response 200:**
```json
{
  "results": [
    {
      "verse_dhh": "En el principio Dios creó el cielo y la tierra.",
      "verse_pdt": "En el principio, cuando Dios comenzó a crear el cielo y la tierra,",
      "verse_rv1960": "En el principio creó Dios los cielos y la tierra.",
      "verse_rv1995": "En el principio creó Dios los cielos y la tierra."
    }
  ]
}
```

---

## Endpoints de Autenticación

### Registro

```
POST /auth/signup
```

**Body (JSON):**
```json
{
  "user": "mi_nombre_usuario",
  "password": "mi_contraseña_segura",
  "email": "usuario@ejemplo.com"
}
```

**Response 200:**
```json
{
  "user": "mi_nombre_usuario",
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "email": "usuario@ejemplo.com"
}
```

> Se establece una cookie `authorization` con el JWT (expira en 3 días).

**Errores:**

| Código | Cuerpo |
|--------|--------|
| 400 | `{ "message": "User already exists" }` |
| 500 | `{ "message": "Internal server error" }` |

---

### Login

```
POST /auth/login
```

**Body (JSON):**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "mi_contraseña_segura"
}
```

**Response 200:**
```json
{
  "user": "mi_nombre_usuario",
  "token": "eyJhbGciOiJIUzU1MiIsInR5cCI6IkpXVCJ9...",
  "email": "usuario@ejemplo.com"
}
```

**Errores:**

| Código | Cuerpo |
|--------|--------|
| 400 | `{ "message": "User not found" }` |
| 400 | `{ "message": "Invalid password" }` |

---

### Logout

```
GET /auth/logout
```

**Response 200:**
```json
{
  "message": "Logged out"
}
```

---

### Obtener Información del Usuario

```
GET /user/
```

**Headers requeridos:**

| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <JWT>` |

> También se acepta la cookie `authorization`.

**Response 200:**
```json
{
  "email": "usuario@ejemplo.com",
  "id": "uuid-del-usuario",
  "tag": "mi_nombre_usuario",
  "active": true
}
```

---

### Eliminar Usuario (Admin)

```
POST /admin/user
```

**Body (JSON):**
```json
{
  "email": "usuario@ejemplo.com",
  "ADMIN_PASS": "contraseña_de_administrador"
}
```

**Response 200:**
```json
{
  "deleted": true
}
```

---

## Endpoints de Notas (Requieren Autenticación)

### Listar Notas

```
GET /notes/
```

**Headers requeridos:**

| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <JWT>` |

**Response 200:**
```json
[
  {
    "id": "uuid-nota",
    "title": "Mi estudio sobre Génesis",
    "description": "Notas del capítulo 1",
    "body": "En el principio...",
    "page": "https://bible-api.deno.dev/api/read/rv1960/genesis/1"
  }
]
```

---

### Crear Nota

```
POST /notes/create
```

**Body (JSON):**
```json
{
  "title": "Mi estudio sobre Génesis",
  "description": "Notas del capítulo 1",
  "body": "En el principio creó Dios los cielos y la tierra...",
  "page": "https://bible-api.deno.dev/api/read/rv1960/genesis/1"
}
```

**Validaciones:**

| Campo | Tipo | Mínimo | Opcional |
|-------|------|--------|----------|
| `title` | string | 8 caracteres | No |
| `description` | string | 10 caracteres | No |
| `body` | string | 20 caracteres | No |
| `page` | string (URL) | - | Sí |

**Response 201:**
```json
{
  "created": true,
  "id": "uuid-de-la-nueva-nota"
}
```

---

### Obtener Nota por ID

```
GET /notes/:id
```

**Response 200:**
```json
{
  "id": "uuid-nota",
  "title": "Mi estudio sobre Génesis",
  "description": "Notas del capítulo 1",
  "body": "En el principio..."
}
```

**Errores:**

| Código | Cuerpo |
|--------|--------|
| 404 | `{ "message": "Note not found" }` |

---

### Editar Nota

```
PUT /notes/:id
```

**Body (JSON):**
```json
{
  "title": "Título actualizado",
  "description": "Descripción actualizada",
  "body": "Contenido actualizado"
}
```

**Response 200:**
```json
{
  "edited": true
}
```

---

### Eliminar Nota

```
DELETE /notes/:id
```

**Response 200:**
```json
{
  "deleted": true
}
```

---

## Tabla Resumen de Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/checkhealth` | No | Health check |
| `GET` | `/api` | No | Info general |
| `GET` | `/api/versions` | No | Listar versiones |
| `GET` | `/api/books` | No | Todos los libros |
| `GET` | `/api/books/oldTestament` | No | Libros AT |
| `GET` | `/api/books/newTestament` | No | Libros NT |
| `GET` | `/api/book/:book` | No | Info de un libro |
| `GET` | `/api/read/:version` | No | Endpoints de versión |
| `GET` | `/api/read/:version/:book/:chapter` | No | Capítulo completo |
| `GET` | `/api/read/:version/:book/:chapter/:verse` | No | Versículo o rango |
| `GET` | `/api/read/:version/verse/random` | No | Versículo aleatorio |
| `GET` | `/api/read/:version/search` | No | Búsqueda |
| `GET` | `/api/verses/across/:book/:chapter/:verse` | No | Comparar versiones |
| `POST` | `/auth/signup` | No | Registro |
| `POST` | `/auth/login` | No | Login |
| `GET` | `/auth/logout` | No | Logout |
| `GET` | `/user/` | Sí | Info del usuario |
| `POST` | `/admin/user` | No (admin pass) | Eliminar usuario |
| `GET` | `/notes/` | Sí | Listar notas |
| `POST` | `/notes/create` | Sí | Crear nota |
| `GET` | `/notes/:id` | Sí | Obtener nota |
| `PUT` | `/notes/:id` | Sí | Editar nota |
| `DELETE` | `/notes/:id` | Sí | Eliminar nota |
