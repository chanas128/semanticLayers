-- =============================================================
--  Script 2 (PostgreSQL): Semantic Layer Meta-Tables
--  שלוש טבלאות: SL_Connections + SL_SemanticLayers + SL_DataDictionary
-- =============================================================

-- =============================================================
--  SL_Connections — חיבורי DB שהמשתמש הגדיר
-- =============================================================
DROP TABLE IF EXISTS "SL_DataDictionary";
DROP TABLE IF EXISTS "SL_SemanticLayers";
DROP TABLE IF EXISTS "SL_Connections";

CREATE TABLE "SL_Connections" (
    "Id"              SERIAL          PRIMARY KEY,
    "Name"            VARCHAR(100)    NOT NULL,
    "ServerName"      VARCHAR(200)    NOT NULL,
    "DatabaseName"    VARCHAR(100)    NOT NULL,
    "AuthType"        VARCHAR(20)     NOT NULL DEFAULT 'SqlServer'
                      CHECK ("AuthType" IN ('SqlServer','Windows')),
    "Username"        VARCHAR(100)    NULL,
    "PasswordHash"    VARCHAR(500)    NULL,
    "IsActive"        BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedAt"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "LastTestedAt"    TIMESTAMP       NULL,
    "LastTestResult"  VARCHAR(500)    NULL
);

-- =============================================================
--  SL_SemanticLayers — השכבה הסמנטית עצמה (שמורה כ-JSON)
-- =============================================================
CREATE TABLE "SL_SemanticLayers" (
    "Id"              SERIAL          PRIMARY KEY,
    "ConnectionId"    INT             NOT NULL,
    "LayerJson"       TEXT            NOT NULL,
    "CreatedAt"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMP       NOT NULL DEFAULT NOW(),
    "CreatedBy"       VARCHAR(100)    NULL,
    CONSTRAINT "FK_SL_SemanticLayers_Connections"
        FOREIGN KEY ("ConnectionId") REFERENCES "SL_Connections"("Id")
);

CREATE UNIQUE INDEX "UX_SL_SemanticLayers_ConnectionId"
    ON "SL_SemanticLayers"("ConnectionId");

-- =============================================================
--  SL_DataDictionary — מילון נתונים
-- =============================================================
CREATE TABLE "SL_DataDictionary" (
    "Id"              SERIAL          PRIMARY KEY,
    "ConnectionId"    INT             NOT NULL,
    "TableName"       VARCHAR(128)    NOT NULL,
    "ColumnName"      VARCHAR(128)    NOT NULL,
    "DisplayName"     VARCHAR(200)    NULL,
    "BusinessDesc"    VARCHAR(1000)   NULL,
    "Source"          VARCHAR(20)     NOT NULL DEFAULT 'file'
                      CHECK ("Source" IN ('file','manual','ai')),
    "ImportedAt"      TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_SL_DataDictionary_Connections"
        FOREIGN KEY ("ConnectionId") REFERENCES "SL_Connections"("Id")
);

CREATE INDEX "IX_SL_DataDictionary_Connection_Table"
    ON "SL_DataDictionary"("ConnectionId", "TableName", "ColumnName");

-- =============================================================
--  Verify
-- =============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('SL_Connections','SL_SemanticLayers','SL_DataDictionary')
ORDER BY table_name;
