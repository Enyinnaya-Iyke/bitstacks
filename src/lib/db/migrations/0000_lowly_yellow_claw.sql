
-- Tables
CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamp,
    "refresh_token_expires_at" timestamp,
    "scope" text,
    "password" text,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitation" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL,
    "email" text NOT NULL,
    "role" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "expires_at" timestamp NOT NULL,
    "inviter_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "jwks" (
    "id" text PRIMARY KEY NOT NULL,
    "public_key" text NOT NULL,
    "private_key" text NOT NULL,
    "created_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "member" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL,
    "user_id" text NOT NULL,
    "role" text DEFAULT 'member' NOT NULL,
    "created_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "organization" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "slug" text,
    "logo" text,
    "created_at" timestamp NOT NULL,
    "metadata" text,
    "contract_address" text NOT NULL,
    "public" boolean DEFAULT true NOT NULL,
    CONSTRAINT "organization_slug_unique" UNIQUE("slug"),
    CONSTRAINT "organization_contract_address_unique" UNIQUE("contract_address")
);

CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" timestamp NOT NULL,
    "token" text NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL,
    "active_organization_id" text,
    CONSTRAINT "session_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "email_verified" boolean NOT NULL,
    "image" text,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp,
    "updated_at" timestamp
);

CREATE TABLE IF NOT EXISTS "story" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "org_id" text NOT NULL,
    "creator_id" text NOT NULL,
    "xp_reward" integer NOT NULL,
    "title" varchar(200) NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_xp_totals" (
    "user_id" text PRIMARY KEY NOT NULL,
    "total_xp" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "xp_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" text NOT NULL,
    "story_id" uuid NOT NULL,
    "xp" integer NOT NULL,
    "earned_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign keys
DO $$ BEGIN
    ALTER TABLE "account"
    ADD CONSTRAINT "account_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "invitation"
    ADD CONSTRAINT "invitation_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "invitation"
    ADD CONSTRAINT "invitation_inviter_id_user_id_fk"
    FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "member"
    ADD CONSTRAINT "member_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "member"
    ADD CONSTRAINT "member_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "session"
    ADD CONSTRAINT "session_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "story"
    ADD CONSTRAINT "story_org_id_organization_id_fk"
    FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "story"
    ADD CONSTRAINT "story_creator_id_user_id_fk"
    FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "user_xp_totals"
    ADD CONSTRAINT "user_xp_totals_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "xp_logs"
    ADD CONSTRAINT "xp_logs_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "xp_logs"
    ADD CONSTRAINT "xp_logs_story_id_story_id_fk"
    FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index
DO $$ BEGIN
    CREATE UNIQUE INDEX "unique_xp_per_story" ON "xp_logs" USING btree ("user_id","story_id");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;
