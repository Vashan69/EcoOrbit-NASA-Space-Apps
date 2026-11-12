-- VLZO Platform Database Schema
-- Complete database structure for blockchain/crypto platform

-- =====================================================
-- USER MANAGEMENT & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    country_code VARCHAR(3),
    kyc_status ENUM('pending', 'verified', 'rejected', 'not_started') DEFAULT 'not_started',
    kyc_level INT DEFAULT 0,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'suspended', 'banned', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_kyc_status (kyc_status)
);

CREATE TABLE user_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    date_of_birth DATE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    occupation VARCHAR(100),
    income_range VARCHAR(50),
    investment_experience ENUM('beginner', 'intermediate', 'advanced', 'professional'),
    risk_tolerance ENUM('low', 'medium', 'high'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- BLOCKCHAIN & WALLET MANAGEMENT
-- =====================================================

CREATE TABLE wallets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wallet_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    wallet_type ENUM('main', 'trading', 'staking', 'rewards') DEFAULT 'main',
    blockchain_network VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    public_key TEXT NOT NULL,
    balance_cache DECIMAL(36, 18) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_wallet_type (user_id, wallet_type, blockchain_network),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_user_wallet (user_id, wallet_type)
);

CREATE TABLE tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(255),
    blockchain_network VARCHAR(50) NOT NULL,
    decimals INT DEFAULT 18,
    total_supply DECIMAL(36, 18),
    circulating_supply DECIMAL(36, 18),
    token_type ENUM('native', 'erc20', 'bep20', 'trc20', 'governance', 'utility') DEFAULT 'erc20',
    is_active BOOLEAN DEFAULT TRUE,
    logo_url VARCHAR(500),
    description TEXT,
    website VARCHAR(255),
    whitepaper_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_token_network (symbol, blockchain_network),
    INDEX idx_symbol (symbol),
    INDEX idx_contract_address (contract_address)
);

-- =====================================================
-- VLZO TOKEN SPECIFIC TABLES
-- =====================================================

CREATE TABLE vlzo_token_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    total_supply DECIMAL(36, 18) NOT NULL,
    circulating_supply DECIMAL(36, 18) NOT NULL,
    burned_tokens DECIMAL(36, 18) DEFAULT 0,
    staked_tokens DECIMAL(36, 18) DEFAULT 0,
    locked_tokens DECIMAL(36, 18) DEFAULT 0,
    holders_count BIGINT DEFAULT 0,
    transactions_count BIGINT DEFAULT 0,
    current_price_usd DECIMAL(20, 8),
    market_cap_usd DECIMAL(30, 2),
    volume_24h_usd DECIMAL(30, 2),
    price_change_24h DECIMAL(10, 4),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recorded_at (recorded_at)
);

CREATE TABLE tokenomics_distribution (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(100) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    token_amount DECIMAL(36, 18) NOT NULL,
    vesting_period_months INT DEFAULT 0,
    cliff_period_months INT DEFAULT 0,
    release_schedule TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    unlock_date TIMESTAMP NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
);

-- =====================================================
-- WALLET BALANCES & TRANSACTIONS
-- =====================================================

CREATE TABLE wallet_balances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    wallet_id BIGINT NOT NULL,
    token_id BIGINT NOT NULL,
    balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    locked_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    staked_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wallet_token (wallet_id, token_id),
    INDEX idx_wallet_balance (wallet_id, balance),
    INDEX idx_token_balance (token_id, balance)
);

CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    blockchain_hash VARCHAR(255) UNIQUE,
    user_id BIGINT NOT NULL,
    from_wallet_id BIGINT,
    to_wallet_id BIGINT,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    token_id BIGINT NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    fee DECIMAL(36, 18) DEFAULT 0,
    transaction_type ENUM('deposit', 'withdrawal', 'transfer', 'trade', 'stake', 'unstake', 'reward', 'burn', 'mint') NOT NULL,
    status ENUM('pending', 'confirmed', 'failed', 'cancelled') DEFAULT 'pending',
    confirmations INT DEFAULT 0,
    required_confirmations INT DEFAULT 12,
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    block_number BIGINT,
    block_timestamp TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (to_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    INDEX idx_user_transactions (user_id, created_at DESC),
    INDEX idx_blockchain_hash (blockchain_hash),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_block_number (block_number)
);

