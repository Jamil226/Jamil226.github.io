# Muhammad Jamil: personal website

A static, multi-page portfolio that runs on GitHub Pages as-is. It needs no build step, framework or Jekyll.

## Pages

| File | What's on it |
|---|---|
| `index.html` | **Home**: hero, impact stats, featured papers, AIDCARE panel, research areas, latest blog posts, contact |
| `about.html` | **About**: bio, experience map, education, honours, skills, languages and certifications |
| `blog.html` | **Blog**: posts with tag filters; posts that have a `body` get their own page at `blog.html?p=<id>` |
| `consultancy.html` | **Consultancy**: eight professional services, each linked to supporting papers or products, plus process, ways to engage and sectors |
| `research.html` | **Research**: funded grants, then every paper with search, filters, a year chart, APA citation, BibTeX and `.bib` export |
| `teaching.html` | **Teaching**: courses with GitHub repos, teaching methodology, supervised final-year projects and committees |
| `development.html` | **Development**: AIDCare and the other featured software products, plus client websites |
| `404.html` | Not-found page |

Navbar: Home · About · Blog · Consultancy | logo | Research · Teaching · Development · Let's talk

Services on the Consultancy page are in `services: [...]` in `data.js`.

## Editing content

**All text lives in `assets/js/data.js`.** You never need to touch the HTML.

- **Add a blog post:** put a new item at the top of `posts: [...]` with `id`, `date`, `tag` and `title`, plus optional `summary`, `url` and `body` (a list of paragraphs, which gives the post its own page). The tag filters update automatically.
- **Add a paper:** add an entry to `publications: [...]`.
  - `type` is `journal`, `conference`, `review` or `thesis`.
  - Optional fields: `q: "Q1"`, `ifv` (impact factor), `doi` or `url`, `award`, `status` (for papers under review), `tags`.
  - Add `card: {...}` to feature the paper on the home page.
  - The counts, chart, impact-factor total, search and BibTeX all update by themselves.
- **Headline formatting:** use `*word*` for serif italic, `{word}` for a highlight block, and `_words_` for a hand-drawn underline.
- **Photo:** `assets/images/profile.jpg` (4:5). **CV:** `assets/cv.pdf`. **Favicons:** `assets/images/favicon/`.
- **Colour:** change `--cy` at the top of `assets/css/style.css`.

## Search

- Press **⌘K / Ctrl K**, or click the magnifier, to search the whole site. It covers papers, grants, development projects, courses, student projects, skills, honours and blog posts.
- Matching ignores accents, so "dogru" finds "Doğru".
- On the Research page, **/** focuses the paper search. Filters are kept in the URL, so links like `research.html?topic=LLM&q1=1` can be shared.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a repository named `Jamil226.github.io`.
2. Push this folder to its `main` branch. The `cv/` source folder is kept out by `.gitignore`.
   ```bash
   git init && git add . && git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/Jamil226/Jamil226.github.io.git
   git push -u origin main
   ```
3. In **Settings → Pages**, set Source to *Deploy from a branch*, `main`, `/ (root)`.
4. The site goes live at `https://jamil226.github.io` within a minute or two.

`404.html` uses `<base href="/">`, which is correct for a `username.github.io` repository. If you host the site at `username.github.io/some-repo/` instead, change it to `<base href="/some-repo/">`.
