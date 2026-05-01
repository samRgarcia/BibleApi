# Ejemplos en Elixir

Requiere la librería `HTTPoison` o `Req`. Los ejemplos usan `Req` (moderno, recomendado).

## Dependencias

En `mix.exs`:

```elixir
defp deps do
  [
    {:req, "~> 0.5"}
  ]
end
```

```bash
mix deps.get
```

---

## Consultas Públicas

### Health Check

```elixir
defmodule BibleAPI do
  @base_url "https://bible-api.deno.dev"

  def health_check do
    Req.get!("#{@base_url}/api/checkhealth").body
  end
end

IO.inspect(BibleAPI.health_check())
# => %{"ok" => true}
```

---

### Obtener un Capítulo Completo

```elixir
defmodule BibleAPI do
  @base_url "https://bible-api.deno.dev"

  def get_chapter(version, book, chapter) do
    url = "#{@base_url}/api/read/#{version}/#{book}/#{chapter}"

    case Req.get(url) do
      {:ok, %{status: 200, body: body}} -> {:ok, body}
      {:ok, %{status: status}} -> {:error, "HTTP #{status}"}
      {:error, reason} -> {:error, reason}
    end
  end
end

# Ejemplo: Génesis 1 (RV1960)
{:ok, chapter} = BibleAPI.get_chapter("rv1960", "genesis", 1)

IO.puts("Libro: #{chapter["name"]}")
IO.puts("Capítulo: #{chapter["chapter"]}")
IO.puts("Testamento: #{chapter["testament"]}")
IO.puts("Total versículos: #{length(chapter["vers"])}")

for verse <- chapter["vers"] do
  IO.puts("#{verse["number"]}. #{verse["verse"]}")
end
```

---

### Obtener un Versículo

```elixir
def get_verse(version, book, chapter, verse_num) do
  url = "#{@base_url}/api/read/#{version}/#{book}/#{chapter}/#{verse_num}"

  case Req.get(url) do
    {:ok, %{status: 200, body: body}} -> {:ok, body}
    {:ok, %{status: status}} -> {:error, "HTTP #{status}"}
    {:error, reason} -> {:error, reason}
  end
end

# Juan 3:16 en NVI
{:ok, verse} = BibleAPI.get_verse("nvi", "juan", 3, 16)
IO.puts("#{verse["book"]} #{verse["chapter"]}:#{verse["number"]}")
IO.puts(verse["verse"])
```

---

### Obtener un Rango de Versículos

```elixir
def get_verse_range(version, book, chapter, start, finish) do
  url = "#{@base_url}/api/read/#{version}/#{book}/#{chapter}/#{start}-#{finish}"

  case Req.get(url) do
    {:ok, %{status: 200, body: body}} -> {:ok, body}
    {:ok, %{status: status}} -> {:error, "HTTP #{status}"}
    {:error, reason} -> {:error, reason}
  end
end

# Génesis 1:1-3
{:ok, verses} = BibleAPI.get_verse_range("rv1960", "genesis", 1, 1, 3)

Enum.each(verses, fn v ->
  IO.puts("#{v["number"]}. #{v["verse"]}")
end)
```

---

### Búsqueda

```elixir
def search(version, query, opts \\ []) do
  testament = Keyword.get(opts, :testament, "both")
  take = Keyword.get(opts, :take, 10)
  page = Keyword.get(opts, :page, 1)

  url = "#{@base_url}/api/read/#{version}/search"

  case Req.get(url, params: %{
    q: query,
    testament: testament,
    take: take,
    page: page
  }) do
    {:ok, %{status: 200, body: body}} -> {:ok, body}
    {:ok, %{status: status}} -> {:error, "HTTP #{status}"}
    {:error, reason} -> {:error, reason}
  end
end

# Buscar "amor" en el Nuevo Testamento (NVI)
{:ok, results} = BibleAPI.search("nvi", "amor", testament: "new", take: 5)

IO.puts("Total resultados: #{results["meta"]["total"]}")
IO.puts("Página: #{results["meta"]["page"]} de #{results["meta"]["pageCount"]}")
IO.puts("")

Enum.each(results["data"], fn v ->
  IO.puts("[#{v["book"]} #{v["chapter"]}:#{v["number"]}] #{v["verse"]}")
end)
```

