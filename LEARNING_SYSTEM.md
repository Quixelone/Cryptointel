# 📚 Learning System - Continuous Improvement

## Panoramica

Il **Learning System** di CryptoIntel Pro è un motore di apprendimento continuo che:

1. **Memorizza** tutte le analisi AI complete
2. **Traccia** gli outcome reali dei trade
3. **Analizza** pattern di successo/fallimento
4. **Ottimizza** automaticamente i parametri
5. **Esporta** dati per fine-tuning AI

---

## 🏗️ Architettura

### Database Schema

#### `analysis_sessions`
Ogni analisi AI completa viene salvata con:
- **Market Snapshot**: Prezzo, volume, market cap
- **Technical Data**: RSI, MACD, EMAs, Bollinger Bands
- **Macro Data**: Interest rates, DXY, VIX, global liquidity
- **News Data**: Sentiment, topics, sources
- **AI Analyses**: Tutti e 3 i modelli (Claude, GPT-4, Gemini)
- **Signal**: Strength, direction, confidence
- **Outcome**: WIN/LOSS/BREAK_EVEN (compilato dopo chiusura trade)

#### `ai_model_learning`
Statistiche aggregate per modello:
- Accuracy totale
- Avg sentiment quando vince vs quando perde
- Avg confidence quando vince vs quando perde
- Bias detection (tendenza bullish/bearish)
- Overconfidence detection

#### `market_patterns`
Pattern identificati automaticamente:
- Signature (condizioni di mercato)
- Win rate del pattern
- Avg return
- Best performing assets
- Statistical significance

#### `learning_insights`
Insight generati dal sistema:
- Market conditions che funzionano/non funzionano
- Model biases
- Risk factors
- Suggested actions

---

## 🔄 Flusso di Learning

### 1. Analisi
```typescript
// Quando viene eseguita un'analisi
const result = await orchestrateAnalysis(symbol, marketData)

// Il sistema salva:
const sessionId = await LearningLogger.logAnalysis({
    userId: 'user-1',
    symbol,
    price: marketData.price,
    marketContext: result.marketContext,
    marketReport: result.marketReport,
    signal: result.signal,
    wasExecuted: false,
    tradeId: undefined
})
```

### 2. Esecuzione Trade
```typescript
// Se il trade viene eseguito
if (userClicksExecute) {
    const trade = executeTrade(signal)
    
    // Link trade a session per tracking
    await LearningLogger.updateSession(sessionId, {
        wasExecuted: true,
        tradeId: trade.id
    })
}
```

### 3. Chiusura Trade (Outcome)
```typescript
// Quando trade si chiude (SL/TP)
const outcome = pnl > 0 ? 'WIN' : 'LOSS'

await LearningLogger.recordOutcome({
    sessionId,
    outcome,
    pnl,
    pnlPercent
})

// Il sistema AUTOMATICAMENTE:
// - Calcola prediction accuracy per ogni AI model
// - Aggiorna statistiche modelli
// - Identifica pattern
// - Genera insights
```

---

## 📊 Metriche Tracciate

### Per AI Model
- **Accuracy**: % previsioni corrette
- **Avg Sentiment When Win**: Sentiment medio trade vincenti
- **Avg Sentiment When Loss**: Sentiment medio trade perdenti
- **Avg Confidence When Win**: Confidence media trade vincenti
- **Avg Confidence When Loss**: Confidence media trade perdenti
- **Bullish Bias**: Tendenza a predire LONG
- **Overconfidence**: Gap tra confidence e accuracy reale

### Globali
- **Total Analyses**: Tutte le analisi eseguite
- **Executed**: Quante sono diventate trade
- **Win Rate**: % trade vincenti
- **Best Performing Model**: Il modello più accurato
- **Patterns Identified**: Pattern di mercato identificati

---

## 🎯 Learning Automatico

### 1. Confidence Calibration
Il sistema rileva automaticamente:
```
Se avgConfidenceWhenLoss > avgConfidenceWhenWin:
  → Overconfidente! 
  → Action: Aumenta soglia minima confidence
```

### 2. Model Selection
```
Se claude.accuracy > gpt4.accuracy:
  → Weight Claude's opinion more
  → Reduce GPT-4 influence
```

### 3. Pattern Recognition
```
Se "RSI < 30 + Positive News + Low VIX" → WIN rate 75%:
  → Memorizza pattern
  → Increase position size quando si ripresenta
```

