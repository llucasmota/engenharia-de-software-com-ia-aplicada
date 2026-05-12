# Demo: Next.js + Better Auth + GitHub + SQLite

Demo simples de autenticação OAuth com GitHub usando **Next.js App Router**, **Better Auth** e **SQLite** local.

## Pré-requisitos

- Node.js 18+
- npm
- Uma OAuth App no GitHub

## 1. Criar OAuth App no GitHub

1. Acesse [github.com/settings/developers](https://github.com/settings/developers)
2. Clique em **New OAuth App**
3. Preencha:
   - **Application name**: `Better Auth Demo`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Clique em **Register application**
5. Copie o **Client ID** e gere um **Client Secret**

## 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
BETTER_AUTH_SECRET=troque-por-um-valor-secreto-longo
BETTER_AUTH_URL=http://localhost:3000

GITHUB_CLIENT_ID=seu_client_id_do_github
GITHUB_CLIENT_SECRET=seu_client_secret_do_github
```

> **Dica**: gere um secret seguro com `openssl rand -hex 32`

## 3. Instalar dependências

```bash
npm install
```

## 4. Migrar o banco de dados (SQLite)

```bash
npx @better-auth/cli migrate --yes
```

Isso cria o arquivo `better-auth.sqlite` com as tabelas de usuários, sessões e contas.

## 5. Rodar em modo desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Estrutura de arquivos

```
nextjs-better-auth-demo/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts       # Handler do Better Auth (GET + POST)
│   ├── login/
│   │   └── page.tsx               # Página de login (botão "Entrar com GitHub")
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Home: "Hello World" + estado de sessão
├── lib/
│   ├── auth.ts                    # Configuração do Better Auth (servidor)
│   └── auth-client.ts             # Auth client (lado cliente)
├── .env.local                     # Variáveis de ambiente (não commitar!)
├── better-auth.sqlite             # Banco de dados local
└── package.json
```

## Dependências principais

| Pacote | Versão | Uso |
|---|---|---|
| `better-auth` | ^1.4 | Autenticação completa |
| `@better-auth/cli` | ^1.4 | Migração do banco |
| `better-sqlite3` | ^12 | Driver SQLite local |
| `next` | 16.x | Framework React (App Router) |

## Fluxo de autenticação

1. Usuário acessa `/` → vê "Você não está logado" + link para `/login`
2. Na `/login` → clica "Entrar com GitHub" → redirecionado para OAuth do GitHub
3. Após autorizar → volta para `/` → vê "Logado como `email`"
4. Clica "Sair" → sessão encerrada, volta ao estado inicial
