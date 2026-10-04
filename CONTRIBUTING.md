# Contributing to MakeMy Tour

Thank you for your interest in contributing! This document explains how to set up the development environment and the conventions used throughout the codebase.

## Author & Maintainer

**Maaz Shaikh** — *Project Lead & Primary Developer*
GitHub: [@MaazShaikh845](https://github.com/MaazShaikh845)

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Java | 21+ |
| Maven | 3.9+ (or use the included `mvnw`) |
| Node.js | 18+ |
| MongoDB Atlas | Free tier or higher |

### Backend (Spring Boot)

```bash
# In the repo root
./mvnw spring-boot:run   # Linux / macOS
.\mvnw.cmd spring-boot:run  # Windows
```

The backend starts at **http://localhost:8082**.

### Frontend (Next.js)

```bash
cd makemytour
npm install
npm run dev
```

The frontend starts at **http://localhost:3000**.

---

## Coding Conventions

### Java (Backend)

- All public classes and methods **must** have Javadoc comments.
- Factory / builder methods are preferred over inline object construction at call sites.
- Constructor injection is used instead of `@Autowired` on fields wherever possible.
- Refund and domain logic lives exclusively in service classes — controllers are thin.

### TypeScript (Frontend)

- Interfaces are defined at the top of the file or in `lib/api.ts`.
- Redux state is the single source of truth for authenticated user data.
- API calls are centralised in `lib/api.ts` — no direct `fetch` calls inside components.
- Tailwind classes follow a mobile-first responsive pattern.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

Pull requests should be opened against `main` with a clear description of the change and any related issue numbers.

---

## Commit Message Format

```
type(scope): short imperative description

Longer explanation if needed (wrap at 72 characters).
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples:
- `feat(booking): add partial-refund calculation for hotel cancellations`
- `fix(auth): handle bcrypt exception on malformed stored password`
- `docs(readme): update local setup instructions for Windows`

---

## License

By contributing you agree that your contributions will be licensed under the [MIT License](LICENSE).