---

### Versículo Aleatorio

```elixir
def random_verse(version, opts \\ []) do
  url = "#{@base_url}/api/read/#{version}/verse/random"

  params =
    case Keyword.get(opts, :testament) do
      nil -> %{}
      t -> %{testament: t}
    end

  case Req.get(url, params: params) do
    {:ok, %{status: 200, body: body}} -> {:ok, body}
    {:ok, %{status: status}} -> {:error, "HTTP #{status}"}
    {:error, reason} -> {:error, reason}
  end
end

# Versículo aleatorio
{:ok, v} = BibleAPI.random_verse("rv1960")
IO.puts("#{v["book"]} #{v["chapter"]}:#{v["number"]} - #{v["verse"]}")

# Versículo aleatorio del Antiguo Testamento
{:ok, v2} = BibleAPI.random_verse("rv1960", testament: "old")
IO.puts("#{v2["book"]} #{v2["chapter"]}:#{v2["number"]} - #{v2["verse"]}")
```

---

### Comparar Versiones

```elixir
def compare_versions(book, chapter, verse_num) do
  url = "#{@base_url}/api/verses/across/#{book}/#{chapter}/#{verse_num}"

  case Req.get(url) do
    {:ok, %{status: 200, body: body}} -> {:ok, body}
    {:ok, %{status: status}} -> {:error, "HTTP #{status}"}
    {:error, reason} -> {:error, reason}
  end
end

# Génesis 1:1 en todas las versiones
{:ok, result} = BibleAPI.compare_versions("genesis", 1, 1)

Enum.each(result["results"], fn c ->
  IO.puts("DHH:     #{c["verse_dhh"]}")
  IO.puts("PDT:     #{c["verse_pdt"]}")
  IO.puts("RV1960:  #{c["verse_rv1960"]}")
  IO.puts("RV1995:  #{c["verse_rv1995"]}")
end)
```

---

## Autenticación

### Registro

```elixir
def signup(user, password, email) do
  url = "#{@base_url}/auth/signup"

  case Req.post(url, json: %{
    user: user,
    password: password,
    email: email
  }) do
    {:ok, %{status: 200, body: body}} -> {:ok, body}
    {:ok, %{status: status, body: body}} -> {:error, "HTTP #{status}: #{body}"}
    {:error, reason} -> {:error, reason}
  end
end

{:ok, result} = BibleAPI.signup("mi_usuario", "contraseña_segura", "mi@email.com")
IO.puts("Token: #{result["token"]}")
```

### Login

```elixir
def login(email, password) do
  url = "#{@base_url}/auth/login"

  case Req.post(url, json: %{
    email: email,
    password: password
  }) do
    {:ok, %{status: 200, body: body}} -> {:ok, body}
    {:ok, %{status: status, body: body}} -> {:error, "HTTP #{status}: #{body}"}
    {:error, reason} -> {:error, reason}
  end
end

{:ok, result} = BibleAPI.login("mi@email.com", "mi_contraseña")
token = result["token"]
IO.puts("Usuario: #{result["user"]}")
IO.puts("Token: #{token}")
```

---

## Cliente Completo

