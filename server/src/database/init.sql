-- =====================================================
-- 职业规划日历 - 数据库初始化脚本
-- Version: 1.0.0
-- Date: 2026-03-04
-- Based on: API-CONTRACT.md
-- =====================================================

-- 初始化数据库扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建更新时间自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 1. 用户相关表
-- =====================================================

-- 1.1 用户表 (对应 API-CONTRACT.md 1.1 User)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(11) UNIQUE NOT NULL,
    nickname VARCHAR(50) DEFAULT '用户' || SUBSTRING(phone, 8, 4),
    avatar VARCHAR(500),
    school VARCHAR(100),
    major VARCHAR(100),
    grade VARCHAR(20),
    student_id VARCHAR(50),
    graduation_year INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 用户更新时间触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 1.2 学校表（基础数据）
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    province VARCHAR(50),
    city VARCHAR(50),
    level VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_level ON schools(level);
CREATE INDEX IF NOT EXISTS idx_schools_province ON schools(province);

-- 1.3 专业表（基础数据）
CREATE TABLE IF NOT EXISTS majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_majors_name ON majors(name);
CREATE INDEX IF NOT EXISTS idx_majors_category ON majors(category);

-- 1.4 用户画像表（13维度偏好）
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id),
    major_id UUID REFERENCES majors(id),
    grade VARCHAR(20),
    graduation_year INTEGER,
    city VARCHAR(50),
    name VARCHAR(50),
    student_id VARCHAR(50),
    -- 13维度偏好设置 (JSONB)
    preferences JSONB DEFAULT '{
        "locations": [],
        "selfPositioning": [],
        "developmentDirection": [],
        "industries": [],
        "platformTypes": [],
        "companyScales": [],
        "companyCulture": [],
        "leadershipStyle": [],
        "trainingPrograms": [],
        "overtimePreference": [],
        "holidayPolicy": [],
        "medicalBenefits": [],
        "maternityBenefits": []
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school ON user_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences ON user_profiles USING GIN(preferences);

-- 用户画像更新时间触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 1.5 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone, created_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- =====================================================
-- 2. 日历事件相关表
-- =====================================================

-- 2.1 招聘事件表 (对应 API-CONTRACT.md 1.2 Event)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    company_type VARCHAR(50) CHECK (company_type IN ('soe', 'foreign', 'private', 'startup', 'government')),
    position VARCHAR(200),
    description TEXT,
    location VARCHAR(500),
    event_date DATE NOT NULL,
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    deadline TIMESTAMPTZ,
    requirements TEXT[],
    benefits TEXT[],
    apply_url VARCHAR(500),
    tags TEXT[],
    source VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_company_type ON events(company_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_company ON events(company_name);

-- 事件更新时间触发器
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.2 用户关注事件表
CREATE TABLE IF NOT EXISTS user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('follow', 'remind')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id, action)
);

CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event ON user_events(event_id);

-- =====================================================
-- 3. 圆桌讨论相关表
-- =====================================================

-- 3.1 圆桌分组表 (对应 API-CONTRACT.md 1.3 RoundTable)
CREATE TABLE IF NOT EXISTS roundtables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(200),
    description TEXT,
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 120,
    max_participants INTEGER DEFAULT 6,
    status VARCHAR(20) DEFAULT 'matching' CHECK (status IN ('matching', 'ready', 'in_progress', 'completed', 'cancelled')),
    questions TEXT[],
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roundtables_status ON roundtables(status);
CREATE INDEX IF NOT EXISTS idx_roundtables_scheduled ON roundtables(scheduled_at);

-- 圆桌更新时间触发器
DROP TRIGGER IF EXISTS update_roundtables_updated_at ON roundtables;
CREATE TRIGGER update_roundtables_updated_at
    BEFORE UPDATE ON roundtables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3.2 圆桌参与者表
CREATE TABLE IF NOT EXISTS roundtable_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roundtable_id UUID NOT NULL REFERENCES roundtables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('host', 'member')),
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'matched', 'joined', 'left', 'cancelled')),
    preferences JSONB DEFAULT '{}',
    matched_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(roundtable_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_roundtable_participants_user ON roundtable_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_roundtable_participants_rt ON roundtable_participants(roundtable_id);
CREATE INDEX IF NOT EXISTS idx_roundtable_participants_status ON roundtable_participants(status);

-- 3.3 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roundtable_id UUID NOT NULL REFERENCES roundtables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_rt ON chat_messages(roundtable_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- =====================================================
-- 4. 认知图谱相关表
-- =====================================================

-- 4.1 认知边界图表 (对应 API-CONTRACT.md 1.4 CognitiveMap)
CREATE TABLE IF NOT EXISTS cognitive_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dimensions JSONB NOT NULL DEFAULT '[]',
    history JSONB DEFAULT '[]',
    roundtable_id UUID REFERENCES roundtables(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cognitive_maps_user ON cognitive_maps(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_cognitive_maps_dimensions ON cognitive_maps USING GIN(dimensions);

-- =====================================================
-- 5. 通知系统相关表
-- =====================================================

-- 5.1 通知消息表 (对应 API-CONTRACT.md 1.5 Notification)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('event_reminder', 'round_table_invite', 'round_table_start', 'system')),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- 6. 初始化基础数据
-- =====================================================

-- 示例：插入部分学校数据（实际应从教育部数据导入）
-- INSERT INTO schools (name, province, city, level) VALUES
-- ('清华大学', '北京市', '北京市', '985'),
-- ('北京大学', '北京市', '北京市', '985'),
-- ('复旦大学', '上海市', '上海市', '985');

-- 示例：插入部分专业数据
-- INSERT INTO majors (name, category) VALUES
-- ('计算机科学与技术', '工学'),
-- ('软件工程', '工学'),
-- ('电子信息工程', '工学');

-- =====================================================
-- 7. 视图定义（可选）
-- =====================================================

-- 用户完整信息视图
CREATE OR REPLACE VIEW v_user_full AS
SELECT
    u.id,
    u.phone,
    u.nickname,
    u.avatar,
    u.school,
    u.major,
    u.grade,
    u.student_id,
    u.graduation_year,
    u.status,
    up.preferences,
    s.name as school_name,
    m.name as major_name,
    m.category as major_category
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN schools s ON up.school_id = s.id
LEFT JOIN majors m ON up.major_id = m.id;

-- 圆桌完整信息视图
CREATE OR REPLACE VIEW v_roundtable_full AS
SELECT
    r.id,
    r.topic,
    r.description,
    r.scheduled_at,
    r.duration_minutes,
    r.max_participants,
    r.status,
    r.questions,
    r.summary,
    COUNT(rp.id) as participant_count
FROM roundtables r
LEFT JOIN roundtable_participants rp ON r.id = rp.roundtable_id AND rp.status IN ('matched', 'joined')
GROUP BY r.id;

-- =====================================================
-- 8. 函数定义
-- =====================================================

-- 获取用户未读通知数量
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id AND is_read = FALSE;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 检查圆桌是否已满
CREATE OR REPLACE FUNCTION is_roundtable_full(p_roundtable_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_count INTEGER;
    v_max_participants INTEGER;
BEGIN
    SELECT max_participants INTO v_max_participants
    FROM roundtables WHERE id = p_roundtable_id;

    SELECT COUNT(*) INTO v_current_count
    FROM roundtable_participants
    WHERE roundtable_id = p_roundtable_id AND status IN ('matched', 'joined');

    RETURN v_current_count >= v_max_participants;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 结束
-- =====================================================