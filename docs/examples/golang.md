# Ejemplos en Go (Golang)

---

## Consultas Públicas

### Health Check

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

const baseURL = "https://bible-api.deno.dev"

type HealthResponse struct {
	OK bool `json:"ok"`
}

func main() {
	resp, err := http.Get(baseURL + "/api/checkhealth")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var health HealthResponse
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		panic(err)
	}

	fmt.Printf("Health: %v\n", health.OK)
}
```

---

### Modelos de Datos

```go
package main

type Version struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	URI     string `json:"uri"`
}

type Book struct {
	Names     []string `json:"names"`
	Abrev     string   `json:"abrev"`
	Chapters  int      `json:"chapters"`
	Testament string   `json:"testament"`
}

type Verse struct {
	Verse  string  `json:"verse"`
	Number int     `json:"number"`
	Study  *string `json:"study"`
	ID     int     `json:"id"`
}

type Chapter struct {
	Testament   string  `json:"testament"`
	Name        string  `json:"name"`
	NumChapters int     `json:"num_chapters"`
	Chapter     int     `json:"chapter"`
	Vers        []Verse `json:"vers"`
}

type SearchMeta struct {
	Page      int `json:"page"`
	PageSize  int `json:"pageSize"`
	Total     int `json:"total"`
	PageCount int `json:"pageCount"`
}

type SearchResult struct {
	Data []VerseMeta `json:"data"`
	Meta SearchMeta  `json:"meta"`
}

type VerseMeta struct {
	Verse   string  `json:"verse"`
	Study   *string `json:"study"`
	Number  int     `json:"number"`
	ID      int     `json:"id"`
	Book    string  `json:"book"`
	Chapter int     `json:"chapter"`
}

type RandomVerse struct {
	Verse   string `json:"verse"`
	Book    string `json:"chapter"`
	Chapter int    `json:"chapter"`
	Number  int    `json:"number"`
	ID      int    `json:"id"`
}

type CompareResult struct {
	Results []Comparison `json:"results"`
}

type Comparison struct {
	VerseDHH   string `json:"verse_dhh"`
	VersePDT   string `json:"verse_pdt"`
	VerseRV60  string `json:"verse_rv1960"`
	VerseRV95  string `json:"verse_rv1995"`
}
```

---

### Obtener un Capítulo Completo

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func GetChapter(version, book string, chapter int) (*Chapter, error) {
	url := fmt.Sprintf("%s/api/read/%s/%s/%d", baseURL, version, book, chapter)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error %d: %s", resp.StatusCode, resp.Status)
	}

	var ch Chapter
	if err := json.NewDecoder(resp.Body).Decode(&ch); err != nil {
		return nil, err
	}

	return &ch, nil
}

func main() {
	ch, err := GetChapter("rv1960", "genesis", 1)
	if err != nil {
		panic(err)
	}

	fmt.Printf("Libro: %s\n", ch.Name)
	fmt.Printf("Capítulo: %d\n", ch.Chapter)
	fmt.Printf("Testamento: %s\n", ch.Testament)
	fmt.Printf("Total versículos: %d\n\n", len(ch.Vers))

	for _, v := range ch.Vers {
		fmt.Printf("%d. %s\n", v.Number, v.Verse)
	}
}
```

---

### Obtener un Versículo

```go
func GetVerse(version, book string, chapter, verse int) (*Verse, error) {
	url := fmt.Sprintf("%s/api/read/%s/%s/%d/%d", baseURL, version, book, chapter, verse)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error %d: %s", resp.StatusCode, resp.Status)
	}

	var v Verse
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return nil, err
	}

	return &v, nil
}

// Uso
func main() {
	v, err := GetVerse("nvi", "juan", 3, 16)
	if err != nil {
		panic(err)
	}
	fmt.Printf("%s %d:%d\n", v.Book, v.Chapter, v.Number)
	fmt.Println(v.Verse)
}
```

---

### Búsqueda con Parámetros

