# Autenticación

El sistema de autenticación utiliza **JWT (JSON Web Tokens)** con el algoritmo **HS512**. Los tokens se pueden enviar como cookie HTTP o como header `Authorization`.

## Resumen del Flujo

```mermaid
sequenceDiagram
    participant C as Cliente
    participant S as Servidor
    participant KV as Deno KV

    Note over C,KV: Registro
    C->>S: POST /auth/signup {user, password, email}
    S->>KV: existsUser(email)
    alt usuario existe
        S-->>C: 400 {message: "User already exists"}
    else usuario nuevo
        S->>S: hash(password) con scrypt
        S->>KV: save(user)
        S->>S: createJWT(email) - exp 72h
        S-->>C: 200 {user, token, email} + Set-Cookie
    end

    Note over C,KV: Login
    C->>S: POST /auth/login {email, password}
    S->>KV: get(email)
    alt usuario no existe
        S-->>C: 400 {message: "User not found"}
    else password incorrecta
        S->>S: verify(password, hash)
        S-->>C: 400 {message: "Invalid password"}
    else credenciales válidas
        S->>S: createJWT(email)
        S-->>C: 200 {user, token, email} + Set-Cookie
    end

    Note over C,KV: Acceso protegido
    C->>S: GET /notes/ + Cookie o Authorization header
    S->>S: jwtVerify(token)
    alt token inválido
        S-->>C: 401 {message: "Unauthorized"}
    else token válido
        S->>KV: existsUser(email)
        S-->>C: 200 [datos del usuario]
    end
```

## Token JWT

### Claims

| Claim | Tipo | Descripción |
|-------|------|-------------|
| `email` | string | Email del usuario |
| `iat` | number | Timestamp de emisión |
| `exp` | number | Timestamp de expiración (72 horas después de `iat`) |

### Header del JWT

```json
{
  "alg": "HS512",
  "typ": "JWT"
}
```

### Cookie

| Propiedad | Valor |
|-----------|-------|
| Nombre | `authorization` |
| Path | `/` |
| SameSite | `None` |
| Secure | `true` |
| Expiración | 3 días |

## Métodos de Autenticación

### 1. Cookie (automática)

Al hacer login o signup, se establece automáticamente la cookie `authorization`. Para requests subsecuentes, la cookie se envía automáticamente en navegadores:

```javascript
// La cookie se envía automáticamente
const response = await fetch('https://bible-api.deno.dev/notes/', {
  credentials: 'include',
});
```

### 2. Header Authorization

Enviar el token en el header `Authorization` con el prefijo `Bearer`:

```javascript
const response = await fetch('https://bible-api.deno.dev/notes/', {
  headers: {
    'Authorization': 'Bearer <tu-token-jwt>',
  },
});
```

```bash
curl -H "Authorization: Bearer <tu-token-jwt>" https://bible-api.deno.dev/notes/
```

## Endpoints

### Registro

```http
POST /auth/signup
Content-Type: application/json

{
  "user": "nombre_usuario",
  "password": "contraseña_mínimo_8_caracteres",
  "email": "correo@ejemplo.com"
}
```

- El email se convierte a minúsculas automáticamente
- La contraseña se hashea con **scrypt** antes de almacenarse
- Se retorna el JWT en la respuesta y se establece como cookie

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "correo@ejemplo.com",
  "password": "tu_contraseña"
}
```

### Logout

```http
GET /auth/logout
```

Elimina la cookie `authorization`.

### Obtener Info del Usuario

```http
GET /user/
Authorization: Bearer <jwt>
```

**Response:**
```json
{
  "email": "correo@ejemplo.com",
  "id": "uuid",
  "tag": "nombre_usuario",
  "active": true
}
```

## Endpoints Protegidos

Los siguientes endpoints requieren autenticación:

| Método | Ruta | Middleware |
|--------|------|------------|
| `GET` | `/notes/` | `isAuthenticated` |
| `POST` | `/notes/create` | `isAuthenticated` |
| `GET` | `/notes/:id` | `isAuthenticated` |
| `PUT` | `/notes/:id` | `isAuthenticated` |
| `DELETE` | `/notes/:id` | `isAuthenticated` |
| `GET` | `/user/` | `isAuthenticated` |

### Flujo de Verificación

```mermaid
flowchart TD
    A[Request a endpoint protegido] --> B{Cookie o Authorization header?}
    B -->|No| C[401 Unauthorized]
    B -->|Sí| D[Extraer token]
    D --> E[jwtVerify token]
    E -->|Error| C
    E -->|OK| F{Payload válido?}
    F -->|No email o exp| C
    F -->|Sí| G[existsUser en Deno KV]
    G -->|No existe| C
    G -->|Existe| H[next - continuar]
```

## Ejemplos Rápidos

### Registro con curl

```bash
curl -X POST https://bible-api.deno.dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"user":"mi_usuario","password":"mi_password_seguro","email":"mi@email.com"}' \
  -c cookies.txt -v
```

### Login con curl

```bash
curl -X POST https://bible-api.deno.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mi@email.com","password":"mi_password_seguro"}' \
  -c cookies.txt -v
```

### Acceder a notas (con cookie)

```bash
curl https://bible-api.deno.dev/notes/ -b cookies.txt
```

### Acceder a notas (con header)

```bash
curl https://bible-api.deno.dev/notes/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
```
