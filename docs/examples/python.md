# Ejemplos en Python

Requiere la librería `requests`:

```bash
pip install requests
```

---

## Consultas Públicas

### Health Check

```python
import requests

BASE_URL = "https://bible-api.deno.dev"

response = requests.get(f"{BASE_URL}/api/checkhealth")
print(response.json())
# {"ok": true}
```

---

### Obtener Versiones Disponibles

```python
response = requests.get(f"{BASE_URL}/api/versions")
versions = response.json()

for v in versions:
    print(f"{v['version']}: {v['name']}")
```

---

### Obtener un Capítulo Completo

```python
def get_chapter(version: str, book: str, chapter: int):
    """Obtiene todos los versículos de un capítulo."""
    url = f"{BASE_URL}/api/read/{version}/{book}/{chapter}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# Ejemplo: Génesis 1 (RV1960)
capitulo = get_chapter("rv1960", "genesis", 1)

print(f"Libro: {capitulo['name']}")
print(f"Capítulo: {capitulo['chapter']}")
print(f"Total versículos: {len(capitulo['vers'])}\n")

for versiculo in capitulo['vers']:
    print(f"{versiculo['number']}. {versiculo['verse']}")
```

---

### Obtener un Versículo

```python
def get_verse(version: str, book: str, chapter: int, verse: int):
    """Obtiene un versículo específico."""
    url = f"{BASE_URL}/api/read/{version}/{book}/{chapter}/{verse}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# Juan 3:16 en NVI
v = get_verse("nvi", "juan", 3, 16)
print(f"{v['number']}. {v['verse']}")
```

### Obtener un Rango de Versículos

```python
def get_verse_range(version: str, book: str, chapter: int, start: int, end: int):
    """Obtiene un rango de versículos."""
    url = f"{BASE_URL}/api/read/{version}/{book}/{chapter}/{start}-{end}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# Génesis 1:1-3
versiculos = get_verse_range("rv1960", "genesis", 1, 1, 3)
for v in versiculos:
    print(f"{v['number']}. {v['verse']}")
```

---

### Búsqueda

```python
def search(version: str, query: str, testament: str = "both", take: int = 10, page: int = 1):
    """Busca versículos que contengan un término."""
    url = f"{BASE_URL}/api/read/{version}/search"
    params = {
        "q": query,
        "testament": testament,
        "take": take,
        "page": page,
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

# Buscar "amor" en el Nuevo Testamento (NVI)
resultados = search("nvi", "amor", testament="new", take=5)

print(f"Total resultados: {resultados['meta']['total']}")
print(f"Página: {resultados['meta']['page']} de {resultados['meta']['pageCount']}")
print()

for v in resultados['data']:
    print(f"[{v['book']} {v['chapter']}:{v['number']}] {v['verse']}")
```

---

### Versículo Aleatorio

```python
import random

def random_verse(version: str, testament: str | None = None):
    """Obtiene un versículo aleatorio."""
    url = f"{BASE_URL}/api/read/{version}/verse/random"
    params = {}
    if testament:
        params["testament"] = testament

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

# Versículo aleatorio
v = random_verse("rv1960")
print(f"{v['book']} {v['chapter']}:{v['number']}")
print(v['verse'])

# Versículo aleatorio del Antiguo Testamento
v = random_verse("rv1960", testament="old")
print(f"{v['book']} {v['chapter']}:{v['number']}")
print(v['verse'])
```

---

### Comparar Versiones

```python
def compare_versions(book: str, chapter: int, verse: int):
    """Compara un versículo en 4 versiones."""
    url = f"{BASE_URL}/api/verses/across/{book}/{chapter}/{verse}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# Génesis 1:1 en todas las versiones
result = compare_versions("genesis", 1, 1)

for r in result['results']:
    print(f"DHH:     {r['verse_dhh']}")
    print(f"PDT:     {r['verse_pdt']}")
    print(f"RV1960:  {r['verse_rv1960']}")
    print(f"RV1995:  {r['verse_rv1995']}")
```

---

## Autenticación

### Registro

```python
def signup(user: str, password: str, email: str):
    """Registra un nuevo usuario."""
    url = f"{BASE_URL}/auth/signup"
    data = {"user": user, "password": password, "email": email}
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()

result = signup("mi_usuario", "contraseña_segura", "mi@email.com")
print(f"Token: {result['token']}")
```

### Login

```python
def login(email: str, password: str):
    """Inicia sesión y retorna el token."""
    url = f"{BASE_URL}/auth/login"
    data = {"email": email, "password": password}
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()

result = login("mi@email.com", "mi_contraseña")
token = result['token']
print(f"Usuario: {result['user']}")
print(f"Token: {token}")
```

---

## Notas (Requieren Auth)

### Cliente con Autenticación

