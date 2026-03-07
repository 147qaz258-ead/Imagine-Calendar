import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 初始化数据库迁移
 * 创建所有表结构
 *
 * Migration ID: 1709566800000
 * Date: 2026-03-04
 */
export class InitialSchema1709566800000 implements MigrationInterface {
  name = 'InitialSchema1709566800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建扩展
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

    // 创建更新时间函数
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `)

    // 1. 用户表
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" VARCHAR(11) UNIQUE NOT NULL,
        "nickname" VARCHAR(50) DEFAULT '用户' || SUBSTRING(phone, 8, 4),
        "avatar" VARCHAR(500),
        "school" VARCHAR(100),
        "major" VARCHAR(100),
        "grade" VARCHAR(20),
        "student_id" VARCHAR(50),
        "graduation_year" INTEGER,
        "status" VARCHAR(20) DEFAULT 'active',
        "last_login_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_users_phone" ON "users"("phone")`)
    await queryRunner.query(`CREATE INDEX "idx_users_created_at" ON "users"("created_at")`)

    // 用户更新触发器
    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON "users"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `)

    // 2. 学校表
    await queryRunner.query(`
      CREATE TABLE "schools" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) UNIQUE NOT NULL,
        "province" VARCHAR(50),
        "city" VARCHAR(50),
        "level" VARCHAR(20),
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_schools_name" ON "schools"("name")`)

    // 3. 专业表
    await queryRunner.query(`
      CREATE TABLE "majors" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "category" VARCHAR(50),
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_majors_name" ON "majors"("name")`)

    // 4. 用户画像表
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "school_id" UUID REFERENCES "schools"("id"),
        "major_id" UUID REFERENCES "majors"("id"),
        "grade" VARCHAR(20),
        "graduation_year" INTEGER,
        "city" VARCHAR(50),
        "name" VARCHAR(50),
        "student_id" VARCHAR(50),
        "preferences" JSONB DEFAULT '{}',
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE("user_id")
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_user_profiles_user" ON "user_profiles"("user_id")`)
    await queryRunner.query(
      `CREATE INDEX "idx_user_preferences" ON "user_profiles" USING GIN("preferences")`,
    )

    // 5. 验证码表
    await queryRunner.query(`
      CREATE TABLE "verification_codes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone" VARCHAR(11) NOT NULL,
        "code" VARCHAR(6) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "used" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await queryRunner.query(
      `CREATE INDEX "idx_verification_codes_phone" ON "verification_codes"("phone", "created_at")`,
    )

    // 6. 事件表
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(200) NOT NULL,
        "company_name" VARCHAR(200),
        "company_type" VARCHAR(50),
        "position" VARCHAR(200),
        "description" TEXT,
        "location" VARCHAR(500),
        "event_date" DATE NOT NULL,
        "start_time" VARCHAR(5),
        "end_time" VARCHAR(5),
        "deadline" TIMESTAMPTZ,
        "requirements" TEXT[],
        "benefits" TEXT[],
        "apply_url" VARCHAR(500),
        "tags" TEXT[],
        "source" VARCHAR(200),
        "status" VARCHAR(20) DEFAULT 'active',
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_events_date" ON "events"("event_date")`)
    await queryRunner.query(`CREATE INDEX "idx_events_company_type" ON "events"("company_type")`)

    // 7. 用户事件关联表
    await queryRunner.query(`
      CREATE TABLE "user_events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
        "action" VARCHAR(20) NOT NULL,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE("user_id", "event_id", "action")
      )
    `)

    // 8. 圆桌表
    await queryRunner.query(`
      CREATE TABLE "roundtables" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "topic" VARCHAR(200),
        "description" TEXT,
        "scheduled_at" TIMESTAMPTZ,
        "duration_minutes" INTEGER DEFAULT 120,
        "max_participants" INTEGER DEFAULT 6,
        "status" VARCHAR(20) DEFAULT 'matching',
        "questions" TEXT[],
        "summary" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await queryRunner.query(`CREATE INDEX "idx_roundtables_status" ON "roundtables"("status")`)

    // 9. 圆桌参与者表
    await queryRunner.query(`
      CREATE TABLE "roundtable_participants" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "roundtable_id" UUID NOT NULL REFERENCES "roundtables"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role" VARCHAR(20) DEFAULT 'member',
        "status" VARCHAR(20) DEFAULT 'applied',
        "preferences" JSONB DEFAULT '{}',
        "matched_at" TIMESTAMPTZ,
        "joined_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE("roundtable_id", "user_id")
      )
    `)

    // 10. 聊天消息表
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "roundtable_id" UUID NOT NULL REFERENCES "roundtables"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "content" TEXT NOT NULL,
        "message_type" VARCHAR(20) DEFAULT 'text',
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // 11. 认知图谱表
    await queryRunner.query(`
      CREATE TABLE "cognitive_maps" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "dimensions" JSONB NOT NULL DEFAULT '[]',
        "history" JSONB DEFAULT '[]',
        "roundtable_id" UUID REFERENCES "roundtables"("id"),
        "recorded_at" TIMESTAMPTZ DEFAULT NOW(),
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await queryRunner.query(
      `CREATE INDEX "idx_cognitive_maps_user" ON "cognitive_maps"("user_id", "recorded_at")`,
    )

    // 12. 通知表
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(200) NOT NULL,
        "content" TEXT,
        "data" JSONB,
        "is_read" BOOLEAN DEFAULT FALSE,
        "read_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user" ON "notifications"("user_id", "is_read", "created_at")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 按依赖关系逆序删除表
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "cognitive_maps"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "roundtable_participants"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "roundtables"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_events"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "events"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_codes"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "majors"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "schools"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`)

    // 删除函数
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`)
  }
}
