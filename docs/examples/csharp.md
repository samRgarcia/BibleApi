# Ejemplos en C#

Se usa `System.Net.Http.HttpClient` y `System.Text.Json`.

---

## Modelos de Datos

```csharp
using System.Text.Json.Serialization;

namespace BibleApi.Models
{
    public record VersionInfo(
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("version")] string VersionCode,
        [property: JsonPropertyName("uri")] string Uri
    );

    public record Book(
        [property: JsonPropertyName("names")] List<string> Names,
        [property: JsonPropertyName("abrev")] string Abrev,
        [property: JsonPropertyName("chapters")] int Chapters,
        [property: JsonPropertyName("testament")] string Testament
    );

    public record Verse(
        [property: JsonPropertyName("verse")] string Text,
        [property: JsonPropertyName("number")] int Number,
        [property: JsonPropertyName("study")] string? Study,
        [property: JsonPropertyName("id")] int Id
    );

    public record VerseMeta(
        [property: JsonPropertyName("verse")] string Text,
        [property: JsonPropertyName("study")] string? Study,
        [property: JsonPropertyName("number")] int Number,
        [property: JsonPropertyName("id")] int Id,
        [property: JsonPropertyName("book")] string Book,
        [property: JsonPropertyName("chapter")] int Chapter
    );

    public record Chapter(
        [property: JsonPropertyName("testament")] string Testament,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("num_chapters")] int NumChapters,
        [property: JsonPropertyName("chapter")] int Chapter,
        [property: JsonPropertyName("vers")] List<Verse> Vers
    );

    public record SearchMeta(
        [property: JsonPropertyName("page")] int Page,
        [property: JsonPropertyName("pageSize")] int PageSize,
        [property: JsonPropertyName("total")] int Total,
        [property: JsonPropertyName("pageCount")] int PageCount
    );

    public record SearchResult(
        [property: JsonPropertyName("data")] List<VerseMeta> Data,
        [property: JsonPropertyName("meta")] SearchMeta Meta
    );

    public record RandomVerse(
        [property: JsonPropertyName("verse")] string Text,
        [property: JsonPropertyName("book")] string Book,
        [property: JsonPropertyName("chapter")] int Chapter,
        [property: JsonPropertyName("number")] int Number,
        [property: JsonPropertyName("id")] int Id
    );

    public record Comparison(
        [property: JsonPropertyName("verse_dhh")] string VerseDhh,
        [property: JsonPropertyName("verse_pdt")] string VersePdt,
        [property: JsonPropertyName("verse_rv1960")] string VerseRv1960,
        [property: JsonPropertyName("verse_rv1995")] string VerseRv1995
    );

    public record CompareResult(
        [property: JsonPropertyName("results")] List<Comparison> Results
    );

    public record AuthResult(
        [property: JsonPropertyName("user")] string User,
        [property: JsonPropertyName("token")] string Token,
        [property: JsonPropertyName("email")] string Email
    );

    public record NoteResponse(
        [property: JsonPropertyName("created")] bool Created,
        [property: JsonPropertyName("edited")] bool Edited,
        [property: JsonPropertyName("deleted")] bool Deleted,
        [property: JsonPropertyName("id")] string? Id
    );

    public record Note(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("description")] string Description,
        [property: JsonPropertyName("body")] string Body,
        [property: JsonPropertyName("page")] string? Page
    );
}
```

---

## Cliente Completo

