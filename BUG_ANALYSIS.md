# 🐛 Analisi Bug e Problemi del Codice

## 🔴 Bug Critici

### 1. **JSON.parse senza gestione errori** (Alto Rischio)
**File**: `src/lib/ai/claude.ts`, `src/lib/ai/openai.ts`, `src/lib/ai/gemini.ts`

**Problema**: `JSON.parse()` può lanciare eccezioni se l'AI restituisce JSON non valido.

```typescript
// ❌ BUG: Nessun try-catch per JSON.parse
const result = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
```

**Impatto**: Se l'AI restituisce testo non-JSON, l'applicazione crasha.

**Fix suggerito**:
```typescript
try {
    const result = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    // Validare che result abbia le proprietà necessarie
    if (typeof result.sentiment !== 'number' || typeof result.confidence !== 'number') {
        throw new Error('Invalid AI response format');
    }
    return result;
} catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('AI returned invalid JSON format');
}
```

---

### 2. **Variabili d'ambiente non validate** (Alto Rischio)
**File**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

**Problema**: Uso di `!` (non-null assertion) senza validazione reale.

```typescript
// ❌ BUG: Se la variabile è undefined, l'app crasha
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

**Impatto**: Crash all'avvio se le variabili d'ambiente mancano.

**Fix suggerito**:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables');
}
```

---

### 3. **Divisione per zero nei calcoli finanziari** (Alto Rischio)
**File**: `src/lib/trading/positions.ts`, `src/lib/trading/positionSizing.ts`

**Problema**: Calcoli P&L e position sizing possono dividere per zero.

```typescript
// ❌ BUG: Se entry_price è 0, divisione per zero
const pnl = (priceDiff / position.entry_price) * position.position_value;
const pnlPercent = (priceDiff / position.entry_price) * 100;
```

**Impatto**: `Infinity` o `NaN` nei calcoli finanziari.

**Fix suggerito**:
```typescript
if (position.entry_price === 0) {
    throw new Error('Invalid entry price: cannot be zero');
}
const pnl = (priceDiff / position.entry_price) * position.position_value;
```

---

### 4. **Validazione input mancante nelle API routes** (Medio Rischio)
**File**: `src/app/api/ai/analyze/route.ts`

**Problema**: Validazione minima, nessun controllo su tipo e formato.

```typescript
// ❌ BUG: Validazione troppo debole
if (!symbol || !marketData) {
    return NextResponse.json({ error: 'Missing symbol or marketData' }, { status: 400 });
}
// Manca validazione su:
// - symbol è una stringa valida?
// - marketData ha la struttura corretta?
// - marketData.price è un numero valido?
```

**Fix suggerito**:
```typescript
if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
}

if (!marketData || typeof marketData !== 'object') {
    return NextResponse.json({ error: 'Invalid marketData' }, { status: 400 });
}

if (typeof marketData.price !== 'number' || marketData.price <= 0) {
    return NextResponse.json({ error: 'Invalid price in marketData' }, { status: 400 });
}
```

---

## 🟡 Bug di Logica

### 5. **Calcolo confidence errato in orchestrator** (Medio Rischio)
**File**: `src/lib/ai/orchestrator.ts`

**Problema**: Il confidence viene diviso per 100 nelle funzioni AI, ma poi viene trattato come se fosse già 0-1.

```typescript
// In claude.ts, openai.ts, gemini.ts:
confidence: result.confidence / 100,  // Converte 0-100 a 0-1

// Ma in orchestrator.ts:
const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
// Qui confidence è già 0-1, ma poi:
if (avgConfidence > 0.75) {  // ✅ Corretto
```

**Nota**: Questo sembra corretto, ma potrebbe essere confuso. Verificare che tutte le funzioni AI dividano per 100.

---

### 6. **Trailing stop loss può invertire la logica** (Medio Rischio)
**File**: `src/lib/trading/positions.ts`

**Problema**: Il trailing stop per SHORT potrebbe non funzionare correttamente.

