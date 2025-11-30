-- =============================================
-- USERS & PROFILES
-- =============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Trading config
  initial_capital DECIMAL(12,2) DEFAULT 1000.00,
  max_position_pct DECIMAL(5,4) DEFAULT 0.10,
  stop_loss_pct DECIMAL(5,4) DEFAULT 0.02,
  take_profit_pct DECIMAL(5,4) DEFAULT 0.04,
  max_daily_loss_pct DECIMAL(5,4) DEFAULT 0.05,
  max_drawdown_pct DECIMAL(5,4) DEFAULT 0.15,
  max_concurrent_positions INT DEFAULT 3,
  
  -- AI config
  min_confidence DECIMAL(5,4) DEFAULT 0.70,
  min_consensus DECIMAL(5,4) DEFAULT 0.65,
  ai_daily_budget DECIMAL(8,2) DEFAULT 10.00,
  
  -- Preferences
  paper_trading BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PORTFOLIO & BALANCES
-- =============================================

CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  balance DECIMAL(14,2) DEFAULT 1000.00,
  equity DECIMAL(14,2) DEFAULT 1000.00,
  realized_pnl DECIMAL(14,2) DEFAULT 0.00,
  unrealized_pnl DECIMAL(14,2) DEFAULT 0.00,
  total_fees DECIMAL(10,2) DEFAULT 0.00,
  ai_costs DECIMAL(10,2) DEFAULT 0.00,
  
  peak_equity DECIMAL(14,2) DEFAULT 1000.00,
  max_drawdown DECIMAL(5,4) DEFAULT 0.00,
  current_drawdown DECIMAL(5,4) DEFAULT 0.00,
  
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  losing_trades INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily snapshots for equity curve
CREATE TABLE portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  equity DECIMAL(14,2) NOT NULL,
  balance DECIMAL(14,2) NOT NULL,
  pnl DECIMAL(14,2) NOT NULL,
  trades_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- =============================================
-- TRADING
-- =============================================

-- Trading pairs
CREATE TABLE trading_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL, -- e.g., 'BTC/EUR'
  base_asset TEXT NOT NULL,    -- e.g., 'BTC'
  quote_asset TEXT NOT NULL,   -- e.g., 'EUR'
  name TEXT NOT NULL,          -- e.g., 'Bitcoin'
  coingecko_id TEXT,           -- e.g., 'bitcoin'
  decimals INT DEFAULT 2,
  min_trade_size DECIMAL(18,8) DEFAULT 0.0001,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pairs
INSERT INTO trading_pairs (symbol, base_asset, quote_asset, name, coingecko_id, decimals) VALUES
  ('BTC/EUR', 'BTC', 'EUR', 'Bitcoin', 'bitcoin', 2),
  ('ETH/EUR', 'ETH', 'EUR', 'Ethereum', 'ethereum', 2),
  ('ETH/BTC', 'ETH', 'BTC', 'ETH/BTC Ratio', NULL, 5),
  ('SOL/EUR', 'SOL', 'EUR', 'Solana', 'solana', 2),
  ('LINK/EUR', 'LINK', 'EUR', 'Chainlink', 'chainlink', 2),
  ('ARB/EUR', 'ARB', 'EUR', 'Arbitrum', 'arbitrum', 4);

-- Trades
CREATE TYPE trade_direction AS ENUM ('LONG', 'SHORT');
CREATE TYPE trade_status AS ENUM ('PENDING', 'OPEN', 'CLOSED', 'CANCELLED');
CREATE TYPE close_reason AS ENUM ('STOP_LOSS', 'TAKE_PROFIT', 'MANUAL', 'TRAILING_STOP', 'LIQUIDATION');

CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pair_id UUID REFERENCES trading_pairs(id),
  
  direction trade_direction NOT NULL,
  status trade_status DEFAULT 'PENDING',
  
  entry_price DECIMAL(18,8) NOT NULL,
  exit_price DECIMAL(18,8),
  current_price DECIMAL(18,8),
  
  stop_loss DECIMAL(18,8) NOT NULL,
  take_profit DECIMAL(18,8) NOT NULL,
  trailing_stop DECIMAL(18,8),
  
  quantity DECIMAL(18,8) NOT NULL,
  position_value DECIMAL(14,2) NOT NULL,
  
  pnl DECIMAL(14,2) DEFAULT 0,
  pnl_percent DECIMAL(8,4) DEFAULT 0,
  fees DECIMAL(10,4) DEFAULT 0,
  
  close_reason close_reason,
  
  -- AI info
  signal_id UUID,
  signal_strength TEXT,
  ai_confidence DECIMAL(5,4),
  ai_consensus DECIMAL(5,4),
  ai_reasoning TEXT,
  
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_entry_time ON trades(entry_time DESC);

-- =============================================
-- AI ANALYSIS & SIGNALS
-- =============================================

CREATE TYPE signal_strength AS ENUM ('STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL');

CREATE TABLE ai_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pair_id UUID REFERENCES trading_pairs(id),
  
  strength signal_strength NOT NULL,
  direction trade_direction,
  
  sentiment DECIMAL(5,2) NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  consensus DECIMAL(5,4) NOT NULL,
  
  entry_price DECIMAL(18,8),
  stop_loss DECIMAL(18,8),
  take_profit DECIMAL(18,8),
  
  reasoning TEXT,
  
  -- Was this signal acted upon?
  was_traded BOOLEAN DEFAULT FALSE,
  trade_id UUID REFERENCES trades(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual AI model analyses
CREATE TABLE ai_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES ai_signals(id) ON DELETE CASCADE,
  
  model_name TEXT NOT NULL, -- 'claude', 'gpt4', 'gemini'
  
  sentiment DECIMAL(5,2) NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  reasoning TEXT,
  
  tokens_used INT,
  cost DECIMAL(8,4),
  response_time_ms INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI costs tracking
CREATE TABLE ai_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  model_name TEXT NOT NULL,
  
  calls_count INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  
  UNIQUE(user_id, date, model_name)
);

-- =============================================
-- ACTIVITY LOG
-- =============================================

CREATE TYPE log_type AS ENUM ('SYSTEM', 'TRADE', 'AI', 'SIGNAL', 'WIN', 'LOSS', 'ERROR', 'INFO');

CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  type log_type NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_created ON activity_logs(created_at DESC);

-- =============================================
-- LEARNING & PERFORMANCE
-- =============================================

-- AI model performance tracking
CREATE TABLE ai_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  model_name TEXT NOT NULL,
  pair_symbol TEXT NOT NULL,
  
  total_signals INT DEFAULT 0,
  accurate_signals INT DEFAULT 0,
  accuracy DECIMAL(5,4) DEFAULT 0,
  
  avg_response_time_ms INT,
  total_cost DECIMAL(10,4) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, model_name, pair_symbol)
);

-- Algorithm versions for self-learning
CREATE TABLE algorithm_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  version TEXT NOT NULL, -- '1.0.0'
  
  changes JSONB, -- Array of changes made
  performance_snapshot JSONB,
  
  win_rate DECIMAL(5,4),
  profit_factor DECIMAL(8,4),
  sharpe_ratio DECIMAL(8,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_versions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own portfolio" ON portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own snapshots" ON portfolio_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own trades" ON trades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own signals" ON ai_signals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own analyses" ON ai_analyses FOR SELECT USING (
  signal_id IN (SELECT id FROM ai_signals WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own costs" ON ai_costs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own logs" ON activity_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own performance" ON ai_performance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own versions" ON algorithm_versions FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  INSERT INTO portfolios (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update portfolio stats on trade close
CREATE OR REPLACE FUNCTION update_portfolio_on_trade_close()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CLOSED' AND OLD.status = 'OPEN' THEN
    UPDATE portfolios
    SET 
      balance = balance + NEW.position_value + NEW.pnl - NEW.fees,
      realized_pnl = realized_pnl + NEW.pnl,
      total_fees = total_fees + NEW.fees,
      total_trades = total_trades + 1,
      winning_trades = winning_trades + CASE WHEN NEW.pnl > 0 THEN 1 ELSE 0 END,
      losing_trades = losing_trades + CASE WHEN NEW.pnl < 0 THEN 1 ELSE 0 END
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_trade_closed
  AFTER UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_portfolio_on_trade_close();