-- =====================================================
-- DECENTRALIZED EXCHANGE (DEX)
-- =====================================================

CREATE TABLE trading_pairs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pair_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    base_token_id BIGINT NOT NULL,
    quote_token_id BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL, -- e.g., VLZO/USDT
    is_active BOOLEAN DEFAULT TRUE,
    min_trade_amount DECIMAL(36, 18) DEFAULT 0,
    max_trade_amount DECIMAL(36, 18),
    price_precision INT DEFAULT 8,
    quantity_precision INT DEFAULT 8,
    maker_fee DECIMAL(5, 4) DEFAULT 0.001,
    taker_fee DECIMAL(5, 4) DEFAULT 0.001,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (base_token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    FOREIGN KEY (quote_token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    UNIQUE KEY unique_trading_pair (base_token_id, quote_token_id),
    INDEX idx_symbol (symbol),
    INDEX idx_active_pairs (is_active)
);

CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    trading_pair_id BIGINT NOT NULL,
    order_type ENUM('market', 'limit', 'stop_loss', 'take_profit') NOT NULL,
    side ENUM('buy', 'sell') NOT NULL,
    quantity DECIMAL(36, 18) NOT NULL,
    price DECIMAL(36, 18),
    stop_price DECIMAL(36, 18),
    filled_quantity DECIMAL(36, 18) DEFAULT 0,
    remaining_quantity DECIMAL(36, 18) NOT NULL,
    average_fill_price DECIMAL(36, 18),
    status ENUM('pending', 'partial', 'filled', 'cancelled', 'expired') DEFAULT 'pending',
    time_in_force ENUM('GTC', 'IOC', 'FOK') DEFAULT 'GTC',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trading_pair_id) REFERENCES trading_pairs(id) ON DELETE CASCADE,
    INDEX idx_user_orders (user_id, created_at DESC),
    INDEX idx_trading_pair_orders (trading_pair_id, status),
    INDEX idx_status_side (status, side),
    INDEX idx_price_quantity (price, quantity)
);

CREATE TABLE trades (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trade_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    trading_pair_id BIGINT NOT NULL,
    buyer_order_id BIGINT NOT NULL,
    seller_order_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    quantity DECIMAL(36, 18) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    total_value DECIMAL(36, 18) NOT NULL,
    buyer_fee DECIMAL(36, 18) NOT NULL,
    seller_fee DECIMAL(36, 18) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trading_pair_id) REFERENCES trading_pairs(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_trading_pair_trades (trading_pair_id, executed_at DESC),
    INDEX idx_buyer_trades (buyer_id, executed_at DESC),
    INDEX idx_seller_trades (seller_id, executed_at DESC),
    INDEX idx_executed_at (executed_at)
);

-- =====================================================
-- STAKING & REWARDS SYSTEM
-- =====================================================

CREATE TABLE staking_pools (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pool_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    token_id BIGINT NOT NULL,
    reward_token_id BIGINT NOT NULL,
    apy_percentage DECIMAL(8, 4) NOT NULL,
    min_stake_amount DECIMAL(36, 18) NOT NULL,
    max_stake_amount DECIMAL(36, 18),
    lock_period_days INT NOT NULL,
    total_staked DECIMAL(36, 18) DEFAULT 0,
    total_rewards_distributed DECIMAL(36, 18) DEFAULT 0,
    pool_capacity DECIMAL(36, 18),
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    INDEX idx_active_pools (is_active, end_date),
    INDEX idx_token_pools (token_id)
);