```go
func Search(version, query string, testament string, take, page int) (*SearchResult, error) {
	url := fmt.Sprintf(
		"%s/api/read/%s/search?q=%s&testament=%s&take=%d&page=%d",
		baseURL, version, query, testament, take, page,
	)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error %d: %s", resp.StatusCode, resp.Status)
	}

	var result SearchResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func main() {
	result, err := Search("nvi", "amor", "new", 5, 1)
	if err != nil {
		panic(err)
	}

	fmt.Printf("Total resultados: %d\n", result.Meta.Total)
	fmt.Printf("Página: %d de %d\n\n", result.Meta.Page, result.Meta.PageCount)

	for _, v := range result.Data {
		fmt.Printf("[%s %d:%d] %s\n", v.Book, v.Chapter, v.Number, v.Verse)
	}
}
```

---

### Versículo Aleatorio

```go
import (
	"fmt"
	"net/http"
	"net/url"
	"encoding/json"
)

func RandomVerse(version, testament string) (*RandomVerse, error) {
	rawURL := fmt.Sprintf("%s/api/read/%s/verse/random", baseURL, version)

	if testament != "" {
		u, _ := url.Parse(rawURL)
		q := u.Query()
		q.Set("testament", testament)
		u.RawQuery = q.Encode()
		rawURL = u.String()
	}

	resp, err := http.Get(rawURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var v RandomVerse
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return nil, err
	}

	return &v, nil
}

func main() {
	v, err := RandomVerse("rv1960", "")
	if err != nil {
		panic(err)
	}
	fmt.Printf("%s %d:%d - %s\n", v.Book, v.Chapter, v.Number, v.Verse)
}
```

---

### Comparar Versiones

```go
func CompareVersions(book string, chapter, verse int) (*CompareResult, error) {
	url := fmt.Sprintf("%s/api/verses/across/%s/%d/%d", baseURL, book, chapter, verse)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result CompareResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func main() {
	result, err := CompareVersions("genesis", 1, 1)
	if err != nil {
		panic(err)
	}

	for _, c := range result.Results {
		fmt.Printf("DHH:     %s\n", c.VerseDHH)
		fmt.Printf("PDT:     %s\n", c.VersePDT)
		fmt.Printf("RV1960:  %s\n", c.VerseRV60)
		fmt.Printf("RV1995:  %s\n", c.VerseRV95)
	}
}
```

---

## Cliente Completo

```go
package bibleapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

const BaseURL = "https://bible-api.deno.dev"

// === Modelos ===

type AuthResult struct {
	User  string `json:"user"`
	Token string `json:"token"`
	Email string `json:"email"`
}

type Note struct {
	ID          string `json:"id,omitempty"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Body        string `json:"body"`
	Page        string `json:"page,omitempty"`
}

type NoteResponse struct {
	Created bool   `json:"created,omitempty"`
	Edited  bool   `json:"edited,omitempty"`
	Deleted bool   `json:"deleted,omitempty"`
	ID      string `json:"id,omitempty"`
}

// === Cliente ===

type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

func NewClient(token string) *Client {
	return &Client{
		baseURL:    BaseURL,
		token:      token,
		httpClient: &http.Client{},
	}
}

func (c *Client) doRequest(method, path string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequest(method, c.baseURL+path, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	return c.httpClient.Do(req)
}

// === Consultas públicas ===

func (c *Client) GetChapter(version, book string, chapter int) (*Chapter, error) {
	path := fmt.Sprintf("/api/read/%s/%s/%d", version, book, chapter)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var ch Chapter
	if err := json.NewDecoder(resp.Body).Decode(&ch); err != nil {
		return nil, err
	}
	return &ch, nil
}

func (c *Client) GetVerse(version, book string, chapter, verse int) (*Verse, error) {
	path := fmt.Sprintf("/api/read/%s/%s/%d/%d", version, book, chapter, verse)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var v Verse
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return nil, err
	}
	return &v, nil
}

func (c *Client) Search(version, query string, testament string, take, page int) (*SearchResult, error) {
	params := url.Values{}
	params.Set("q", query)
	params.Set("testament", testament)
	params.Set("take", fmt.Sprintf("%d", take))
	params.Set("page", fmt.Sprintf("%d", page))

	path := fmt.Sprintf("/api/read/%s/search?%s", version, params.Encode())
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result SearchResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) RandomVerse(version, testament string) (*RandomVerse, error) {
	path := fmt.Sprintf("/api/read/%s/verse/random", version)
	if testament != "" {
		path += "?testament=" + url.QueryEscape(testament)
	}

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var v RandomVerse
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return nil, err
	}
	return &v, nil
}