```csharp
using System.Net.Http.Json;
using System.Text.Json;
using System.Web;
using BibleApi.Models;

namespace BibleApi
{
    public class BibleClient : IDisposable
    {
        private const string BaseUrl = "https://bible-api.deno.dev";
        private readonly HttpClient _http;
        private readonly JsonSerializerOptions _jsonOptions;

        public BibleClient(string? token = null)
        {
            _http = new HttpClient { BaseAddress = new Uri(BaseUrl) };
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            if (!string.IsNullOrEmpty(token))
            {
                _http.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            }
        }

        public void Dispose() => _http.Dispose();

        // === Consultas públicas ===

        public async Task<Chapter> GetChapterAsync(string version, string book, int chapter,
            CancellationToken ct = default)
        {
            var response = await _http.GetAsync(
                $"api/read/{version}/{book}/{chapter}", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<Chapter>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize chapter");
        }

        public async Task<Verse> GetVerseAsync(string version, string book, int chapter, int verse,
            CancellationToken ct = default)
        {
            var response = await _http.GetAsync(
                $"api/read/{version}/{book}/{chapter}/{verse}", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<Verse>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize verse");
        }

        public async Task<SearchResult> SearchAsync(string version, string query,
            string testament = "both", int take = 10, int page = 1,
            CancellationToken ct = default)
        {
            var queryParams = HttpUtility.ParseQueryString(string.Empty);
            queryParams["q"] = query;
            queryParams["testament"] = testament;
            queryParams["take"] = take.ToString();
            queryParams["page"] = page.ToString();

            var response = await _http.GetAsync(
                $"api/read/{version}/search?{queryParams}", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<SearchResult>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize search result");
        }

        public async Task<RandomVerse> RandomVerseAsync(string version, string? testament = null,
            CancellationToken ct = default)
        {
            var url = $"api/read/{version}/verse/random";
            if (!string.IsNullOrEmpty(testament))
            {
                url += $"?testament={HttpUtility.UrlEncode(testament)}";
            }

            var response = await _http.GetAsync(url, ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<RandomVerse>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize random verse");
        }

        public async Task<CompareResult> CompareVersionsAsync(string book, int chapter, int verse,
            CancellationToken ct = default)
        {
            var response = await _http.GetAsync(
                $"api/verses/across/{book}/{chapter}/{verse}", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<CompareResult>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize comparison");
        }

        // === Autenticación ===

        public async Task<AuthResult> SignupAsync(string user, string password, string email,
            CancellationToken ct = default)
        {
            var response = await _http.PostAsJsonAsync("auth/signup",
                new { user, password, email }, _jsonOptions, ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<AuthResult>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize auth result");
            SetToken(result.Token);
            return result;
        }

        public async Task<AuthResult> LoginAsync(string email, string password,
            CancellationToken ct = default)
        {
            var response = await _http.PostAsJsonAsync("auth/login",
                new { email, password }, _jsonOptions, ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<AuthResult>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize auth result");
            SetToken(result.Token);
            return result;
        }

        private void SetToken(string token)
        {
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }

        // === Notas ===

        public async Task<List<Note>> GetNotesAsync(CancellationToken ct = default)
        {
            var response = await _http.GetAsync("notes/", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<List<Note>>(_jsonOptions, ct)
                ?? new List<Note>();
        }

        public async Task<NoteResponse> CreateNoteAsync(string title, string description,
            string body, string? page = null, CancellationToken ct = default)
        {
            var note = new { title, description, body, page };
            var response = await _http.PostAsJsonAsync("notes/create", note, _jsonOptions, ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<NoteResponse>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize note response");
        }

        public async Task<Note> GetNoteAsync(string id, CancellationToken ct = default)
        {
            var response = await _http.GetAsync($"notes/{id}", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<Note>(_jsonOptions, ct)
                ?? throw new Exception("Note not found");
        }

        public async Task<NoteResponse> EditNoteAsync(string id, string title, string description,
            string body, CancellationToken ct = default)
        {
            var response = await _http.PutAsJsonAsync($"notes/{id}",
                new { title, description, body }, _jsonOptions, ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<NoteResponse>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize note response");
        }

        public async Task<NoteResponse> DeleteNoteAsync(string id, CancellationToken ct = default)
        {
            var response = await _http.DeleteAsync($"notes/{id}", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<NoteResponse>(_jsonOptions, ct)
                ?? throw new Exception("Failed to deserialize note response");
        }
    }
}
```

---

## Uso del Cliente

```csharp
using BibleApi;
using BibleApi.Models;

class Program
{
    static async Task Main()
    {
        using var client = new BibleClient();

        // Obtener capítulo completo
        Chapter chapter = await client.GetChapterAsync("rv1960", "genesis", 1);
        Console.WriteLine($"Libro: {chapter.Name}");
        Console.WriteLine($"Capítulo: {chapter.Chapter}");
        Console.WriteLine($"Versículos: {chapter.Vers.Count}");

        foreach (var v in chapter.Vers)
        {
            Console.WriteLine($"{v.Number}. {v.Text}");
        }

        // Búsqueda
        SearchResult results = await client.SearchAsync("nvi", "amor", "new", take: 5);
        Console.WriteLine($"\nTotal resultados: {results.Meta.Total}");

        foreach (var v in results.Data)
        {
            Console.WriteLine($"[{v.Book} {v.Chapter}:{v.Number}] {v.Text}");
        }

        // Versículo aleatorio
        var rv = await client.RandomVerseAsync("rv1960");
        Console.WriteLine($"\n{rv.Book} {rv.Chapter}:{rv.Number} - {rv.Text}");

        // Comparar versiones
        var compare = await client.CompareVersionsAsync("genesis", 1, 1);
        foreach (var c in compare.Results)
        {
            Console.WriteLine($"RV1960: {c.VerseRv1960}");
        }
    }
}
```