CREATE TABLE stakes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stake_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    staking_pool_id BIGINT NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    rewards_earned DECIMAL(36, 18) DEFAULT 0,
    rewards_claimed DECIMAL(36, 18) DEFAULT 0,
    stake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlock_date TIMESTAMP NOT NULL,
    status ENUM('active', 'unlocked', 'withdrawn') DEFAULT 'active',
    auto_compound BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (staking_pool_id) REFERENCES staking_pools(id) ON DELETE CASCADE,
    INDEX idx_user_stakes (user_id, status),
    INDEX idx_pool_stakes (staking_pool_id, status),
    INDEX idx_unlock_date (unlock_date)
);

-- =====================================================
-- GOVERNANCE & VOTING
-- =====================================================

CREATE TABLE governance_proposals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    proposal_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    proposer_id BIGINT NOT NULL,
    proposal_type ENUM('parameter_change', 'treasury', 'protocol_upgrade', 'general') NOT NULL,
    voting_power_required DECIMAL(36, 18) NOT NULL,
    quorum_required DECIMAL(36, 18) NOT NULL,
    voting_start_date TIMESTAMP NOT NULL,
    voting_end_date TIMESTAMP NOT NULL,
    execution_date TIMESTAMP,
    status ENUM('pending', 'active', 'passed', 'rejected', 'executed', 'cancelled') DEFAULT 'pending',
    yes_votes DECIMAL(36, 18) DEFAULT 0,
    no_votes DECIMAL(36, 18) DEFAULT 0,
    abstain_votes DECIMAL(36, 18) DEFAULT 0,
    total_votes DECIMAL(36, 18) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status_dates (status, voting_start_date, voting_end_date),
    INDEX idx_proposer (proposer_id)
);

CREATE TABLE votes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vote_id VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    proposal_id BIGINT NOT NULL,
    voter_id BIGINT NOT NULL,
    vote_choice ENUM('yes', 'no', 'abstain') NOT NULL,
    voting_power DECIMAL(36, 18) NOT NULL,
    vote_weight DECIMAL(36, 18) NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES governance_proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (proposal_id, voter_id),
    INDEX idx_proposal_votes (proposal_id, vote_choice),
    INDEX idx_voter_votes (voter_id, voted_at DESC)
);

-- =====================================================
-- ANALYTICS & REPORTING
-- =====================================================

CREATE TABLE price_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token_id BIGINT NOT NULL,
    trading_pair_id BIGINT,
    price_usd DECIMAL(20, 8) NOT NULL,
    volume_24h DECIMAL(30, 2) DEFAULT 0,
    market_cap DECIMAL(30, 2) DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    FOREIGN KEY (trading_pair_id) REFERENCES trading_pairs(id) ON DELETE SET NULL,
    INDEX idx_token_timestamp (token_id, timestamp),
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE platform_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    total_users BIGINT DEFAULT 0,
    active_users_24h BIGINT DEFAULT 0,
    active_users_30d BIGINT DEFAULT 0,
    total_trading_volume_usd DECIMAL(30, 2) DEFAULT 0,
    trading_volume_24h_usd DECIMAL(30, 2) DEFAULT 0,
    total_value_locked DECIMAL(30, 2) DEFAULT 0,
    total_fees_collected DECIMAL(30, 2) DEFAULT 0,
    total_transactions BIGINT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recorded_at (recorded_at)
);

-- =====================================================
-- SECURITY & AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at),
    INDEX idx_severity (severity),
    INDEX idx_resource (resource_type, resource_id)
);

CREATE TABLE security_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(100) NOT NULL,
    user_id BIGINT,
    ip_address VARCHAR(45),
    description TEXT,
    risk_score INT DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_user_events (user_id, created_at DESC),
    INDEX idx_risk_score (risk_score DESC),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- SYSTEM CONFIGURATION
-- =====================================================

