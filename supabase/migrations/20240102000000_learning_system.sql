-- =============================================
-- AI LEARNING & KNOWLEDGE BASE
-- =============================================

-- Analysis Sessions: Ogni analisi completa
CREATE TABLE analysis_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Context
    symbol TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Market Data Snapshot
    price DECIMAL(18,8) NOT NULL,
    volume DECIMAL(18,2),
    market_cap DECIMAL(18,2),
    
    -- Technical Indicators Snapshot
    technical_data JSONB NOT NULL, -- RSI, MACD, EMAs, BB, etc.
    
    -- Macro Environment Snapshot
    macro_data JSONB NOT NULL, -- Interest rates, DXY, VIX, liquidity
    
    -- News Sentiment Snapshot
    news_data JSONB NOT NULL, -- Sentiment score, topics, sources
    
    -- Complete Market Report (text)
    market_report TEXT NOT NULL,
    
    -- AI Responses
    ai_analyses JSONB NOT NULL, -- Array of {model, sentiment, confidence, reasoning}
    
    -- Final Signal
    signal_strength TEXT, -- STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
    signal_direction TEXT, -- LONG, SHORT, null
    consensus_sentiment DECIMAL(5,2),
    consensus_confidence DECIMAL(5,4),
    
    -- Execution
    was_executed BOOLEAN DEFAULT FALSE,
    trade_id BIGINT REFERENCES trades(id),
    
    -- Learning Outcome (filled after trade closes)
    actual_outcome TEXT, -- 'WIN', 'LOSS', 'BREAK_EVEN', 'NOT_TRADED'
    actual_pnl DECIMAL(14,2),
    actual_pnl_percent DECIMAL(8,4),
    outcome_recorded_at TIMESTAMPTZ,
    
    -- Performance tracking
    prediction_accuracy DECIMAL(5,4), -- How accurate was the prediction?
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_sessions_symbol ON analysis_sessions(symbol);
CREATE INDEX idx_analysis_sessions_timestamp ON analysis_sessions(timestamp DESC);
CREATE INDEX idx_analysis_sessions_outcome ON analysis_sessions(actual_outcome);
CREATE INDEX idx_analysis_sessions_user ON analysis_sessions(user_id);

-- Model Performance Tracking (aggregated)
CREATE TABLE ai_model_learning (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    model_name TEXT NOT NULL, -- 'claude', 'gpt4', 'gemini'
    symbol TEXT NOT NULL,
    
    -- Aggregated stats
    total_predictions INT DEFAULT 0,
    correct_predictions INT DEFAULT 0,
    accuracy DECIMAL(5,4) DEFAULT 0,
    
    -- Sentiment calibration
    avg_sentiment_when_win DECIMAL(5,2),
    avg_sentiment_when_loss DECIMAL(5,2),
    avg_confidence_when_win DECIMAL(5,4),
    avg_confidence_when_loss DECIMAL(5,4),
    
    -- Bias detection
    bullish_bias DECIMAL(5,4), -- Tendency to predict LONG
    overconfidence DECIMAL(5,4), -- Confidence vs actual accuracy gap
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, model_name, symbol)
);

-- Pattern Recognition: Market conditions → outcomes
CREATE TABLE market_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    pattern_name TEXT NOT NULL, -- e.g., "High RSI + Positive News + Low VIX"
    pattern_signature JSONB NOT NULL, -- Condition definitions
    
    -- Occurrences
    times_seen INT DEFAULT 0,
    times_traded INT DEFAULT 0,
    
    -- Performance
    win_rate DECIMAL(5,4),
    avg_return DECIMAL(8,4),
    
    -- Context where it works best
    best_symbols TEXT[], -- Works best on which assets
    best_timeframes TEXT[], -- Works best when
    
    confidence_score DECIMAL(5,4), -- How confident are we in this pattern
    
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Insights: AI-generated insights from past data
CREATE TABLE learning_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    insight_type TEXT NOT NULL, -- 'MARKET_CONDITION', 'MODEL_BIAS', 'PATTERN', 'RISK_FACTOR'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Supporting data
    supporting_sessions UUID[], -- Reference to analysis_sessions
    statistical_significance DECIMAL(5,4),
    
    -- Actionability
    is_actionable BOOLEAN DEFAULT FALSE,
    suggested_action TEXT, -- e.g., "Reduce position size when VIX > 25"
    
    -- Review
    reviewed_by_user BOOLEAN DEFAULT FALSE,
    implemented BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions" ON analysis_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON analysis_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON analysis_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users manage own learning" ON ai_model_learning FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own patterns" ON market_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own insights" ON learning_insights FOR ALL USING (auth.uid() = user_id);

-- Trigger to update model learning stats when outcome is recorded
CREATE OR REPLACE FUNCTION update_model_learning_stats()
RETURNS TRIGGER AS $$
DECLARE
    analysis_record RECORD;
    model_record RECORD;
BEGIN
    IF NEW.actual_outcome IS NOT NULL AND OLD.actual_outcome IS NULL THEN
        -- Outcome was just recorded
        
        -- Loop through each AI model's analysis
        FOR model_record IN 
            SELECT * FROM jsonb_array_elements(NEW.ai_analyses) AS model
        LOOP
            -- Determine if prediction was correct
            DECLARE
                was_correct BOOLEAN;
                model_sentiment DECIMAL;
                model_confidence DECIMAL;
            BEGIN
                model_sentiment := (model_record.model->>'sentiment')::DECIMAL;
                model_confidence := (model_record.model->>'confidence')::DECIMAL;
                
                -- Simple correctness check: bullish sentiment → win, bearish → loss
                was_correct := (
                    (model_sentiment > 50 AND NEW.actual_outcome = 'WIN') OR
                    (model_sentiment < 50 AND NEW.actual_outcome = 'LOSS')
                );
                
                -- Update or insert model learning stats
                INSERT INTO ai_model_learning (
                    user_id, model_name, symbol,
                    total_predictions, correct_predictions,
                    avg_sentiment_when_win, avg_sentiment_when_loss,
                    avg_confidence_when_win, avg_confidence_when_loss
                )
                VALUES (
                    NEW.user_id,
                    model_record.model->>'model',
                    NEW.symbol,
                    1,
                    CASE WHEN was_correct THEN 1 ELSE 0 END,
                    CASE WHEN NEW.actual_outcome = 'WIN' THEN model_sentiment ELSE NULL END,
                    CASE WHEN NEW.actual_outcome = 'LOSS' THEN model_sentiment ELSE NULL END,
                    CASE WHEN NEW.actual_outcome = 'WIN' THEN model_confidence ELSE NULL END,
                    CASE WHEN NEW.actual_outcome = 'LOSS' THEN model_confidence ELSE NULL END
                )
                ON CONFLICT (user_id, model_name, symbol) DO UPDATE SET
                    total_predictions = ai_model_learning.total_predictions + 1,
                    correct_predictions = ai_model_learning.correct_predictions + CASE WHEN was_correct THEN 1 ELSE 0 END,
                    accuracy = (ai_model_learning.correct_predictions + CASE WHEN was_correct THEN 1 ELSE 0 END)::DECIMAL / 
                               (ai_model_learning.total_predictions + 1),
                    last_updated = NOW();
            END;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_outcome_recorded
    AFTER UPDATE ON analysis_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_model_learning_stats();
