# 🚀 Deployment Guide - CryptoIntel Pro su Vercel

## Prerequisiti
- Account Vercel (gratuito): https://vercel.com/signup
- Account GitHub (per collegare il repository)
- Database Supabase già configurato

## Opzione 1: Deploy tramite Vercel CLI (Consigliato)

### 1. Installa Vercel CLI
```bash
npm install -g vercel
```

### 2. Login a Vercel
```bash
vercel login
```

### 3. Deploy il progetto
Dalla directory del progetto, esegui:
```bash
vercel
```

Segui le istruzioni:
- **Set up and deploy?** → Yes
- **Which scope?** → Seleziona il tuo account
- **Link to existing project?** → No
- **Project name?** → cryptointel-pro (o il nome che preferisci)
- **Directory?** → ./ (premi Enter)
- **Override settings?** → No

### 4. Configura le variabili d'ambiente
Dopo il primo deploy, vai su:
https://vercel.com/[tuo-username]/cryptointel-pro/settings/environment-variables

Aggiungi le seguenti variabili (copia da `.env.local`):

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` = https://tzorfzsdhyceyumhlfdp.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = [la tua anon key]
- `SUPABASE_SERVICE_ROLE_KEY` = [la tua service role key]

**AI API Keys:**
- `ANTHROPIC_API_KEY` = [la tua chiave Claude]
- `OPENAI_API_KEY` = [la tua chiave OpenAI]
- `DEEPSEEK_API_KEY` = [la tua chiave DeepSeek]

**Opzionali:**
- `GOOGLE_AI_API_KEY` = [se hai Gemini]
- `GROK_API_KEY` = [se hai Grok]
- `COINGECKO_API_KEY` = [se hai CoinGecko Pro]

**App Config:**
- `NEXT_PUBLIC_APP_URL` = https://[tuo-dominio].vercel.app

### 5. Redeploy con le variabili
```bash
vercel --prod
```

---

## Opzione 2: Deploy tramite GitHub + Vercel Dashboard

### 1. Inizializza Git (se non l'hai già fatto)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Crea un repository su GitHub
- Vai su https://github.com/new
- Nome: `cryptointel-pro`
- Visibilità: Private (consigliato, contiene chiavi API)
- Crea il repository

### 3. Collega il repository locale
```bash
git remote add origin https://github.com/[tuo-username]/cryptointel-pro.git
git branch -M main
git push -u origin main
```

### 4. Importa su Vercel
- Vai su https://vercel.com/new
- Clicca "Import Git Repository"
- Seleziona il repository `cryptointel-pro`
- Clicca "Import"

### 5. Configura le variabili d'ambiente
Prima di cliccare "Deploy", espandi "Environment Variables" e aggiungi tutte le variabili elencate sopra.

### 6. Deploy
Clicca "Deploy" e attendi il completamento.

---

## Post-Deployment

### Verifica il deployment
1. Vai all'URL fornito da Vercel (es: https://cryptointel-pro.vercel.app)
2. Testa la pagina `/trading`
3. Prova un'analisi AI cliccando su un pair

### Aggiorna il dominio in Supabase
Se hai configurato autenticazione:
1. Vai su Supabase Dashboard → Authentication → URL Configuration
2. Aggiungi l'URL di Vercel ai "Redirect URLs"

### Monitoraggio
- **Logs**: https://vercel.com/[username]/cryptointel-pro/logs
- **Analytics**: https://vercel.com/[username]/cryptointel-pro/analytics

---

## Troubleshooting

### Build fallisce
- Controlla i log su Vercel
- Verifica che tutte le dipendenze siano in `package.json`
- Assicurati che `npm run build` funzioni localmente

### API non funzionano
- Verifica che tutte le variabili d'ambiente siano configurate
- Controlla che le chiavi API siano valide
- Verifica i CORS settings su Supabase

### Database non si connette
- Verifica che `NEXT_PUBLIC_SUPABASE_URL` sia corretto
- Controlla che le chiavi Supabase siano valide
- Verifica che le migrazioni siano state eseguite

---

## Comandi Utili

```bash
# Deploy in produzione
vercel --prod

# Deploy preview (test)
vercel

# Visualizza logs
vercel logs

# Rimuovi deployment
vercel remove [deployment-url]

# Lista deployments
vercel ls
```

---

## Note Importanti

⚠️ **Sicurezza:**
- Non committare mai `.env.local` su Git (è già in `.gitignore`)
- Usa sempre variabili d'ambiente su Vercel
- Mantieni private le chiavi API

💡 **Performance:**
- Vercel usa Edge Functions per le API routes
- Il primo caricamento potrebbe essere lento (cold start)
- Considera di usare ISR (Incremental Static Regeneration) per le pagine statiche

🔄 **Auto-Deploy:**
- Ogni push su `main` trigghera un deploy automatico
- I branch creano preview deployments automatici