```python
class BibleClient:
    """Cliente para la Bible API con soporte de autenticación."""

    def __init__(self, token: str | None = None):
        self.base_url = "https://bible-api.deno.dev"
        self.token = token
        self.session = requests.Session()
        if token:
            self.session.headers["Authorization"] = f"Bearer {token}"

    # === Consultas públicas ===

    def get_chapter(self, version: str, book: str, chapter: int):
        url = f"{self.base_url}/api/read/{version}/{book}/{chapter}"
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()

    def search(self, version: str, query: str, **kwargs):
        url = f"{self.base_url}/api/read/{version}/search"
        params = {"q": query, **kwargs}
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def random_verse(self, version: str, **kwargs):
        url = f"{self.base_url}/api/read/{version}/verse/random"
        response = self.session.get(url, params=kwargs)
        response.raise_for_status()
        return response.json()

    # === Autenticación ===

    def login(self, email: str, password: str):
        url = f"{self.base_url}/auth/login"
        response = self.session.post(url, json={"email": email, "password": password})
        response.raise_for_status()
        data = response.json()
        self.token = data['token']
        self.session.headers["Authorization"] = f"Bearer {self.token}"
        return data

    def signup(self, user: str, password: str, email: str):
        url = f"{self.base_url}/auth/signup"
        response = self.session.post(url, json={"user": user, "password": password, "email": email})
        response.raise_for_status()
        data = response.json()
        self.token = data['token']
        self.session.headers["Authorization"] = f"Bearer {self.token}"
        return data

    # === Notas ===

    def get_notes(self):
        response = self.session.get(f"{self.base_url}/notes/")
        response.raise_for_status()
        return response.json()

    def create_note(self, title: str, description: str, body: str, page: str | None = None):
        data = {"title": title, "description": description, "body": body}
        if page:
            data["page"] = page
        response = self.session.post(f"{self.base_url}/notes/create", json=data)
        response.raise_for_status()
        return response.json()

    def get_note(self, note_id: str):
        response = self.session.get(f"{self.base_url}/notes/{note_id}")
        response.raise_for_status()
        return response.json()

    def edit_note(self, note_id: str, title: str, description: str, body: str):
        data = {"title": title, "description": description, "body": body}
        response = self.session.put(f"{self.base_url}/notes/{note_id}", json=data)
        response.raise_for_status()
        return response.json()

    def delete_note(self, note_id: str):
        response = self.session.delete(f"{self.base_url}/notes/{note_id}")
        response.raise_for_status()
        return response.json()
```

### Uso del Cliente

```python
# Crear cliente (sin auth para consultas públicas)
client = BibleClient()

# Obtener un capítulo
cap = client.get_chapter("rv1960", "genesis", 1)
print(f"{cap['name']} capítulo {cap['chapter']}")

# Buscar
resultados = client.search("nvi", "fe", testament="new", take=3)
for v in resultados['data']:
    print(f"[{v['book']} {v['chapter']}:{v['number']}] {v['verse']}")

# Login
client.login("mi@email.com", "mi_contraseña")

# Crear nota
nota = client.create_note(
    title="Estudio de Génesis",
    description="Notas sobre la creación",
    body="En el principio creó Dios los cielos y la tierra...",
    page="https://bible-api.deno.dev/api/read/rv1960/genesis/1"
)
print(f"Nota creada con ID: {nota['id']}")

# Listar notas
notas = client.get_notes()
for n in notas:
    print(f"- {n['title']}")
```

---

## Ejemplo con asyncio (aiohttp)

Instalar `aiohttp`:

```bash
pip install aiohttp
```

```python
import asyncio
import aiohttp

async def get_chapter_async(version: str, book: str, chapter: int):
    """Obtiene un capítulo de forma asíncrona."""
    url = f"https://bible-api.deno.dev/api/read/{version}/{book}/{chapter}"

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

async def main():
    # Obtener múltiples capítulos en paralelo
    tasks = [
        get_chapter_async("rv1960", "genesis", 1),
        get_chapter_async("nvi", "exodo", 1),
        get_chapter_async("dhh", "juan", 3),
    ]

    resultados = await asyncio.gather(*tasks)

    for cap in resultados:
        print(f"{cap['name']} - Capítulo {cap['chapter']}")
        print(f"  Versículos: {len(cap['vers'])}")

asyncio.run(main())
```

---

## Devocional Diario (Ejemplo Completo)

```python
import requests
import random

def devocional_diario():
    """Genera un devocional aleatorio."""
    versions = ["rv1960", "nvi", "dhh"]
    version = random.choice(versions)

    # Obtener versículo aleatorio
    url = f"https://bible-api.deno.dev/api/read/{version}/verse/random"
    response = requests.get(url)
    verse = response.json()

    print("=" * 50)
    print(f"  DEVOCIONAL DEL DÍA ({version.upper()})")
    print("=" * 50)
    print()
    print(f"  📖 {verse['book']} {verse['chapter']}:{verse['number']}")
    print()
    print(f"  \"{verse['verse']}\"")
    print()
    print("=" * 50)

if __name__ == "__main__":
    devocional_diario()
```
