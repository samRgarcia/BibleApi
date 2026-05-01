# Ejemplos con cURL

## Consultas Públicas

### Health Check

```bash
curl https://bible-api.deno.dev/api/checkhealth
```

**Response:**
```json
{ "ok": true }
```

---

### Obtener Todas las Versiones

```bash
curl https://bible-api.deno.dev/api/versions
```

---

### Listar Todos los Libros

```bash
curl https://bible-api.deno.dev/api/books
```

### Libros del Antiguo Testamento

```bash
curl https://bible-api.deno.dev/api/books/oldTestament
```

### Libros del Nuevo Testamento

```bash
curl https://bible-api.deno.dev/api/books/newTestament
```

---

### Información de un Libro

```bash
curl https://bible-api.deno.dev/api/book/genesis
```

Con abreviación:
```bash
curl https://bible-api.deno.dev/api/book/GN
```

---

### Obtener un Capítulo Completo

```bash
curl https://bible-api.deno.dev/api/read/rv1960/genesis/1
```

Con NVI:
```bash
curl https://bible-api.deno.dev/api/read/nvi/apocalipsis/22
```

Con abreviación de libro:
```bash
curl https://bible-api.deno.dev/api/read/rv1960/JN/1
```

---

### Obtener un Versículo

```bash
curl https://bible-api.deno.dev/api/read/rv1960/genesis/1/1
```

### Obtener un Rango de Versículos

```bash
curl https://bible-api.deno.dev/api/read/rv1960/genesis/1/1-5
```

---

### Versículo Aleatorio

```bash
curl https://bible-api.deno.dev/api/read/rv1960/verse/random
```

Versículo aleatorio del Antiguo Testamento:
```bash
curl "https://bible-api.deno.dev/api/read/rv1960/verse/random?testament=old"
```

Versículo aleatorio del Nuevo Testamento:
```bash
curl "https://bible-api.deno.dev/api/read/rv1960/verse/random?testament=new"
```

---

### Búsqueda de Versículos

Buscar "Dios" en RV1960:
```bash
curl "https://bible-api.deno.dev/api/read/rv1960/search?q=Dios"
```

Buscar con paginación y filtro por testamento:
```bash
curl "https://bible-api.deno.dev/api/read/nvi/search?q=Dios&testament=old&take=5&page=2"
```

Buscar "amor" en el Nuevo Testamento, 3 resultados:
```bash
curl "https://bible-api.deno.dev/api/read/rv1960/search?q=amor&testament=new&take=3"
```

---

### Comparar Versículo en Múltiples Versiones

```bash
curl https://bible-api.deno.dev/api/verses/across/genesis/1/1
```

---

## Autenticación

### Registro

```bash
curl -X POST https://bible-api.deno.dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"user":"mi_usuario","password":"contraseña_segura","email":"mi@email.com"}' \
  -c cookies.txt -v
```

> La flag `-c cookies.txt` guarda las cookies. La flag `-v` muestra el response headers para ver el `Set-Cookie`.

### Login

```bash
curl -X POST https://bible-api.deno.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mi@email.com","password":"contraseña_segura"}' \
  -c cookies.txt -v
```

### Logout

```bash
curl https://bible-api.deno.dev/auth/logout -b cookies.txt -v
```

### Obtener Info del Usuario

```bash
curl https://bible-api.deno.dev/user/ -b cookies.txt
```

---

## Notas (Requieren Auth)

### Listar Notas

```bash
curl https://bible-api.deno.dev/notes/ -b cookies.txt
```

### Crear Nota

```bash
curl -X POST https://bible-api.deno.dev/notes/create \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Estudio de Génesis 1",
    "description": "Notas sobre la creación",
    "body": "En el principio creó Dios los cielos y la tierra. Este versículo establece...",
    "page": "https://bible-api.deno.dev/api/read/rv1960/genesis/1"
  }'
```

### Obtener Nota por ID

```bash
curl https://bible-api.deno.dev/notes/<id-de-la-nota> -b cookies.txt
```

### Editar Nota

```bash
curl -X PUT https://bible-api.deno.dev/notes/<id-de-la-nota> \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Estudio Actualizado",
    "description": "Descripción actualizada",
    "body": "Contenido actualizado del estudio..."
  }'
```

### Eliminar Nota

```bash
curl -X DELETE https://bible-api.deno.dev/notes/<id-de-la-nota> -b cookies.txt
```

---

## Usando Token en Header (sin cookies)

Después de login/signup, extraer el token y usarlo en el header:

```bash
# Guardar el token
TOKEN="eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."

# Usar en requests
curl https://bible-api.deno.dev/notes/ \
  -H "Authorization: Bearer $TOKEN"
```

### Login y Extraer Token Automáticamente

```bash
# Login y capturar token
TOKEN=$(curl -s -X POST https://bible-api.deno.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mi@email.com","password":"contraseña_segura"}' \
  | jq -r '.token')

# Usar token
curl https://bible-api.deno.dev/notes/ \
  -H "Authorization: Bearer $TOKEN"
```
