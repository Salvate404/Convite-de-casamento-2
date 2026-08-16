# Anne & Vinicius — Convite de Casamento

Site-convite cinematográfico com confirmação de presença (RSVP).

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).  
Painel das confirmações: [http://localhost:3000/admin](http://localhost:3000/admin)

## Foto do casal

1. Coloque a imagem em `public/couple.jpg`
2. Em `src/app/page.tsx`, mude `<Hero hasPhoto={false} />` para `<Hero hasPhoto={true} />`

## RSVP / banco de dados

- **Local:** sem configuração — salva em `data/rsvps.json`
- **Produção (Vercel):** conecte um **Neon Postgres** pelo Marketplace da Vercel e defina `DATABASE_URL`
- Defina também `ADMIN_PASSWORD` para o painel `/admin`

## Deploy na Vercel

1. Suba o projeto no GitHub e importe na Vercel
2. Storage → Neon → Create Database (env `DATABASE_URL` é injetada)
3. Em Environment Variables, adicione `ADMIN_PASSWORD`
4. Deploy
