# Ejemplos en Java

Se usa `java.net.http.HttpClient` (disponible desde Java 11).

---

## Modelos de Datos

```java
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Version(
    String name,
    String version,
    String uri
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record Book(
    List<String> names,
    String abrev,
    int chapters,
    String testament
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record Verse(
    String verse,
    int number,
    String study,
    int id
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record VerseMeta(
    String verse,
    String study,
    int number,
    int id,
    String book,
    int chapter
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record Chapter(
    String testament,
    String name,
    @JsonProperty("num_chapters") int numChapters,
    int chapter,
    List<Verse> vers
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record SearchMeta(
    int page,
    @JsonProperty("pageSize") int pageSize,
    int total,
    @JsonProperty("pageCount") int pageCount
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record SearchResult(
    List<VerseMeta> data,
    SearchMeta meta
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record RandomVerse(
    String verse,
    String book,
    int chapter,
    int number,
    int id
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record Comparison(
    @JsonProperty("verse_dhh") String verseDhh,
    @JsonProperty("verse_pdt") String versePdt,
    @JsonProperty("verse_rv1960") String verseRv1960,
    @JsonProperty("verse_rv1995") String verseRv1995
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record CompareResult(
    List<Comparison> results
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record AuthResult(
    String user,
    String token,
    String email
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record NoteResponse(
    boolean created,
    boolean edited,
    boolean deleted,
    String id
) {}

@JsonIgnoreProperties(ignoreUnknown = true)
public record Note(
    String id,
    String title,
    String description,
    String body,
    String page
) {}
```

---

## Cliente Completo

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

public class BibleClient {

    private static final String BASE_URL = "https://bible-api.deno.dev";
    private final HttpClient httpClient;
    private final ObjectMapper mapper;
    private String token;

    public BibleClient() {
        this.httpClient = HttpClient.newHttpClient();
        this.mapper = new ObjectMapper();
        this.token = null;
    }

    public BibleClient(String token) {
        this();
        this.token = token;
    }

