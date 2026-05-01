# Ejemplos en JavaScript

Los ejemplos usan `fetch`, disponible tanto en navegadores como en Node.js (v18+).

---

## Consultas Públicas

### Health Check

```javascript
const BASE_URL = "https://bible-api.deno.dev";

const response = await fetch(`${BASE_URL}/api/checkhealth`);
const data = await response.json();
console.log(data);
// { ok: true }
```

---

### Obtener Versiones Disponibles

```javascript
const response = await fetch(`${BASE_URL}/api/versions`);
const versions = await response.json();

versions.forEach((v) => {
  console.log(`${v.version}: ${v.name}`);
});
```

---

### Obtener un Capítulo Completo

```javascript
async function getChapter(version, book, chapter) {
  const response = await fetch(
    `${BASE_URL}/api/read/${version}/${book}/${chapter}`
  );

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Ejemplo: Génesis 1 (RV1960)
const chapter = await getChapter("rv1960", "genesis", 1);

console.log(`Libro: ${chapter.name}`);
console.log(`Capítulo: ${chapter.chapter}`);
console.log(`Testamento: ${chapter.testament}`);
console.log(`Total versículos: ${chapter.vers.length}\n`);

for (const verse of chapter.vers) {
  console.log(`${verse.number}. ${verse.verse}`);
}
```

---

### Obtener un Versículo

```javascript
async function getVerse(version, book, chapter, verse) {
  const response = await fetch(
    `${BASE_URL}/api/read/${version}/${book}/${chapter}/${verse}`
  );

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

// Juan 3:16 en NVI
const verse = await getVerse("nvi", "juan", 3, 16);
console.log(`${verse.book} ${verse.chapter}:${verse.number}`);
console.log(verse.verse);
```

### Obtener un Rango de Versículos

```javascript
async function getVerseRange(version, book, chapter, start, end) {
  const response = await fetch(
    `${BASE_URL}/api/read/${version}/${book}/${chapter}/${start}-${end}`
  );

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

// Génesis 1:1-3
const verses = await getVerseRange("rv1960", "genesis", 1, 1, 3);
verses.forEach((v) => console.log(`${v.number}. ${v.verse}`));
```

---

### Búsqueda

```javascript
async function search(version, query, options = {}) {
  const { testament = "both", take = 10, page = 1 } = options;

  const params = new URLSearchParams({
    q: query,
    testament,
    take: String(take),
    page: String(page),
  });

  const response = await fetch(
    `${BASE_URL}/api/read/${version}/search?${params}`
  );

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

// Buscar "amor" en el Nuevo Testamento (NVI)
const results = await search("nvi", "amor", { testament: "new", take: 5 });

console.log(`Total resultados: ${results.meta.total}`);
console.log(`Página: ${results.meta.page} de ${results.meta.pageCount}`);
console.log();

for (const v of results.data) {
  console.log(`[${v.book} ${v.chapter}:${v.number}] ${v.verse}`);
}
```

---

### Versículo Aleatorio

```javascript
async function randomVerse(version, options = {}) {
  const params = new URLSearchParams();
  if (options.testament) {
    params.set("testament", options.testament);
  }

  const response = await fetch(
    `${BASE_URL}/api/read/${version}/verse/random?${params}`
  );

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

// Versículo aleatorio
const v = await randomVerse("rv1960");
console.log(`${v.book} ${v.chapter}:${v.number}`);
console.log(v.verse);

// Versículo aleatorio del Nuevo Testamento
const v2 = await randomVerse("rv1960", { testament: "new" });
console.log(`${v2.book} ${v2.chapter}:${v2.number}`);
console.log(v2.verse);
```

---

### Comparar Versiones

```javascript
async function compareVersions(book, chapter, verse) {
  const response = await fetch(
    `${BASE_URL}/api/verses/across/${book}/${chapter}/${verse}`
  );

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

// Génesis 1:1 en todas las versiones
const result = await compareVersions("genesis", 1, 1);

result.results.forEach((r) => {
  console.log(`DHH:     ${r.verse_dhh}`);
  console.log(`PDT:     ${r.verse_pdt}`);
  console.log(`RV1960:  ${r.verse_rv1960}`);
  console.log(`RV1995:  ${r.verse_rv1995}`);
});
```

---

## Autenticación

### Registro

```javascript
async function signup(user, password, email) {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, password, email }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

const result = await signup("mi_usuario", "contraseña_segura", "mi@email.com");
console.log(`Token: ${result.token}`);
```

### Login

```javascript
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }

  return response.json();
}

const result = await login("mi@email.com", "mi_contraseña");
console.log(`Usuario: ${result.user}`);
console.log(`Token: ${result.token}`);
```

---

## Notas (Requieren Auth)

### Cliente con Autenticación