### 4. Adaptive Thresholds
```python
# Current: STRONG_BUY se sentiment >= 75% AND confidence > 75%

# Se win_rate < 50% dopo 30 trade:
if learning_stats.win_rate < 0.5 and learning_stats.total_trades >= 30:
    # Increase thresholds
    signal_threshold = 80  # was 75
    confidence_threshold = 0.80  # was 0.75
```

---

## 📤 Export Training Data

### JSON Format
```json
[
  {
    "input": {
      "symbol": "BTC/EUR",
      "price": 78235.50,
      "technicals": { "rsi": 52, "macd": 0.45, ... },
      "macro": { "us_rate": 5.5, "dxy": 104 ... },
      "news": { "sentiment": 65, "topics": [...] },
      "marketReport": "Full text analysis..."
    },
    "prediction": {
      "sentiment": 72,
      "confidence": 0.84,
      "direction": "LONG"
    },
    "actual": {
      "outcome": "WIN",
      "pnl": 42.50,
      "pnlPercent": 4.25
    },
    "timestamp": "2025-11-29T10:00:00Z"
  }
]
```

### Utilizzo
1. **Fine-tune GPT-4**: Usa i dati per personalizzare il modello
2. **Train Custom Model**: Crea un modello specifico per crypto
3. **Backtest Improvements**: Valida modifiche su dati reali
4.  Pattern Analysis**: Analisi statistica esterna

---

## 🚀 Utilizzo

### Dashboard Learning
Vai su: `http://localhost:3000/learning`

Visualizza:
- Total Analyses
- Win Rate
- Best Performing Model
- Confidence Calibration
- Export Training Data (button)

### Console Logs
Ogni outcome produce log dettagliati:
```
🎓 Learning: BTC/EUR prediction → WIN (+4.25%)
  ✅ Claude: Correct (Sentiment: 75)
  ❌ GPT-4: Wrong (Sentiment: 45)
  ✅ Gemini: Correct (Sentiment: 80)
  ⚠️ High confidence but wrong prediction - Review market conditions
💡 Insight Extracted: {...}
```

### API Programmatico
```typescript
import { LearningLogger } from '@/lib/learning/logger'

// Get stats
const stats = LearningLogger.getStats('user-1')
console.log(`Win Rate: ${stats.winRate * 100}%`)

// Export data
const trainingData = LearningLogger.exportTrainingData('user-1')
fs.writeFileSync('training.json', JSON.stringify(trainingData))
```

---

## 🔮 Future Enhancements

### 1. Drift Detection
Rileva quando il mercato cambia regime:
```
If accuracy drops significantly:
  → Market regime changed
  → Retrain models or pause trading
```

### 2. A/B Testing
Test simultaneo di strategie:
```
Strategy A: Current thresholds
Strategy B: More conservative
→ After 100 trades each, choose winner
```

### 3. Ensemble LearningCombina modelli pesando per accuracy:
```
prediction = (
  claude.prediction * claude.accuracy +
  gpt4.prediction * gpt4.accuracy +
  gemini.prediction * gemini.accuracy
) / total_accuracy
```

### 4. Reinforcement Learning
Impara sequenze ottimali di azioni:
```
State: [market_conditions, open_positions]
Action: [TRADE, HOLD, CLOSE]
Reward: P&L
→ Learn optimal policy
```

---

## ✅ Checklist Implementazione

- [x] Database schema created
- [x] LearningLogger service
- [x] Integration in orchestrator
- [x] Outcome tracking
- [x] Model performance tracking
- [x] Pattern recognition foundation
- [x] Training data export
- [x] Dashboard UI
- [ ] Supabase persistence (future)
- [ ] Real-time insights generation (future)
- [ ] Auto-parameter adjustment (future)

---

## 💾 Dati Salvati (Current In-Memory)

Attualmente i dati sono salvati in memoria (array). Dopo ricarica perduti.

**Per Production**: Uncomment Supabase calls in `LearningLogger`:
```typescript
// Change this:
this.sessions.push(session);

// To this:
await supabase.from('analysis_sessions').insert(session);
```

---

## 🎓 Esempio Completo

### Ciclo di Vita di un'Analisi

1. **User clicks BTC/EUR** → Start analysis
2. **System gathers** → Technical + Macro + News
3. **3 AI models** → Analyze and predict
4. **Consensus** → STRONG_BUY, 85% confidence
5. **Logged** → Full context saved
6. **User executes** → Trade opened
7. **Session updated** → Linked to trade
8. **Price hits TP** → Auto-close, +4.5% profit
9. **Outcome recorded** → WIN
10. **System learns** → Updates model stats
11. **Insight generated** → "High VIX + Positive news = WIN pattern"

---

**Il Learning System trasforma ogni trade in una lezione! 🧠**