```typescript
// ❌ POTENZIALE BUG: Per SHORT, il trailing stop dovrebbe solo scendere
// Se il prezzo scende (profitto), lo stop loss dovrebbe scendere
// Se il prezzo sale (perdita), lo stop loss non dovrebbe cambiare
export function updateTrailingStop(
    position: Trade,
    currentPrice: number,
    trailingPercent: number = 0.02
): number {
    if (position.direction === 'LONG') {
        const newStop = currentPrice * (1 - trailingPercent);
        return Math.max(position.stop_loss, newStop);  // ✅ OK: solo aumenta
    } else {
        // ❌ BUG: Per SHORT, dovrebbe solo diminuire, non aumentare
        const newStop = currentPrice * (1 + trailingPercent);
        return Math.min(position.stop_loss, newStop);  // Questo può aumentare lo stop!
    }
}
```

**Fix suggerito**:
```typescript
} else {
    // Per SHORT: stop loss scende solo se il prezzo scende (profitto)
    // Se prezzo sale (perdita), manteniamo lo stop originale
    if (currentPrice < position.entry_price) {
        // In profitto, possiamo stringere lo stop
        const newStop = currentPrice * (1 + trailingPercent);
        return Math.min(position.stop_loss, newStop);
    }
    // In perdita, non modificare lo stop
    return position.stop_loss;
}
```

---

### 7. **Calcolo P&L per SHORT potrebbe essere errato** (Medio Rischio)
**File**: `src/lib/trading/positions.ts`

**Problema**: Verificare che il calcolo P&L per SHORT sia corretto.

```typescript
// Verificare questa logica:
const priceDiff = position.direction === 'LONG'
    ? currentPrice - position.entry_price
    : position.entry_price - currentPrice;

const pnl = (priceDiff / position.entry_price) * position.position_value;
```

**Nota**: La logica sembra corretta, ma testare con valori negativi.

---

### 8. **Kelly Criterion può restituire valori negativi** (Medio Rischio)
**File**: `src/lib/trading/positionSizing.ts`

**Problema**: Se winRate è basso, Kelly può essere negativo, ma viene gestito con `Math.max(0, ...)`.

```typescript
const kellyFraction = (payoffRatio * winRate - (1 - winRate)) / payoffRatio;
const fractionalKelly = Math.max(0, kellyFraction * 0.5);  // ✅ OK
```

**Nota**: Questo è corretto, ma potrebbe essere più chiaro.

---

## 🟠 Problemi di Sicurezza

### 9. **Chiavi API potenzialmente esposte** (Medio Rischio)
**File**: `src/lib/ai/claude.ts`, `src/lib/ai/openai.ts`, `src/lib/ai/gemini.ts`

**Problema**: Le chiavi API vengono inizializzate a livello di modulo, potenzialmente esposte in bundle client.

**Nota**: Verificare che queste funzioni siano solo server-side. Next.js dovrebbe gestire questo, ma verificare.

---

### 10. **Nessuna rate limiting sulle API** (Basso Rischio)
**File**: `src/app/api/ai/analyze/route.ts`, `src/app/api/prices/route.ts`

**Problema**: Nessuna protezione contro abuso/DoS.

**Fix suggerito**: Implementare rate limiting con middleware Next.js o librerie come `@upstash/ratelimit`.

---

## 🔵 Problemi di Type Safety

### 11. **Uso eccessivo di `any`** (Basso Rischio)
**File**: Vari file

**Problema**: Uso di `any` riduce la type safety.

```typescript
// ❌ In orchestrator.ts
marketData: any

// ✅ Dovrebbe essere:
interface MarketData {
    price: number;
    volume?: number;
    // ...
}
```

---

### 12. **Mancanza di validazione runtime per tipi** (Basso Rischio)
**File**: `src/app/api/ai/analyze/route.ts`

**Problema**: TypeScript non valida a runtime.

**Fix suggerito**: Usare librerie come `zod` per validazione runtime.

---

## 🟢 Problemi Minori / Miglioramenti