### Con Autenticación

```csharp
using var client = new BibleClient();

// Login
AuthResult auth = await client.LoginAsync("mi@email.com", "mi_contraseña");
Console.WriteLine($"Token: {auth.Token}");

// Crear nota
NoteResponse resp = await client.CreateNoteAsync(
    "Estudio de Génesis",
    "Notas sobre la creación",
    "En el principio creó Dios los cielos y la tierra...",
    "https://bible-api.deno.dev/api/read/rv1960/genesis/1"
);
Console.WriteLine($"Nota creada con ID: {resp.Id}");

// Listar notas
List<Note> notes = await client.GetNotesAsync();
foreach (var n in notes)
{
    Console.WriteLine($"- {n.Title}");
}
```

---

## Consultas en Paralelo

```csharp
using var client = new BibleClient();

var tasks = new[]
{
    client.GetChapterAsync("rv1960", "genesis", 1),
    client.GetChapterAsync("nvi", "exodo", 1),
    client.GetChapterAsync("dhh", "juan", 3),
    client.GetChapterAsync("rv1960", "salmos", 23)
};

Chapter[] results = await Task.WhenAll(tasks);

foreach (var ch in results)
{
    Console.WriteLine($"{ch.Name} - {ch.Vers.Count} versículos");
}
```

---

## HttpClient como Servicio (DI)

Para proyectos ASP.NET Core o aplicaciones que usan inyección de dependencias:

```csharp
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBibleApi(this IServiceCollection services)
    {
        services.AddHttpClient<BibleClient>(client =>
        {
            client.BaseAddress = new Uri("https://bible-api.deno.dev");
        });

        return services;
    }
}

// En Program.cs
builder.Services.AddBibleApi();

// En un controller o service
public class DevotionalService
{
    private readonly BibleClient _client;

    public DevotionalService(BibleClient client)
    {
        _client = client;
    }

    public async Task<RandomVerse> GetDailyVerseAsync(CancellationToken ct = default)
    {
        return await _client.RandomVerseAsync("rv1960", ct: ct);
    }
}
```

---

## Consola Interactiva

```csharp
using BibleApi;

class Program
{
    static async Task Main()
    {
        using var client = new BibleClient();
        string? version = "rv1960";

        while (true)
        {
            Console.Write("\n> ");
            var input = Console.ReadLine()?.Trim();

            if (input == "exit") break;

            try
            {
                if (input?.StartsWith("chapter ") == true)
                {
                    var parts = input.Split(" ");
                    var ch = await client.GetChapterAsync(version, parts[1], int.Parse(parts[2]));
                    Console.WriteLine($"\n{ch.Name} - Capítulo {ch.Chapter}");
                    foreach (var v in ch.Vers)
                        Console.WriteLine($"  {v.Number}. {v.Text}");
                }
                else if (input?.StartsWith("search ") == true)
                {
                    var query = input["search ".Length..];
                    var results = await client.SearchAsync(version, query, take: 5);
                    foreach (var v in results.Data)
                        Console.WriteLine($"[{v.Book} {v.Chapter}:{v.Number}] {v.Text}");
                }
                else if (input == "random")
                {
                    var rv = await client.RandomVerseAsync(version);
                    Console.WriteLine($"{rv.Book} {rv.Chapter}:{rv.Number} - {rv.Text}");
                }
                else if (input?.StartsWith("version ") == true)
                {
                    version = input["version ".Length..];
                    Console.WriteLine($"Versión: {version}");
                }
                else
                {
                    Console.WriteLine("Comandos: chapter <book> <num>, search <q>, random, version <ver>, exit");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
    }
}
```
