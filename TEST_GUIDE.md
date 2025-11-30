# 🧪 Test Guide - CryptoIntel Pro

## ✅ Sistema Verificato

Il sistema è **completamente operativo**! Le API stanno funzionando:

```
✅ Server running on http://localhost:3000
✅ CoinGecko API: Fetching real prices
✅ /api/prices: Responding with live data
✅ Auto-update: Every 5 seconds
```

## 🎮 Come Testare

### 1. **Visualizza i Prezzi Real-Time**
Vai su: http://localhost:3000/trading

Dovresti vedere il **Market Selector** con 5 coppie:
- BTC/EUR
- ETH/EUR  
- SOL/EUR
- LINK/EUR
- ARB/EUR

I prezzi si aggiornano automaticamente ogni 5 secondi da CoinGecko.

---

### 2. **Testa l'Analisi AI Manuale**

1. Clicca su una coppia (es. **BTC/EUR**)
2. Aspetta ~2 secondi per l'analisi AI
3. Vedrai:
   - **AI Analysis Panel**: 3 modelli AI (Claude, GPT-4, Gemini) con il loro reasoning
   - **Risk Checklist**: AI Confidence, Market Trend, Daily Loss Limit
   - **Signal Details**: Entry, Stop Loss, Take Profit

4. Se i controlli passano (✅), il pulsante **LONG/SHORT** si attiva
5. Clicca per eseguire il trade

**Nota**: Senza API keys reali, gli AI useranno dati mock ma intelligenti.

---

### 3. **Attiva il Bot Automatico** 🤖

1. Clicca il pulsante **○ AUTO OFF** (diventa **● AUTO ON**)
2. Il bot inizia a:
   - Scansionare le coppie ciclicamente
   - Analizzare con AI + Tecnico + Macro + News
   - Eseguire trade se i risk checks passano
   - Monitorare le posizioni aperte

**Il bot si fermerà automaticamente quando**:
- Raggiunge 3 posizioni aperte (max)
- Il saldo scende sotto €1000
- Una coppia ha già una posizione aperta

---

### 4. **Osserva l'Auto-Close** 🎯

Quando apri una posizione, il sistema:

1. **Monitora in tempo reale** il prezzo
2. **Calcola P&L** continuamente
3. **Chiude automaticamente** quando:
   - Prezzo raggiunge **Stop Loss** (3% loss)
   - Prezzo raggiunge **Take Profit** (5% gain)

Controlla la **console del browser** (F12) per vedere i log:
```
🔔 Auto-closing BTC/EUR LONG - TAKE_PROFIT: +4.82%
📊 Position Sizing: €1,245.50 using Kelly Criterion - Optimal size based on 12 historical trades
```

---

### 5. **Verifica Position Sizing Dinamico**

- **Primi 5 trade**: Fixed 2% (~€250)
- **Dopo 5 trade**: Kelly Criterion (~€500-1500 a seconda di winrate)
- **Alta confidence AI**: Position size aumenta
- **Bassa confidence**: Position size diminuisce

Il sistema tiene automaticamente traccia delle statistiche.

---

### 6. **Esplora la Dashboard Analytics**

Vai su: http://localhost:3000/analytics

Vedrai:
- **Technical Indicators**: RSI, MACD, EMA, Bollinger Bands
- **Macro Environment**: Interest rates, DXY, VIX, Carry Trade Risk
- **News Sentiment**: Aggregated sentiment + key topics
- **Performance Metrics**: Volume, Market Cap, Dominance

---

## 🔍 Test dei Componenti

### Test CoinGecko API (manuale)
Apri: http://localhost:3000/api/prices

Dovresti vedere un JSON con prezzi reali:
```json
{
  "BTC/EUR": {
    "price": 78137,
    "change24h": 2.1,
    "volume": 45000000,
    ...
  }
}
```

### Test Console Logs
Apri DevTools (F12) → Console

Vedrai log dettagliati:
```
🔍 Gathering market context for BTC/EUR...
📊 Market Report Generated
✅ Claude analysis complete
✅ GPT-4 analysis complete  
✅ Gemini analysis complete
📈 3 AI models responded successfully
🎯 Final Signal: BUY LONG
```

---

## 🐛 Risoluzione Problemi

### "Insufficient balance"
- Hai finito il capitale simulato
- Chiudi alcune posizioni o ricarica la pagina

### "Max positions reached"
- Il bot ha aperto 3 trade (limite di sicurezza)
- Chiudi manualmente o aspetta auto-close

### "Position already open for this pair"
- Il bot non apre duplicati 
- Questo è un comportamento corretto

### Prezzi non si aggiornano
- Controlla la console (F12)
- CoinGecko potrebbe avere rate limits
- Il sistema usa fallback automatico a mock data

---

## 🎯 Test Completo (5 minuti)

1. ✅ Apri http://localhost:3000/trading
2. ✅ Seleziona BTC/EUR manualmente
3. ✅ Osserva l'analisi AI
4. ✅ Esegui 1 trade manuale
5. ✅ Attiva AUTO ON
6. ✅ Lascia girare per 2-3 minuti
7. ✅ Osserva auto-close quando SL/TP raggiunto
8. ✅ Vai su /analytics per vedere le dashboard

---

## 📊 Indicatori di Successo

Se funziona correttamente vedrai:

✅ Prezzi che cambiano ogni 5 secondi  
✅ Bot che cicla tra le coppie (BTC→ETH→SOL→...)  
✅ Log in console con emoji  
✅ Posizioni che si aprono automaticamente  
✅ Balance che diminuisce/aumenta  
✅ Position counter che sale/scende  

---

## 🚀 Prossimi Passi

Dopo aver testato, puoi:

1. **Aggiungere API Keys** reali in `.env.local` per AI models
2. **Collegare Supabase** per salvare i trade
3. **Integrare NewsAPI** per sentiment reale
4. **Fare backtest** su dati storici
5. **Ottimizzare parametri** (SL, TP, position sizing)

**Il sistema è production-ready per paper trading!** 🎉