### 13. **Gestione errori inconsistente**
**File**: Vari file

**Problema**: Alcuni errori vengono loggati, altri lanciati, altri ignorati.

**Fix suggerito**: Standardizzare la gestione errori con un sistema centralizzato.

---

### 14. **Mancanza di timeout per chiamate API esterne**
**File**: `src/lib/api/coingecko.ts`, `src/lib/ai/*.ts`

**Problema**: Le chiamate API possono bloccarsi indefinitamente.

**Fix suggerito**:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    // ...
} catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
        throw new Error('Request timeout');
    }
    throw error;
}
```

---

### 15. **Calcolo Sharpe Ratio semplificato**
**File**: `src/lib/trading/backtest.ts`

**Problema**: Il calcolo assume rendimenti giornalieri, ma i trade potrebbero non essere giornalieri.

**Nota**: Funziona per MVP, ma migliorare in produzione.

---

### 16. **Simulazione dati invece di dati reali**
**File**: `src/lib/market/technicals.ts`, `src/lib/market/macro.ts`, `src/lib/market/news.ts`

**Problema**: Tutti i dati sono simulati con `Math.random()`.

**Nota**: OK per MVP, ma chiarire nella documentazione che sono dati mock.

---

### 17. **Mancanza di validazione su stopLoss/takeProfit**
**File**: `src/lib/ai/orchestrator.ts`

**Problema**: Se `currentPrice` è 0 o negativo, stopLoss/takeProfit saranno invalidi.

```typescript
// ❌ Nessuna validazione
const currentPrice = marketData.price;
let stopLoss = 0;
let takeProfit = 0;

if (direction === 'LONG') {
    stopLoss = currentPrice * 0.97;  // Se currentPrice è 0, stopLoss è 0
    takeProfit = currentPrice * 1.05;
}
```

**Fix suggerito**:
```typescript
if (currentPrice <= 0) {
    throw new Error('Invalid current price');
}
```

---

### 18. **Race condition potenziale in Promise.allSettled**
**File**: `src/lib/ai/orchestrator.ts`

**Problema**: Se tutte le analisi falliscono, viene lanciato un errore, ma potrebbe essere gestito meglio.

```typescript
if (analyses.length === 0) {
    throw new Error('All AI analyses failed');
}
```

**Nota**: OK, ma considerare di restituire un errore più informativo con dettagli.

---

### 19. **Mancanza di logging strutturato**
**File**: Vari file

**Problema**: Uso di `console.log` invece di un sistema di logging strutturato.

**Fix suggerito**: Usare librerie come `pino` o `winston`.

---

### 20. **Fallback prices usa Math.random()**
**File**: `src/lib/api/coingecko.ts`

**Problema**: I prezzi di fallback sono randomici, non realistici.

```typescript
change24h: (Math.random() - 0.5) * 10,  // ❌ Random, non realistico
```

**Fix suggerito**: Usare ultimi prezzi conosciuti o cache.

---

## 📋 Riepilogo Priorità

### 🔴 Critici (Fix immediato)
1. JSON.parse senza try-catch
2. Variabili d'ambiente non validate
3. Divisione per zero nei calcoli
4. Validazione input API

### 🟡 Importanti (Fix prossimo sprint)
5. Calcolo confidence
6. Trailing stop per SHORT
7. Calcolo P&L SHORT
8. Kelly Criterion edge cases

### 🟠 Sicurezza (Fix prima produzione)
9. Chiavi API esposte
10. Rate limiting

### 🔵 Miglioramenti (Backlog)
11-20. Type safety, logging, timeout, etc.

---

## 🛠️ Raccomandazioni Generali

1. **Aggiungere test unitari** per tutti i calcoli finanziari
2. **Implementare validazione runtime** con `zod` o simile
3. **Aggiungere error boundaries** in React
4. **Implementare monitoring** (Sentry, LogRocket, etc.)
5. **Aggiungere documentazione** per edge cases
6. **Implementare circuit breakers** per API esterne
7. **Aggiungere retry logic** con exponential backoff

