# Lectio Escolar - Sistema de Biblioteca Digital e Repositório Escolar

O **Lectio Escolar** é uma plataforma web para gestão, categorização e distribuição de materiais didáticos digitais. O sistema atua como uma biblioteca pública virtual para instituições de ensino, permitindo o acesso universal ao acervo geral da escola e a distribuição de conteúdos direcionados por turmas e disciplinas.

Projeto desenvolvido para a disciplina de **Projeto Integrado** no curso de Análise e Desenvolvimento de Sistemas (Unichristus).

---

## 🛠️ Tecnologias Utilizadas

### **Back-end**
* **Linguagem & Framework:** C# (.NET 8 Web API)
* **Persistência de Dados:** Entity Framework Core
* **Banco de Dados:** PostgreSQL
* **Autenticação & Segurança:** JWT (JSON Web Tokens) e BCrypt.Net
* **Documentação de API:** Swagger UI (Swashbuckle)

### **Front-end**
* **Biblioteca Principal:** React.js (com TypeScript)
* **Ferramenta de Build:** Vite
* **Roteamento:** React Router DOM
* **Comunicação HTTP:** Axios
* **Padronização e Qualidade:** ESLint

---

## 📁 Estrutura do Repositório

O projeto adota a estrutura de monorepo organizada por frentes de desenvolvimento:

```text
lectio-escolar/
├── src/
│   ├── backend/
│   │   ├── LectioEscolar.sln
│   │   └── LectioEscolar.Api/          # Web API em ASP.NET Core (.NET 8)
│   │       ├── Controllers/
│   │       ├── Data/
│   │       ├── Dtos/
│   │       ├── Entities/
│   │       ├── Enums/
│   │       ├── Services/
│   │       └── Program.cs
│   └── frontend/                        # Aplicação React com Vite e TypeScript
│       ├── src/
│       │   ├── components/
│       │   ├── contexts/
│       │   ├── pages/
│       │   ├── routes/
│       │   ├── services/
│       │   └── types/
│       ├── package.json
│       └── vite.config.ts
├── .gitignore
└── README.md
