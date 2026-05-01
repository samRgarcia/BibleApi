# Arquitectura

## Visión General

BibleApi es una API REST construida con **Deno** y el framework **Hono**. Sigue un patrón MVC-like con separación clara de responsabilidades en routers, controllers, middlewares y validators.

## Diagrama de Arquitectura

```mermaid
graph TB
    subgraph "Cliente"
        Web[Aplicación Web]
        Mobile[Aplicación Móvil]
        CLI[cURL / Scripts]
    end

    subgraph "Bible API (Deno + Hono)"
        Main[src/main.ts]
        App[src/mod.ts]
        CORS[CORS Middleware]

        subgraph "Routers Públicos"
            RBook[/api/book/]
            RRead[/api/read/]
            RVerses[/api/verses/]
        end

        subgraph "Routers Protegidos"
            RNotes[/notes/]
            RUser[/user/]
        end

        subgraph "Routers de Auth"
            RAuth[auth signup login logout]
        end

        subgraph "Middlewares"
            Auth[isAuthenticated]
            Token[getToken]
            GetUser[getUser]
        end

        subgraph "Validators"
            VBook[Book Validator]
            VVersion[Version Validator]
            VSearch[Search Validator]
        end

        subgraph "Controllers"
            CBook[Book Controller]
            CRead[Read Controller]
            CVerses[Verses Controller]
            CNotes[Notes Controller]
            CAuth[Auth Controller]
            CUser[User Controller]
        end

        subgraph "Utils"
            UBook[Book Utils]
        end
    end

    subgraph "Bases de Datos"
        PG[(PostgreSQL<br/>verses_*)]
        KV[(Deno KV<br/>users, notes)]
    end

    Web --> Main
    Mobile --> Main
    CLI --> Main

    Main --> App
    App --> CORS
    CORS --> RBook
    CORS --> RRead
    CORS --> RVerses
    CORS --> RNotes
    CORS --> RUser
    CORS --> RAuth

    RAuth --> CAuth
    RBook --> VBook --> CBook
    RRead --> VVersion --> VBook --> CRead
    RRead --> VSearch --> CRead
    RVerses --> CVerses

    RNotes --> Auth
    RUser --> Auth
    Auth --> Token --> GetUser

    CBook --> UBook
    CRead --> UBook
    CRead --> PG
    CVerses --> PG

    RNotes --> CNotes --> KV
    CAuth --> KV
    CUser --> KV
    GetUser --> KV
```

## Flujo de Consulta de Versículos

```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as Router
    participant V as Validator (Zod)
    participant Ctrl as Controller
    participant U as Utils (book.ts)
    participant PG as PostgreSQL

    C->>R: GET /api/read/rv1960/genesis/1
    R->>V: validar parámetros
    V->>U: existBook("genesis")
    U-->>V: true
    V->>V: validVersion("rv1960")
    V-->>R: params válidos
    R->>Ctrl: getChapterVersion()
    Ctrl->>U: getInfoBook("genesis")
    U-->>Ctrl: { names, chapters, testament }
    Ctrl->>Ctrl: getVersionTable("rv1960")
    Ctrl->>PG: SELECT verse, number, id<br/>FROM verses_rv1960<br/>JOIN chapters JOIN books
    PG-->>Ctrl: [{ verse, number, id }, ...]
    Ctrl->>Ctrl: deleteNullValues()
    Ctrl-->>R: { testament, name, num_chapters, chapter, vers }
    R-->>C: JSON 200
```

## Flujo de Autenticación y Acceso Protegido

```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as Router
    participant Ctrl as Auth Controller
    participant KV as Deno KV
    participant JWT as JWT (jose)
    participant M as Middleware
    participant PN as Protected Endpoint

    Note over C,PN: === REGISTRO (signup) ===
    C->>R: POST /auth/signup {user, password, email}
    R->>Ctrl: signup()
    Ctrl->>KV: existsUser(email)
    KV-->>Ctrl: false
    Ctrl->>Ctrl: hash(password) con scrypt
    Ctrl->>KV: save(user)
    Ctrl->>JWT: createJWT(email)
    JWT-->>Ctrl: token string
    Ctrl-->>C: {user, token, email} + Set-Cookie

    Note over C,PN: === LOGIN ===
    C->>R: POST /auth/login {email, password}
    R->>Ctrl: login()
    Ctrl->>KV: get(email)
    KV-->>Ctrl: {user, password, id}
    Ctrl->>Ctrl: verify(password, hash)
    Ctrl->>JWT: createJWT(email)
    Ctrl-->>C: {user, token, email} + Set-Cookie

    Note over C,PN: === ACCESO ENDPOINT PROTEGIDO ===
    C->>M: GET /notes/ + Cookie/Authorization header
    M->>JWT: jwtVerify(token)
    JWT-->>M: payload {email, exp}
    M->>KV: existsUser(email)
    KV-->>M: true
    M-->>PN: next()
    PN->>KV: get(["notes", user.id])
    KV-->>PN: [{title, description, body, id}, ...]
    PN-->>C: JSON 200
```

## Flujo de Búsqueda

