# 🎬 Meus Filmes — Personal Movie Tracker & Rating Dashboard

Uma aplicação web completa e moderna para gerenciamento, acompanhamento e avaliação de filmes assistidos. O projeto permite filtrar obras por status (*Concluído, Em andamento, Não iniciado, Dropei*), ordenar, buscar, além de integrar com APIs externas para enriquecimento de metadados e comparação/rankeamento com as notas do IMDb.


## 🚀 Funcionalidades

- **🗂️ Gerenciamento por Status:** Filtre rapidamente seus filmes por categorias como *Todos*, *Em andamento*, *Concluído*, *Não iniciada* e *Dropei*.
- **⭐ Avaliação & Rankings:** Sistema de avaliação pessoal exibido em destaque nos cards, integrado a metadados para comparação de notas.
- **🔍 Busca e Ordenação em Tempo Real:** Pesquise filmes pelo título e ordene a biblioteca conforme suas preferências.
- **➕ Modal para Adicionar Filmes:** Interface intuitiva para inclusão rápida de novos títulos à sua coleção (`AddMovieModal`).
- **🗃️ Enriquecimento Automático de Dados:** Integração com a **OMDb API** para buscar capas (posters), notas adicionais, sinopses e detalhes técnicos automaticamente.
- **📊 Importação e Scripts Utilitários:** Scripts dedicados em Node.js para inicialização do banco de dados, importação via arquivo CSV (`meus-filmes.csv`) e enriquecimento em lote (`enrich-all.js`).

---

## 🛠️ Tecnologias Utilizadas

### **Frontend & Backend (Fullstack)**
- **[Next.js](https://nextjs.org/)** (App Router) — Framework React para renderização de alta performance e rotas de API serverless.
- **[React](https://reactjs.org/)** — Biblioteca para construção de componentes modulares de interface.
- **[Tailwind CSS](https://tailwindcss.com/)** — Framework CSS utilitário para estilização responsiva, moderna e tema escuro (*Dark Mode*).

### **APIs & Utilitários**
- **OMDb API (`omdb.js`)** — Consumo de dados e posters de filmes do IMDb.
- **Node.js Scripts** — Automação de banco de dados e enriquecimento/processamento de planilhas CSV.

---

## 📁 Estrutura do Projeto

```text
Site-Filmes/
├── app/
│   ├── api/
│   │   └── movies/
│   │       └── [id]/
│   │           └── enrich/      # Rota de API para enriquecimento de dados por ID
│   ├── globals.css              # Estilos globais do Tailwind CSS
│   ├── layout.js                # Template/Layout principal
│   └── page.js                  # Página principal do Dashboard
├── components/                  # Componentes reutilizáveis de interface
│   ├── AddMovieModal.js         # Modal de cadastro de novos filmes
│   ├── FilterBar.js             # Barra de filtros e ordenação
│   ├── MovieCard.js             # Card de exibição do filme e nota
│   ├── MovieDrawer.js           # Painel lateral / Detalhes expandidos
│   └── MovieGrid.js             # Grid responsivo de filmes
├── lib/                         # Camada de lógica, conexão e requisições
│   ├── db.js                    # Conexão com banco de dados
│   ├── movieQuery.js            # Consultas e queries de filmes
│   ├── omdb.js                  # Cliente/Integração com a API do OMDb
│   └── status.js                # Mapeamento e tratamento de status
├── scripts/                     # Scripts automáticos de CLI/Manutenção
│   ├── enrich-all.js            # Enriquece todos os registros