    private HttpRequest.Builder requestBuilder(String method, String path) {
        var builder = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + path))
                .method(method, HttpRequest.BodyPublishers.noBody());

        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }

        return builder;
    }

    private HttpRequest.Builder jsonRequest(String method, String path, Object body) throws Exception {
        String json = mapper.writeValueAsString(body);
        return requestBuilder(method, path)
                .header("Content-Type", "application/json")
                .method(method, HttpRequest.BodyPublishers.ofString(json));
    }

    // === Consultas públicas ===

    public Chapter getChapter(String version, String book, int chapter) throws Exception {
        String path = String.format("/api/read/%s/%s/%d", version, book, chapter);
        var request = requestBuilder("GET", path).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), Chapter.class);
    }

    public Verse getVerse(String version, String book, int chapter, int verse) throws Exception {
        String path = String.format("/api/read/%s/%s/%d/%d", version, book, chapter, verse);
        var request = requestBuilder("GET", path).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), Verse.class);
    }

    public SearchResult search(String version, String query, String testament, int take, int page) throws Exception {
        String params = Map.of(
                "q", query,
                "testament", testament,
                "take", String.valueOf(take),
                "page", String.valueOf(page)
        ).entrySet().stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        String path = "/api/read/" + version + "/search?" + params;
        var request = requestBuilder("GET", path).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), SearchResult.class);
    }

    public RandomVerse randomVerse(String version, String testament) throws Exception {
        String path = "/api/read/" + version + "/verse/random";
        if (testament != null) {
            path += "?testament=" + URLEncoder.encode(testament, StandardCharsets.UTF_8);
        }
        var request = requestBuilder("GET", path).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), RandomVerse.class);
    }

    public CompareResult compareVersions(String book, int chapter, int verse) throws Exception {
        String path = String.format("/api/verses/across/%s/%d/%d", book, chapter, verse);
        var request = requestBuilder("GET", path).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), CompareResult.class);
    }

    // === Autenticación ===

    public AuthResult signup(String user, String password, String email) throws Exception {
        var request = jsonRequest("POST", "/auth/signup",
                Map.of("user", user, "password", password, "email", email)).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        AuthResult result = mapper.readValue(response.body(), AuthResult.class);
        this.token = result.token();
        return result;
    }

    public AuthResult login(String email, String password) throws Exception {
        var request = jsonRequest("POST", "/auth/login",
                Map.of("email", email, "password", password)).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        AuthResult result = mapper.readValue(response.body(), AuthResult.class);
        this.token = result.token();
        return result;
    }

    // === Notas ===

    public Note[] getNotes() throws Exception {
        var request = requestBuilder("GET", "/notes/").build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), Note[].class);
    }

    public NoteResponse createNote(String title, String description, String body, String page) throws Exception {
        var note = Map.of("title", title, "description", description, "body", body,
                "page", page != null ? page : "");
        var request = jsonRequest("POST", "/notes/create", note).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), NoteResponse.class);
    }

    public Note getNote(String id) throws Exception {
        var request = requestBuilder("GET", "/notes/" + id).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), Note.class);
    }

    public NoteResponse editNote(String id, String title, String description, String body) throws Exception {
        var request = jsonRequest("PUT", "/notes/" + id,
                Map.of("title", title, "description", description, "body", body)).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), NoteResponse.class);
    }

    public NoteResponse deleteNote(String id) throws Exception {
        var request = requestBuilder("DELETE", "/notes/" + id).build();
        var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return mapper.readValue(response.body(), NoteResponse.class);
    }
}
```

---

## Uso del Cliente

```java
public class Main {
    public static void main(String[] args) throws Exception {
        BibleClient client = new BibleClient();

        // Obtener capítulo completo
        Chapter chapter = client.getChapter("rv1960", "genesis", 1);
        System.out.println("Libro: " + chapter.name());
        System.out.println("Capítulo: " + chapter.chapter());
        System.out.println("Versículos: " + chapter.vers().size());

        for (Verse v : chapter.vers()) {
            System.out.println(v.number() + ". " + v.verse());
        }

        // Búsqueda
        SearchResult results = client.search("nvi", "amor", "new", 5, 1);
        System.out.println("\nTotal resultados: " + results.meta().total());
        for (VerseMeta v : results.data()) {
            System.out.printf("[%s %d:%d] %s%n", v.book(), v.chapter(), v.number(), v.verse());
        }

        // Versículo aleatorio
        RandomVerse rv = client.randomVerse("rv1960", null);
        System.out.printf("\n%s %d:%d - %s%n", rv.book(), rv.chapter(), rv.number(), rv.verse());

        // Comparar versiones
        CompareResult compare = client.compareVersions("genesis", 1, 1);
        for (Comparison c : compare.results()) {
            System.out.println("RV1960: " + c.verseRv1960());
        }
    }
}
```

### Con Autenticación

```java
public class Main {
    public static void main(String[] args) throws Exception {
        BibleClient client = new BibleClient();

        // Login
        AuthResult auth = client.login("mi@email.com", "mi_contraseña");
        System.out.println("Token: " + auth.token());

        // Crear nota
        NoteResponse resp = client.createNote(
                "Estudio de Génesis",
                "Notas sobre la creación",
                "En el principio creó Dios los cielos y la tierra...",
                "https://bible-api.deno.dev/api/read/rv1960/genesis/1"
        );
        System.out.println("Nota creada con ID: " + resp.id());

        // Listar notas
        Note[] notes = client.getNotes();
        for (Note n : notes) {
            System.out.println("- " + n.title());
        }
    }
}
```

---

## Consultas en Paralelo

```java
import java.util.concurrent.CompletableFuture;

public class ParallelExample {
    public static void main(String[] args) throws Exception {
        BibleClient client = new BibleClient();

        CompletableFuture<Chapter> genesis = CompletableFuture.supplyAsync(() -> {
            try {
                return client.getChapter("rv1960", "genesis", 1);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        CompletableFuture<Chapter> exodus = CompletableFuture.supplyAsync(() -> {
            try {
                return client.getChapter("nvi", "exodo", 1);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        CompletableFuture<Chapter> john = CompletableFuture.supplyAsync(() -> {
            try {
                return client.getChapter("dhh", "juan", 1);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        CompletableFuture.allOf(genesis, exodus, john).join();

        System.out.println(genesis.get().name() + " - " + genesis.get().vers().size() + " versículos");
        System.out.println(exodus.get().name() + " - " + exodus.get().vers().size() + " versículos");
        System.out.println(john.get().name() + " - " + john.get().vers().size() + " versículos");
    }
}
```

---

## Dependencia Jackson (para JSON)

Maven (`pom.xml`):

```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.17.0</version>
</dependency>
```

Gradle (`build.gradle`):

```groovy
implementation 'com.fasterxml.jackson.core:jackson-databind:2.17.0'
```
