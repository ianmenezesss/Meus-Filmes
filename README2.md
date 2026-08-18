# Meus Filmes

Site pessoal estilo Letterboxd pra substituir a tabela do Notion: grade com
capas dos filmes, painel lateral com sinopse, nota do IMDb e sua própria nota
lado a lado.

## Stack
- **Next.js (React)** — front-end e API no mesmo projeto
- **Postgres** (via Vercel Storage) — banco de dados
- **OMDb API** — pôster, sinopse e nota do IMDb

---

## 1. Rodando local (VSCode)

```bash
npm install
```

Copie `.env.example` pra `.env.local` e preencha:

1. **OMDB_API_KEY** — crie uma chave gratuita em https://www.omdbapi.com/apikey.aspx
   (escolha o plano FREE, confirma pelo e-mail que chega).
2. **POSTGRES_URL** e as demais variáveis do banco — veja o passo 2 abaixo.

## 2. Criando o banco de dados (Vercel Postgres)

1. Suba o projeto pro GitHub e importe na Vercel (ou crie o projeto vazio na Vercel primeiro).
2. No projeto, vá em **Storage → Create Database → Postgres**.
3. Depois de criado, vá em **Settings → Environment Variables** do banco (ou aba
   `.env.local` que a própria Vercel mostra) e copie os valores pro seu `.env.local` local.
4. Ainda local, crie a tabela:

```bash
npm run db:init
```

## 3. Importando seus filmes do Notion

1. No Notion, abra a tabela → `···` → **Export** → CSV.
2. Rode:

```bash
npm run db:import -- ./caminho/para/seu-arquivo.csv
```

O script já espera as colunas que aparecem no seu print (`Nome`, `Classificação`,
`Status`, `Gêneros`, `Ano`, `Próximos Filmes`, `Prioridade`, `Adicionado em`,
`Filmes Ligados`, `Minutagem`). Se o Notion exportar algum nome de coluna
diferente, é só ajustar o objeto `COLUMN_MAP` no topo de
`scripts/import-csv.js`.

O import **não busca pôster/sinopse/nota do IMDb automaticamente** (pra não
estourar o limite gratuito da OMDb de uma vez só com ~160 filmes). Depois de
importar, abra o site e clique em cada filme pra buscar os dados — ou, se
quiser buscar tudo de uma vez, me avise que te passo um script de "enrich em
lote" com um intervalo entre as chamadas.

## 4. Rodando local

```bash
npm run dev
```

Acesse http://localhost:3000

## 5. Deploy na Vercel

```bash
git add .
git commit -m "primeira versao"
git push
```

Na Vercel, importe o repositório. Em **Settings → Environment Variables**,
adicione `OMDB_API_KEY` (as variáveis do Postgres já ficam configuradas
automaticamente se você criou o banco pelo próprio painel do projeto).

---

## Como usar o site

- **Grade principal**: mostra os pôsteres, com a nota que você deu no canto
  (selo dourado) e o status no canto oposto.
- **Filtros**: por status (Concluído, Em andamento, Não iniciada, Dropei) e
  busca por nome.
- **Adicionar filme** (botão no topo): cadastra filmes novos, inclusive os que
  você ainda não assistiu — a nota fica em branco até você assistir e editar.
- **Clicar num filme**: abre o painel lateral com pôster grande, sinopse,
  nota do IMDb (azul) e sua nota (dourada, editável direto ali), gêneros e
  status (clicável pra mudar). Se o filme ainda não tem dados do IMDb, aparece
  um botão pra buscar.

## Estrutura do projeto

```
app/
  page.js                 -> página principal (grade + filtros)
  api/movies/              -> rotas da API (listar, criar, editar, deletar, enrich)
components/
  MovieGrid.js, MovieCard.js, MovieDrawer.js, AddMovieModal.js, FilterBar.js
lib/
  db.js                    -> funções de acesso ao banco (Postgres)
  omdb.js                  -> integração com a OMDb API
scripts/
  init-db.js                -> cria a tabela
  import-csv.js              -> importa o CSV do Notion
```

## Próximos passos possíveis
- Página própria por filme (compartilhável), além do painel lateral
- Ordenar por nota do IMDb, ano, data de adição
- Importação em lote dos dados do IMDb com controle de rate limit
- Autenticação simples, caso queira deixar o site público mas só você editar