// === Autenticación ===

func (c *Client) Login(email, password string) (*AuthResult, error) {
	body, _ := json.Marshal(map[string]string{
		"email":    email,
		"password": password,
	})

	resp, err := c.doRequest("POST", "/auth/login", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result AuthResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	c.token = result.Token
	return &result, nil
}

func (c *Client) Signup(user, password, email string) (*AuthResult, error) {
	body, _ := json.Marshal(map[string]string{
		"user":     user,
		"password": password,
		"email":    email,
	})

	resp, err := c.doRequest("POST", "/auth/signup", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result AuthResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	c.token = result.Token
	return &result, nil
}

// === Notas ===

func (c *Client) GetNotes() ([]Note, error) {
	resp, err := c.doRequest("GET", "/notes/", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var notes []Note
	if err := json.NewDecoder(resp.Body).Decode(&notes); err != nil {
		return nil, err
	}
	return notes, nil
}

func (c *Client) CreateNote(note Note) (*NoteResponse, error) {
	body, _ := json.Marshal(note)
	resp, err := c.doRequest("POST", "/notes/create", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result NoteResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) GetNote(id string) (*Note, error) {
	resp, err := c.doRequest("GET", "/notes/"+id, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var note Note
	if err := json.NewDecoder(resp.Body).Decode(&note); err != nil {
		return nil, err
	}
	return &note, nil
}

func (c *Client) EditNote(id string, note Note) (*NoteResponse, error) {
	body, _ := json.Marshal(note)
	resp, err := c.doRequest("PUT", "/notes/"+id, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result NoteResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) DeleteNote(id string) (*NoteResponse, error) {
	resp, err := c.doRequest("DELETE", "/notes/"+id, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result NoteResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}
```

### Uso del Cliente

```go
package main

import (
	"fmt"
	"log"

	bibleapi "tu-modulo/bibleapi"
)

func main() {
	// Cliente sin autenticación
	client := bibleapi.NewClient("")

	// Obtener capítulo
	ch, err := client.GetChapter("rv1960", "genesis", 1)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("%s capítulo %d\n", ch.Name, ch.Chapter)

	// Buscar
	result, err := client.Search("nvi", "fe", "new", 3, 1)
	if err != nil {
		log.Fatal(err)
	}
	for _, v := range result.Data {
		fmt.Printf("[%s %d:%d] %s\n", v.Book, v.Chapter, v.Number, v.Verse)
	}

	// Login
	auth, err := client.Login("mi@email.com", "mi_contraseña")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Token: %s\n", auth.Token)

	// Crear nota
	resp, err := client.CreateNote(bibleapi.Note{
		Title:       "Estudio de Génesis",
		Description: "Notas sobre la creación",
		Body:        "En el principio creó Dios los cielos y la tierra...",
		Page:        "https://bible-api.deno.dev/api/read/rv1960/genesis/1",
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Nota creada con ID: %s\n", resp.ID)
}
```

---

## Consultas en Paralelo con Goroutines

```go
package main

import (
	"fmt"
	"sync"
)

func getChaptersParallel() {
	client := NewClient("")

	type chapterResult struct {
		chapter *Chapter
		err     error
	}

	requests := []struct {
		version  string
		book     string
		chapter  int
	}{
		{"rv1960", "genesis", 1},
		{"nvi", "exodo", 1},
		{"dhh", "juan", 3},
	}

	var wg sync.WaitGroup
	results := make([]chapterResult, len(requests))

	for i, req := range requests {
		wg.Add(1)
		go func(index int, v, b string, c int) {
			defer wg.Done()
			ch, err := client.GetChapter(v, b, c)
			results[index] = chapterResult{chapter: ch, err: err}
		}(i, req.version, req.book, req.chapter)
	}

	wg.Wait()

	for _, r := range results {
		if r.err != nil {
			fmt.Printf("Error: %v\n", r.err)
			continue
		}
		fmt.Printf("%s - Capítulo %d: %d versículos\n",
			r.chapter.Name, r.chapter.Chapter, len(r.chapter.Vers))
	}
}

func main() {
	getChaptersParallel()
}
```
