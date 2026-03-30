-- 外贸黑名单平台 · 数据库初始化 SQL

-- 创建黑名单主表
CREATE TABLE IF NOT EXISTS blacklist (
  id                      BIGSERIAL PRIMARY KEY,
  name                    TEXT NOT NULL,
  platform                TEXT,
  platform_id             TEXT,
  email                   TEXT NOT NULL,
  phone                   TEXT,
  address                 TEXT,
  zip_code                TEXT,
  risk                    TEXT NOT NULL CHECK (risk IN ('高', '中', '低')),
  dispute_type            TEXT,
  description             TEXT,
  
  -- 金额信息
  order_amount            DECIMAL(10,2),
  refund_amount           DECIMAL(10,2),
  partial_refund_amount   DECIMAL(10,2),
  
  -- 货物损失
  has_cargo_loss          BOOLEAN DEFAULT false,
  cargo_loss_amount       DECIMAL(10,2),
  loss_bearer             TEXT CHECK (loss_bearer IN ('自己承担', '平台承担', '部分承担')),
  
  -- 证据图片
  evidence_images         TEXT[] DEFAULT '{}',
  
  -- 关联信息
  report_count            INT DEFAULT 1,
  related_emails          TEXT[] DEFAULT '{}',
  related_phones          TEXT[] DEFAULT '{}',
  related_addresses       TEXT[] DEFAULT '{}',
  buyer_group_id          UUID DEFAULT gen_random_uuid(),
  
  -- 审核信息
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
  reporter_email          TEXT,
  reject_reason           TEXT,
  reviewed_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 基础索引
CREATE INDEX IF NOT EXISTS idx_blacklist_status ON blacklist(status);
CREATE INDEX IF NOT EXISTS idx_blacklist_email ON blacklist(email);
CREATE INDEX IF NOT EXISTS idx_blacklist_platform ON blacklist(platform);
CREATE INDEX IF NOT EXISTS idx_blacklist_risk ON blacklist(risk);
CREATE INDEX IF NOT EXISTS idx_blacklist_created ON blacklist(created_at DESC);

-- 关联查询索引
CREATE INDEX IF NOT EXISTS idx_blacklist_group ON blacklist(buyer_group_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_phone ON blacklist(phone);
CREATE INDEX IF NOT EXISTS idx_blacklist_zip ON blacklist(zip_code);
CREATE INDEX IF NOT EXISTS idx_blacklist_status_risk ON blacklist(status, risk);
CREATE INDEX IF NOT EXISTS idx_blacklist_platform_status ON blacklist(platform, status);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_blacklist_name_gin ON blacklist USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_blacklist_email_gin ON blacklist USING gin(to_tsvector('simple', email));
CREATE INDEX IF NOT EXISTS idx_blacklist_address_gin ON blacklist USING gin(to_tsvector('simple', address));

-- 开启 RLS
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- 策略
DROP POLICY IF EXISTS "Public read all" ON blacklist;
DROP POLICY IF EXISTS "Public insert pending" ON blacklist;
DROP POLICY IF EXISTS "Admin update" ON blacklist;

CREATE POLICY "Public read all" ON blacklist FOR SELECT USING (true);
CREATE POLICY "Public insert pending" ON blacklist FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Admin update" ON blacklist FOR UPDATE USING (true);

-- Storage 策略（在Supabase控制台执行）
-- 允许上传图片
-- CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidence-images');
-- 允许公开查看图片
-- CREATE POLICY "Allow public viewing" ON storage.objects FOR SELECT TO public USING (bucket_id = 'evidence-images');
