-- =============================================================
--  Script 2: Semantic Layer Meta-Tables
--  נוספים ל-DB הקיים של המערכת (HomToMadad)
--  שני טבלאות: SL_Connections + SL_SemanticLayers
-- =============================================================

-- שנה את שם ה-DB בהתאם לשם DB המערכת הקיים שלך
USE appDb;
GO

-- =============================================================
--  SL_Connections — חיבורי DB שהמשתמש הגדיר
-- =============================================================
IF OBJECT_ID('dbo.SL_Connections', 'U') IS NOT NULL
    DROP TABLE dbo.SL_Connections;
GO

CREATE TABLE dbo.SL_Connections (
    Id              INT             IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(100)   NOT NULL,          -- שם ידידותי שהמשתמש נתן
    ServerName      NVARCHAR(200)   NOT NULL,          -- שם שרת / IP
    DatabaseName    NVARCHAR(100)   NOT NULL,          -- שם מסד הנתונים
    AuthType        NVARCHAR(20)    NOT NULL DEFAULT 'SqlServer'
                    CHECK (AuthType IN ('SqlServer','Windows')),
    Username        NVARCHAR(100)   NULL,              -- NULL אם Windows Auth
    PasswordHash    NVARCHAR(500)   NULL,              -- NULL אם Windows Auth
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),
    LastTestedAt    DATETIME        NULL,
    LastTestResult  NVARCHAR(500)   NULL               -- הודעת שגיאה אחרונה / 'OK'
);
GO

-- =============================================================
--  SL_SemanticLayers — השכבה הסמנטית עצמה (שמורה כ-JSON)
-- =============================================================
IF OBJECT_ID('dbo.SL_SemanticLayers', 'U') IS NOT NULL
    DROP TABLE dbo.SL_SemanticLayers;
GO

CREATE TABLE dbo.SL_SemanticLayers (
    Id              INT             IDENTITY(1,1) PRIMARY KEY,
    ConnectionId    INT             NOT NULL,
    LayerJson       NVARCHAR(MAX)   NOT NULL,          -- JSON מלא של השכבה הסמנטית
    CreatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),
    CreatedBy       NVARCHAR(100)   NULL,
    CONSTRAINT FK_SL_SemanticLayers_Connections
        FOREIGN KEY (ConnectionId) REFERENCES dbo.SL_Connections(Id)
);
GO

-- Index לחיפוש מהיר לפי ConnectionId
CREATE UNIQUE INDEX UX_SL_SemanticLayers_ConnectionId
    ON dbo.SL_SemanticLayers(ConnectionId);
GO

-- =============================================================
--  SL_DataDictionary — מילון נתונים (UI בלבד, לא חובה פונקציונלי)
--  מאפשר לייבא תיאורים עסקיים מקובץ חיצוני
-- =============================================================
IF OBJECT_ID('dbo.SL_DataDictionary', 'U') IS NOT NULL
    DROP TABLE dbo.SL_DataDictionary;
GO

CREATE TABLE dbo.SL_DataDictionary (
    Id              INT             IDENTITY(1,1) PRIMARY KEY,
    ConnectionId    INT             NOT NULL,
    TableName       NVARCHAR(128)   NOT NULL,
    ColumnName      NVARCHAR(128)   NOT NULL,
    DisplayName     NVARCHAR(200)   NULL,
    BusinessDesc    NVARCHAR(1000)  NULL,
    Source          NVARCHAR(20)    NOT NULL DEFAULT 'file'
                    CHECK (Source IN ('file','manual','ai')),
    ImportedAt      DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_SL_DataDictionary_Connections
        FOREIGN KEY (ConnectionId) REFERENCES dbo.SL_Connections(Id)
);
GO

CREATE INDEX IX_SL_DataDictionary_Connection_Table
    ON dbo.SL_DataDictionary(ConnectionId, TableName, ColumnName);
GO

-- =============================================================
--  Verify
-- =============================================================
SELECT
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS c
     WHERE c.TABLE_NAME = t.TABLE_NAME) AS ColumnCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_NAME IN ('SL_Connections','SL_SemanticLayers','SL_DataDictionary')
ORDER BY TABLE_NAME;
GO

PRINT '✅ Semantic Layer meta-tables created in HomToMadad DB.';
PRINT '   Tables: SL_Connections, SL_SemanticLayers, SL_DataDictionary';
GO
