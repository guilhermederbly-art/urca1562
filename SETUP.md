# F1 Bolão — Guia de Setup

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New Project**
3. Escolha um nome (ex: `f1-bolao`) e uma senha forte para o banco
4. Aguarde o projeto ser criado (~1 min)

## 2. Configurar o banco de dados

1. No painel do Supabase, vá em **SQL Editor**
2. Cole todo o conteúdo do arquivo `supabase/schema.sql`
3. Clique em **Run** — isso criará todas as tabelas, políticas e inserirá os pilotos de 2026

## 3. Pegar as chaves de API

No painel do Supabase, vá em **Project Settings > API**:

- Copie a **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copie a **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- Copie a **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

## 4. Configurar variáveis de ambiente

Edite o arquivo `.env.local` na raiz do projeto e preencha as três chaves acima.

## 5. Rodar localmente

```bash
cd f1-bolao
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## 6. Publicar no Vercel (gratuito)

1. Faça push do projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Em **Environment Variables**, adicione as 3 variáveis do `.env.local`
4. Clique em **Deploy** — estará online em ~2 minutos

---

## Como usar

### Para o administrador (você)

1. Faça login e acesse `/admin`
2. **Antes de cada GP**: clique em **Abrir palpites** — isso sorteia automaticamente a posição aleatória
3. **Antes do Q1**: o prazo encerra automaticamente (o formulário não fica mais disponível)
4. **Após a corrida**: clique em **Importar resultados** para buscar tudo via OpenF1 API e calcular pontos

### Como obter as chaves OpenF1

Acesse `https://api.openf1.org/v1/sessions?year=2026` e procure a corrida pelo `country_name`. Copie o `session_key` da sessão `Qualifying` e da `Race`. Insira esses valores ao criar a corrida no painel admin.

---

## Automação (importante)

A rotina que fecha os palpites, importa resultados e abre a corrida seguinte é o
endpoint `GET /api/cron/update`, protegido pela env var `CRON_SECRET`. Ele deve
ser chamado a cada ~10 minutos.

**Esse agendamento NÃO pode ficar no `vercel.json`.** O projeto está no plano
Hobby da Vercel, onde cron job só roda **uma vez por dia** — qualquer schedule
mais frequente faz o *deploy inteiro falhar*, com o erro apontando para
`vercel.com/docs/cron-jobs/usage-and-pricing`. Por isso o `vercel.json` é `{}`.

O agendamento vive num serviço externo (ex.: cron-job.org) chamando:

```
https://f1-bolao-eight.vercel.app/api/cron/update?secret=<CRON_SECRET>
```

Se um dia o projeto subir para o plano Pro, o cron pode voltar para o
`vercel.json`. Até então, **não readicionar** — quebra o deploy.

---

## Regras de pontuação

| Acerto | Pontos |
|--------|--------|
| Pole Position (exato) | 2 pts |
| P1, P2, P3 ou Posição Aleatória (exato) | 3 pts |
| Piloto no pódio, posição errada | 1 pt |
| Posição do Bortoleto (exato) | 3 pts |
