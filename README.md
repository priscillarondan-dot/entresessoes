
# EntreSessões — Cloudflare Pages + Supabase

Esta versão foi feita para publicar em **Cloudflare Pages** usando **Supabase** como banco de dados.

## 1. Criar banco no Supabase

1. Acesse Supabase.
2. Crie um projeto novo.
3. Vá em **SQL Editor**.
4. Cole todo o conteúdo do arquivo `supabase-schema.sql`.
5. Clique em **Run**.

## 2. Pegar as chaves do Supabase

No Supabase, vá em:

**Project Settings > API**

Copie:

- Project URL
- anon public key

## 3. Subir para o GitHub

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta para o repositório.

## 4. Publicar no Cloudflare Pages

1. Cloudflare > Workers e Páginas > Criar aplicativo > Pages
2. Conecte ao GitHub
3. Selecione o repositório
4. Configure:

**Framework preset:** Next.js  
**Build command:** `npm run pages:build`  
**Build output directory:** `.vercel/output/static`

## 5. Variáveis de ambiente no Cloudflare

Em **Settings > Environment Variables**, adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
```

Depois clique em **Retry deployment** ou crie uma nova implantação.

## Observação importante

Esta é uma versão MVP para validação. Para vender profissionalmente, os próximos passos são:

- autenticação segura com Supabase Auth;
- permissões LGPD mais rígidas;
- criptografia de dados sensíveis;
- assinatura mensal;
- WhatsApp ou push notifications;
- IA com revisão/aprovação do psicólogo.