```elixir
defmodule BibleAPI.Client do
  @base_url "https://bible-api.deno.dev"

  defstruct [:token, :req]

  @type t :: %__MODULE__{
    token: String.t() | nil,
    req: Req.Client.t()
  }

  @doc """
  Crea un nuevo cliente. Si se proporciona un token, se usará para requests autenticados.
  """
  def new(token \\ nil) do
    req =
      Req.new(
        base_url: @base_url,
        headers: headers(token)
      )

    %__MODULE__{token: token, req: req}
  end

  defp headers(nil), do: []
  defp headers(token), do: [{"authorization", "Bearer #{token}"}]

  # === Consultas públicas ===

  @doc """
  Obtiene un capítulo completo.
  """
  def get_chapter(%__MODULE__{req: req}, version, book, chapter) do
    Req.get(req, url: "/api/read/#{version}/#{book}/#{chapter}")
    |> handle_response()
  end

  @doc """
  Obtiene un versículo específico.
  """
  def get_verse(%__MODULE__{req: req}, version, book, chapter, verse_num) do
    Req.get(req, url: "/api/read/#{version}/#{book}/#{chapter}/#{verse_num}")
    |> handle_response()
  end

  @doc """
  Obtiene un rango de versículos.
  """
  def get_verse_range(%__MODULE__{req: req}, version, book, chapter, start, finish) do
    Req.get(req, url: "/api/read/#{version}/#{book}/#{chapter}/#{start}-#{finish}")
    |> handle_response()
  end

  @doc """
  Busca versículos que contengan un término.
  """
  def search(%__MODULE__{req: req}, version, query, opts \\ []) do
    params = %{
      q: query,
      testament: Keyword.get(opts, :testament, "both"),
      take: Keyword.get(opts, :take, 10),
      page: Keyword.get(opts, :page, 1)
    }

    Req.get(req, url: "/api/read/#{version}/search", params: params)
    |> handle_response()
  end

  @doc """
  Obtiene un versículo aleatorio.
  """
  def random_verse(%__MODULE__{req: req}, version, opts \\ []) do
    params =
      case Keyword.get(opts, :testament) do
        nil -> %{}
        t -> %{testament: t}
      end

    Req.get(req, url: "/api/read/#{version}/verse/random", params: params)
    |> handle_response()
  end

  # === Autenticación ===

  @doc """
  Inicia sesión y retorna un nuevo cliente con el token.
  """
  def login(%__MODULE__{} = client, email, password) do
    case Req.post(client.req,
           url: "/auth/login",
           json: %{email: email, password: password}
         ) do
      {:ok, %{status: 200, body: body}} ->
        new_client = new(body["token"])
        {:ok, new_client, body}

      {:ok, %{status: status, body: body}} ->
        {:error, "HTTP #{status}: #{body}"}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Registra un nuevo usuario y retorna un cliente con el token.
  """
  def signup(%__MODULE__{} = client, user, password, email) do
    case Req.post(client.req,
           url: "/auth/signup",
           json: %{user: user, password: password, email: email}
         ) do
      {:ok, %{status: 200, body: body}} ->
        new_client = new(body["token"])
        {:ok, new_client, body}

      {:ok, %{status: status, body: body}} ->
        {:error, "HTTP #{status}: #{body}"}

      {:error, reason} ->
        {:error, reason}
    end
  end

  # === Notas ===

  @doc """
  Lista todas las notas del usuario autenticado.
  """
  def get_notes(%__MODULE__{req: req}) do
    Req.get(req, url: "/notes/")
    |> handle_response()
  end

  @doc """
  Crea una nueva nota.
  """
  def create_note(%__MODULE__{req: req}, title, description, body, page \\ nil) do
    data = %{title: title, description: description, body: body}
    data = if page, do: Map.put(data, :page, page), else: data

    Req.post(req, url: "/notes/create", json: data)
    |> handle_response()
  end

  @doc """
  Obtiene una nota por su ID.
  """
  def get_note(%__MODULE__{req: req}, id) do
    Req.get(req, url: "/notes/#{id}")
    |> handle_response()
  end

  @doc """
  Edita una nota existente.
  """
  def edit_note(%__MODULE__{req: req}, id, title, description, body) do
    Req.put(req, url: "/notes/#{id}", json: %{
      title: title,
      description: description,
      body: body
    })
    |> handle_response()
  end

  @doc """
  Elimina una nota.
  """
  def delete_note(%__MODULE__{req: req}, id) do
    Req.delete(req, url: "/notes/#{id}")
    |> handle_response()
  end

  # === Helpers ===

  defp handle_response({:ok, %{status: 200, body: body}}), do: {:ok, body}
  defp handle_response({:ok, %{status: 201, body: body}}), do: {:ok, body}
  defp handle_response({:ok, %{status: status, body: body}}), do: {:error, "HTTP #{status}: #{inspect(body)}"}
  defp handle_response({:error, reason}), do: {:error, reason}
end
```