```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as Router
    participant VQ as Query Validator
    participant VP as Param Validator
    participant Ctrl as Search Controller
    participant PG as PostgreSQL

    C->>R: GET /api/read/nvi/search?q=Dios&testament=old&take=5&page=2
    R->>VP: validar version "nvi"
    VP-->>R: válido
    R->>VQ: validar query params
    VQ-->>R: {q:"Dios", testament:"old", take:5, page:2}
    R->>Ctrl: SearchVersion()
    Ctrl->>Ctrl: dbSearch({version, query, take, page, testament})
    Ctrl->>Ctrl: getVersionTable("nvi") -> "verses_nvi"
    Ctrl->>PG: SELECT ... WHERE UNACCENT(LOWER(verse)) LIKE '%dios%'<br/>AND testament = 'old'
    PG-->>Ctrl: [{verse, study, number, id, book, chapter}, ...]
    Ctrl->>Ctrl: paginar resultados
    Ctrl-->>R: {data:[...], meta:{page, pageSize, total, pageCount}}
    R-->>C: JSON 200
```

## Diagrama de Bases de Datos

```mermaid
erDiagram
    BOOKS {
        int id PK
        string name
        string testament
    }

    CHAPTERS {
        int id PK
        int book_id FK
        int number
        string testament
    }

    VERSES_RV1960 {
        int id PK
        int chapter_id FK
        int number
        string verse
        string study
    }

    VERSES_RV1995 {
        int id PK
        int chapter_id FK
        int number
        string verse
        string study
    }

    VERSES_NVI {
        int id PK
        int chapter_id FK
        int number
        string verse
        string study
    }

    VERSES_DHH {
        int id PK
        int chapter_id FK
        int number
        string verse
        string study
    }

    VERSES_PDT {
        int id PK
        int chapter_id FK
        int number
        string verse
        string study
    }

    VERSES_KJV {
        int id PK
        int chapter_id FK
        int number
        string verse
        string study
    }

    BOOKS ||--o{ CHAPTERS : "has"
    CHAPTERS ||--o{ VERSES_RV1960 : "contains"
    CHAPTERS ||--o{ VERSES_RV1995 : "contains"
    CHAPTERS ||--o{ VERSES_NVI : "contains"
    CHAPTERS ||--o{ VERSES_DHH : "contains"
    CHAPTERS ||--o{ VERSES_PDT : "contains"
    CHAPTERS ||--o{ VERSES_KJV : "contains"
```

```mermaid
graph LR
    subgraph "Deno KV - Usuarios"
        UE["users_by_email", email] --> UD{UserData<br/>user, password, email, id, active}
        UU["users", username] --> UD2{UserData}
    end

    subgraph "Deno KV - Notas"
        NK["notes", user.id] --> ND[Note[]<br/>title, description, body, id, page?]
    end

    UD -. same data .-> UD2
```

## Estructura del Proyecto

```
BibleApi/
├── src/
│   ├── main.ts                 # Punto de entrada (Deno.serve)
│   ├── mod.ts                  # Configuración de la app Hono + rutas
│   ├── constants.ts            # Libros, versiones, esquemas Zod
│   ├── userRepository.ts       # Repositorio de usuarios (Deno KV)
│   │
│   ├── routers/
│   │   ├── api/
│   │   │   ├── book.ts         # Rutas /api/book/*
│   │   │   ├── read.ts         # Rutas /api/read/*
│   │   │   ├── verses.ts       # Rutas /api/verses/*
│   │   │   └── notes.ts        # Rutas /notes/*
│   │   └── auth/
│   │       ├── index.ts        # Rutas /auth/signup, /login, /logout
│   │       └── user.ts         # Rutas /user/*
│   │
│   ├── controllers/
│   │   ├── api/
│   │   │   ├── book.ts         # getBookInfo, getBooks, getTestamentBooks
│   │   │   ├── read.ts         # getChapterVersion, getOneVerseVersion, SearchVersion
│   │   │   ├── verses.ts       # GetAcrossVersions
│   │   │   ├── version.ts      # getVersions
│   │   │   └── random.ts       # randomVerse
│   │   ├── auth/
│   │   │   ├── index.ts        # signup, login, logout
│   │   │   └── user.ts         # getUserInfo, deleteUser
│   │   └── notes.ts            # CRUD de notas
│   │
│   ├── middlewares/
│   │   ├── authorization.ts    # isAuthenticated, getToken
│   │   ├── user.ts             # getUser desde JWT
│   │   └── search.ts           # Middleware de búsqueda
│   │
│   ├── validators/
│   │   ├── book.ts             # validación de libro y capítulo
│   │   ├── version.ts          # validación de versión
│   │   ├── search.ts           # validación de query params
│   │   └── mod.ts              # Exportaciones
│   │
│   ├── database/
│   │   ├── index.ts            # Conexión PostgreSQL
│   │   └── cache.ts            # Cache Redis (implementado, no activo)
│   │
│   ├── utils/
│   │   └── book.ts             # Utilidades de libros (abreviaciones, testamentos)
│   │
│   └── scraping/
│       ├── scrape.ts           # Scraping base
│       ├── search.ts           # Scraping de búsqueda
│       └── logger.ts           # Logger para scraping
│
├── scripts/
│   ├── scrapeVersion.ts        # Script para scrapea versión
│   └── fillVersionDB.ts        # Script para llenar BD
│
├── tests/
│   ├── book.test.ts
│   ├── verses.test.ts
│   ├── search.test.ts
│   ├── setup.ts
│   └── test.hurl
│
├── deno.json                   # Configuración de Deno y tareas
├── import_map.json             # Import map de Deno
├── Dockerfile                  # Imagen Docker
└── README.md
```