CREATE TABLE system_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type ENUM('string', 'integer', 'float', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- =====================================================
-- INSERT INITIAL DATA
-- =====================================================

-- Insert VLZO Token
INSERT INTO tokens (symbol, name, blockchain_network, decimals, total_supply, circulating_supply, token_type, description) VALUES
('VLZO', 'VLZO Token', 'Ethereum', 18, 1000000000.000000000000000000, 200000000.000000000000000000, 'utility', 'VLZO platform utility token for governance and rewards');

-- Insert initial tokenomics distribution
INSERT INTO tokenomics_distribution (category, percentage, token_amount, vesting_period_months, description) VALUES
('Public Sale', 20.00, 200000000.000000000000000000, 0, 'Tokens available for public purchase'),
('Team', 15.00, 150000000.000000000000000000, 48, 'Team allocation with 4-year vesting'),
('Ecosystem', 25.00, 250000000.000000000000000000, 24, 'Ecosystem development and partnerships'),
('Staking Rewards', 20.00, 200000000.000000000000000000, 0, 'Staking and yield farming rewards'),
('Treasury', 10.00, 100000000.000000000000000000, 0, 'DAO treasury for governance decisions'),
('Advisors', 5.00, 50000000.000000000000000000, 24, 'Advisor allocation with 2-year vesting'),
('Liquidity', 5.00, 50000000.000000000000000000, 0, 'DEX liquidity provision');

-- Insert system configuration
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('platform_fee_percentage', '0.25', 'float', 'Platform trading fee percentage'),
('min_withdrawal_amount', '10.0', 'float', 'Minimum withdrawal amount in USD'),
('max_withdrawal_daily', '50000.0', 'float', 'Maximum daily withdrawal limit in USD'),
('staking_min_amount', '100.0', 'float', 'Minimum staking amount'),
('governance_proposal_threshold', '10000.0', 'float', 'Minimum tokens required to create proposal'),
('kyc_required_limit', '1000.0', 'float', 'KYC required for transactions above this USD amount');

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_user_wallet_token ON wallet_balances(wallet_id, token_id, balance DESC);
CREATE INDEX idx_trading_volume ON trades(trading_pair_id, executed_at, total_value);
CREATE INDEX idx_staking_rewards ON stakes(user_id, staking_pool_id, rewards_earned);
CREATE INDEX idx_token_metrics_time ON vlzo_token_metrics(recorded_at DESC);
CREATE INDEX idx_price_history_time ON price_history(token_id, timestamp DESC);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- User portfolio view
CREATE VIEW user_portfolio AS
SELECT 
    u.id as user_id,
    u.username,
    t.symbol,
    t.name as token_name,
    wb.balance,
    wb.staked_balance,
    wb.locked_balance,
    (wb.balance + wb.staked_balance + wb.locked_balance) as total_balance,
    ph.price_usd,
    ((wb.balance + wb.staked_balance + wb.locked_balance) * ph.price_usd) as portfolio_value_usd
FROM users u
JOIN wallets w ON u.id = w.user_id
JOIN wallet_balances wb ON w.id = wb.wallet_id
JOIN tokens t ON wb.token_id = t.id
LEFT JOIN price_history ph ON t.id = ph.token_id
WHERE ph.timestamp = (
    SELECT MAX(timestamp) FROM price_history WHERE token_id = t.id
);

-- Trading statistics view
CREATE VIEW trading_stats AS
SELECT 
    tp.symbol as trading_pair,
    COUNT(tr.id) as total_trades,
    SUM(tr.total_value) as total_volume,
    AVG(tr.price) as avg_price,
    MIN(tr.price) as min_price,
    MAX(tr.price) as max_price,
    SUM(tr.buyer_fee + tr.seller_fee) as total_fees,
    DATE(tr.executed_at) as trade_date
FROM trading_pairs tp
LEFT JOIN trades tr ON tp.id = tr.trading_pair_id
GROUP BY tp.id, DATE(tr.executed_at);

-- Staking overview
CREATE VIEW staking_overview AS
SELECT 
    sp.name as pool_name,
    sp.apy_percentage,
    sp.total_staked,
    COUNT(s.id) as total_stakers,
    SUM(s.rewards_earned) as total_rewards_earned,
    SUM(s.rewards_claimed) as total_rewards_claimed
FROM staking_pools sp
LEFT JOIN stakes s ON sp.id = s.staking_pool_id
WHERE sp.is_active = TRUE
GROUP BY sp.id;