### Uso del Cliente

```elixir
# Cliente sin autenticación
client = BibleAPI.Client.new()

# Obtener un capítulo
{:ok, chapter} = BibleAPI.Client.get_chapter(client, "rv1960", "genesis", 1)
IO.puts("#{chapter["name"]} capítulo #{chapter["chapter"]}")

# Buscar
{:ok, results} = BibleAPI.Client.search(client, "nvi", "fe", testament: "new", take: 3)

Enum.each(results["data"], fn v ->
  IO.puts("[#{v["book"]} #{v["chapter"]}:#{v["number"]}] #{v["verse"]}")
end)

# Login (retorna nuevo cliente con token)
{:ok, auth_client, auth_result} = BibleAPI.Client.login(client, "mi@email.com", "mi_contraseña")
IO.puts("Token: #{auth_result["token"]}")

# Crear nota
{:ok, note_resp} = BibleAPI.Client.create_note(
  auth_client,
  "Estudio de Génesis",
  "Notas sobre la creación",
  "En el principio creó Dios los cielos y la tierra...",
  "https://bible-api.deno.dev/api/read/rv1960/genesis/1"
)
IO.puts("Nota creada con ID: #{note_resp["id"]}")

# Listar notas
{:ok, notes} = BibleAPI.Client.get_notes(auth_client)

Enum.each(notes, fn n ->
  IO.puts("- #{n["title"]}")
end)
```

---

## Consultas en Paralelo con `Task`

```elixir
defmodule ParallelBible do
  @base_url "https://bible-api.deno.dev"

  def get_chapter_async(version, book, chapter) do
    Task.async(fn ->
      url = "#{@base_url}/api/read/#{version}/#{book}/#{chapter}"
      Req.get!(url).body
    end)
  end

  def fetch_multiple_chapters do
    tasks = [
      get_chapter_async("rv1960", "genesis", 1),
      get_chapter_async("nvi", "exodo", 1),
      get_chapter_async("dhh", "juan", 3),
      get_chapter_async("rv1960", "salmos", 23)
    ]

    results = Task.await_many(tasks, 10_000)

    Enum.each(results, fn chapter ->
      IO.puts("#{chapter["name"]} - Capítulo #{chapter["chapter"]}: #{length(chapter["vers"])} versículos")
    end)
  end
end

ParallelBible.fetch_multiple_chapters()
```

---

## GenServer como Cliente Persistente