```javascript
class BibleClient {
  constructor(token = null) {
    this.baseURL = "https://bible-api.deno.dev";
    this.token = token;
  }

  _headers() {
    const headers = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async _request(method, path, body = null) {
    const options = {
      method,
      headers: this._headers(),
      credentials: "include",
    };

    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseURL}${path}`, options);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // === Consultas públicas ===

  getChapter(version, book, chapter) {
    return this._request("GET", `/api/read/${version}/${book}/${chapter}`);
  }

  getVerse(version, book, chapter, verse) {
    return this._request(
      "GET",
      `/api/read/${version}/${book}/${chapter}/${verse}`
    );
  }

  search(version, query, options = {}) {
    const { testament = "both", take = 10, page = 1 } = options;
    const params = new URLSearchParams({
      q: query,
      testament,
      take: String(take),
      page: String(page),
    });
    return this._request("GET", `/api/read/${version}/search?${params}`);
  }

  randomVerse(version, options = {}) {
    const params = new URLSearchParams();
    if (options.testament) {
      params.set("testament", options.testament);
    }
    return this._request(
      "GET",
      `/api/read/${version}/verse/random?${params}`
    );
  }

  // === Autenticación ===

  async login(email, password) {
    const data = await this._request("POST", "/auth/login", {
      email,
      password,
    });
    this.token = data.token;
    return data;
  }

  async signup(user, password, email) {
    const data = await this._request("POST", "/auth/signup", {
      user,
      password,
      email,
    });
    this.token = data.token;
    return data;
  }

  // === Notas ===

  getNotes() {
    return this._request("GET", "/notes/");
  }

  createNote(title, description, body, page = null) {
    const data = { title, description, body };
    if (page) data.page = page;
    return this._request("POST", "/notes/create", data);
  }

  getNote(id) {
    return this._request("GET", `/notes/${id}`);
  }

  editNote(id, title, description, body) {
    return this._request("PUT", `/notes/${id}`, {
      title,
      description,
      body,
    });
  }

  deleteNote(id) {
    return this._request("DELETE", `/notes/${id}`);
  }
}
```

### Uso del Cliente

```javascript
// Cliente sin autenticación
const client = new BibleClient();

// Obtener un capítulo
const chapter = await client.getChapter("rv1960", "genesis", 1);
console.log(`${chapter.name} capítulo ${chapter.chapter}`);

// Buscar
const results = await client.search("nvi", "fe", { testament: "new", take: 3 });
results.data.forEach((v) => {
  console.log(`[${v.book} ${v.chapter}:${v.number}] ${v.verse}`);
});

// Login
await client.login("mi@email.com", "mi_contraseña");

// Crear nota
const note = await client.createNote(
  "Estudio de Génesis",
  "Notas sobre la creación",
  "En el principio creó Dios los cielos y la tierra...",
  "https://bible-api.deno.dev/api/read/rv1960/genesis/1"
);
console.log(`Nota creada con ID: ${note.id}`);

// Listar notas
const notes = await client.getNotes();
notes.forEach((n) => console.log(`- ${n.title}`));
```

---

## Node.js (CommonJS)

Si usas CommonJS en Node.js, puedes usar `node-fetch`:

```bash
npm install node-fetch@3
```

```javascript
import fetch from "node-fetch";

const BASE_URL = "https://bible-api.deno.dev";

async function getChapter(version, book, chapter) {
  const response = await fetch(
    `${BASE_URL}/api/read/${version}/${book}/${chapter}`
  );
  return response.json();
}

getChapter("rv1960", "genesis", 1).then(console.log);
```

---

## Múltiples Consultas en Paralelo

```javascript
// Obtener el primer capítulo de cada evangelio en paralelo
const evangelios = await Promise.all([
  fetch(`${BASE_URL}/api/read/rv1960/mateo/1`).then((r) => r.json()),
  fetch(`${BASE_URL}/api/read/rv1960/marcos/1`).then((r) => r.json()),
  fetch(`${BASE_URL}/api/read/rv1960/lucas/1`).then((r) => r.json()),
  fetch(`${BASE_URL}/api/read/rv1960/juan/1`).then((r) => r.json()),
]);

evangelios.forEach((cap) => {
  console.log(`${cap.name} - ${cap.vers.length} versículos`);
});
```

---

## Versículo del Día (Ejemplo Completo)

```javascript
const VERSIONS = ["rv1960", "nvi", "dhh"];

async function verseOfTheDay() {
  // Seleccionar versión basada en el día
  const dayIndex = new Date().getDay() % VERSIONS.length;
  const version = VERSIONS[dayIndex];

  // Obtener versículo aleatorio
  const response = await fetch(
    `https://bible-api.deno.dev/api/read/${version}/verse/random`
  );
  const verse = await response.json();

  // Formatear salida
  const separator = "=".repeat(50);
  console.log(separator);
  console.log(`  VERSÍCULO DEL DÍA (${version.toUpperCase()})`);
  console.log(separator);
  console.log();
  console.log(`  📖 ${verse.book} ${verse.chapter}:${verse.number}`);
  console.log();
  console.log(`  "${verse.verse}"`);
  console.log();
  console.log(separator);
}

await verseOfTheDay();
```