```elixir
defmodule BibleAPI.Service do
  use GenServer

  @base_url "https://bible-api.deno.dev"

  # === API ===

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def get_chapter(version, book, chapter) do
    GenServer.call(__MODULE__, {:get_chapter, version, book, chapter})
  end

  def search(version, query, opts \\ []) do
    GenServer.call(__MODULE__, {:search, version, query, opts})
  end

  def random_verse(version, opts \\ []) do
    GenServer.call(__MODULE__, {:random_verse, version, opts})
  end

  def login(email, password) do
    GenServer.call(__MODULE__, {:login, email, password})
  end

  def get_notes do
    GenServer.call(__MODULE__, :get_notes)
  end

  def create_note(title, description, body, page \\ nil) do
    GenServer.call(__MODULE__, {:create_note, title, description, body, page})
  end

  # === Callbacks ===

  def init(_opts) do
    {:ok, %{token: nil, req: Req.new(base_url: @base_url)}}
  end

  def handle_call({:get_chapter, version, book, chapter}, _from, state) do
    url = "/api/read/#{version}/#{book}/#{chapter}"

    case Req.get(state.req, url: url) do
      {:ok, %{status: 200, body: body}} ->
        {:reply, {:ok, body}, state}

      {:ok, %{status: status}} ->
        {:reply, {:error, "HTTP #{status}"}, state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call({:search, version, query, opts}, _from, state) do
    params = %{
      q: query,
      testament: Keyword.get(opts, :testament, "both"),
      take: Keyword.get(opts, :take, 10),
      page: Keyword.get(opts, :page, 1)
    }

    case Req.get(state.req,
           url: "/api/read/#{version}/search",
           params: params
         ) do
      {:ok, %{status: 200, body: body}} ->
        {:reply, {:ok, body}, state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call({:random_verse, version, opts}, _from, state) do
    params =
      case Keyword.get(opts, :testament) do
        nil -> %{}
        t -> %{testament: t}
      end

    case Req.get(state.req,
           url: "/api/read/#{version}/verse/random",
           params: params
         ) do
      {:ok, %{status: 200, body: body}} ->
        {:reply, {:ok, body}, state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call({:login, email, password}, _from, state) do
    case Req.post(state.req,
           url: "/auth/login",
           json: %{email: email, password: password}
         ) do
      {:ok, %{status: 200, body: body}} ->
        new_req = Req.put_base_url(state.req, @base_url)
          |> Req.merge(Req.new(headers: [{"authorization", "Bearer #{body["token"]}"}]))

        new_state = %{state | token: body["token"], req: new_req}
        {:reply, {:ok, body}, new_state}

      {:ok, %{status: status, body: body}} ->
        {:reply, {:error, "HTTP #{status}: #{body}"}, state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call(:get_notes, _from, %{token: nil} = state) do
    {:reply, {:error, "Not authenticated"}, state}
  end

  def handle_call(:get_notes, _from, state) do
    case Req.get(state.req, url: "/notes/") do
      {:ok, %{status: 200, body: body}} ->
        {:reply, {:ok, body}, state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call({:create_note, title, description, body_text, page}, _from, %{token: nil} = state) do
    {:reply, {:error, "Not authenticated"}, state}
  end

  def handle_call({:create_note, title, description, body_text, page}, _from, state) do
    data = %{title: title, description: description, body: body_text}
    data = if page, do: Map.put(data, :page, page), else: data

    case Req.post(state.req, url: "/notes/create", json: data) do
      {:ok, %{status: 201, body: body}} ->
        {:reply, {:ok, body}, state}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  def handle_call(_unknown, _from, state) do
    {:reply, {:error, "Unknown command"}, state}
  end
end
```

### Uso del GenServer

```elixir
# Iniciar el servicio
BibleAPI.Service.start_link()

# Consultas públicas
{:ok, chapter} = BibleAPI.Service.get_chapter("rv1960", "genesis", 1)
IO.puts("#{chapter["name"]} capítulo #{chapter["chapter"]}")

{:ok, results} = BibleAPI.Service.search("nvi", "amor", testament: "new", take: 3)

# Login (el servicio guarda el token internamente)
{:ok, auth} = BibleAPI.Service.login("mi@email.com", "mi_contraseña")

# Crear nota (usa el token guardado)
{:ok, note} = BibleAPI.Service.create_note(
  "Estudio Bíblico",
  "Mis notas de estudio",
  "Contenido del estudio..."
)

# Listar notas
{:ok, notes} = BibleAPI.Service.get_notes()
```

---

## Devocional Diario (Ejemplo Completo)

```elixir
defmodule BibleAPI.Devotional do
  @versions ["rv1960", "nvi", "dhh"]
  @base_url "https://bible-api.deno.dev"

  def daily do
    version = Enum.random(@versions)

    case Req.get("#{@base_url}/api/read/#{version}/verse/random") do
      {:ok, %{status: 200, body: verse}} ->
        separator = String.duplicate("=", 50)

        IO.puts(separator)
        IO.puts("  DEVOCIONAL DEL DÍA (#{String.upcase(version)})")
        IO.puts(separator)
        IO.puts("")
        IO.puts("  #{verse["book"]} #{verse["chapter"]}:#{verse["number"]}")
        IO.puts("")
        IO.puts("  \"#{verse["verse"]}\"")
        IO.puts("")
        IO.puts(separator)

      {:error, reason} ->
        IO.puts("Error: #{reason}")
    end
  end
end

BibleAPI.Devotional.daily()
```
