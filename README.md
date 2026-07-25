# מערכת שכבה סמנטית (Semantic Layer)

> מטלת בית — מפתחת תוכנה רמה ב'  
> **תרחיש מקצה לקצה**: חיבור ל-SQL Server → קריאת מבנה אוטומטית → בניית שכבה סמנטית → הצגת נתונים

---

## דרישות מוקדמות

| רכיב | גרסה מינימלית |
|---|---|
| .NET SDK | 6.0 |
| Node.js | 18+ |
| Angular CLI | 16+ |
| SQL Server | 2019+ (או LocalDB) |
| npm | 9+ |

---

## התקנה והרצה

### 1. יצירת מסדי הנתונים

פתחי את **SQL Server Management Studio** (או Azure Data Studio) והריצי את שני הסקריפטים בסדר:

```sql
-- 1. DB הדגמה (הנתונים שאליהם "מתחברים"):
SQL\01_SemanticLayerDemo_DB.sql

-- 2. טבלאות מטא-דאטה במסד המערכת:
-- עדכני את שם ה-DB בשורה הראשונה (USE AppDb;) לשם ה-DB שלך
SQL\02_SemanticLayer_MetaTables.sql
```

### 2. הגדרת Connection String

ערכי את הקובץ `server/API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "AppDbConnection": "Server=(localdb)\\MSSQLLocalDB;Database=AppDb;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

> **הערה**: שרת ה-demo שאליו מתחברים דרך הממשק הוא `SemanticLayerDemo` — אלו פרטי החיבור שיוזנו **דרך ה-UI** בשלב 1.

### 3. הרצת ה-Backend

```bash
cd server/API
dotnet restore
dotnet run
```

ה-API יעלה על `http://localhost:5286` (ראי `Properties/launchSettings.json`).  
Swagger UI: `http://localhost:5286/swagger`

### 4. הרצת ה-Frontend

```bash
cd client/samanticLayer
npm install
ng serve
```

Angular יעלה על `http://localhost:4200`.

---

## תרחיש הדגמה מלא (End-to-End)

1. **פתחי את הדפדפן** ב-`http://localhost:4200` — נפתח דף הנחיתה.
2. **לחצי "התחל ביצירת שכבה סמנטית"** — מעבר לשלב 1.
3. **שלב 1 — חיבור**:
   - שם חיבור: `Demo`
   - שם שרת: `(localdb)\MSSQLLocalDB` (או השרת שלך)
   - שם מסד נתונים: `SemanticLayerDemo`
   - סוג אימות: `Windows Authentication`
   - לחצי **"התחבר וסרוק"**
   - תראי 4 טבלאות, 3 קשרים, ונתוני Min/Max/Distinct per column.
4. **שלב 2 — העשרה**: ערכי שמות עסקיים (למשל "Orders" → "הזמנות"), אשרי קשרים, ולחצי **"שמור שינויים"**.
5. **שלב 3 — הצגת נתונים**: בחרי טבלה (לפי שמה העסקי), סמני עמודות, הגדירי מסנן (למשל `Price >= 500`) ולחצי **"הצג נתונים"** — תתקבל טבלת תוצאות + ה-SQL שנוצר.
6. **שלב 4 — ייצוא**: לחצי **"ייצוא JSON"** להורדת קובץ ה-Semantic Layer.

---

## מבנה הפרויקט

```
HomToMadad/
├── SQL/                                  # סקריפטי DB
├── server/
│   ├── API/                              # ASP.NET Core Web API
│   │   ├── Controllers/                  # ConnectionsController, SemanticLayerController, DataDisplayController
│   │   ├── DTO/                          # SemanticLayerDTOs.cs
│   │   └── Program.cs
│   ├── Services/
│   │   └── SemanticLayer/                # DatabaseMetadataService, SemanticLayerService, DynamicQueryService
│   ├── Data/
│   │   └── Repositories/                 # ConnectionsRepo, SemanticLayerRepo
│   └── Common/Entities/                  # ConnectionEO, SemanticLayerEO
└── client/samanticLayer/
    └── src/app/features/semantic-layer/  # Angular feature module
        ├── services/                     # SemanticLayerApiService
        ├── steps/                        # sl-step1..4 components
        ├── semantic-layer.component.ts   # Main stepper container
        └── semantic-layer-state.service.ts
```

---

## API Endpoints

| Endpoint | Method | תיאור | סטטוס |
|---|---|---|---|
| `/api/connections` | GET/POST | ניהול חיבורי DB | ✅ פעיל |
| `/api/connections/{id}/test` | POST | בדיקת חיבור | ✅ פעיל |
| `/api/connections/{id}/scan` | POST | סריקת מבנה + Profiling + שמירה | ✅ פעיל |
| `/api/semantic-layer/{connectionId}` | GET/PUT | קריאה/עדכון השכבה הסמנטית | ✅ פעיל |
| `/api/semantic-layer/{connectionId}/export` | GET | ייצוא JSON | ✅ פעיל |
| `/api/data/query` | POST | שאילתה דינמית | ✅ פעיל |

---

## החלטות תכנוניות

- **גרסת .NET 6**: הפרויקט הקיים היה על .NET 6, הוחלט להישאר עליו מטעמי יציבות וזמן.
- **אימות Anonymous**: הוחלף מ-Windows Negotiate לצורך הרצה עצמאית ללא תלות ב-Active Directory.
- **שמירה ב-DB**: השכבה הסמנטית נשמרת כ-JSON ב-SQL Server (טבלת `SL_SemanticLayers`).
- **DB נפרד**: הנתונים העסקיים (`SemanticLayerDemo`) בנפרד מטבלאות המטא-דאטה.
- **Provider Pattern**: `DatabaseMetadataService` מופשט לצורך הרחבה עתידית לסוגי DB נוספים.

---

## מגבלות הפתרון

| יכולת | סטטוס | הערה |
|---|---|---|
| סנכרון מול חיבור קיים (Diff) | UI בלבד | לא מומש בגרסה זו |
| ייצוא Excel | כפתור disabled | מומש ייצוא JSON בלבד |
| מילוי AI אוטומטי | כפתור disabled | כפתור קיים עם tooltip "בפיתוח" |
| מילון נתונים חיצוני | טבלה קיימת ב-DB | לא מומש UI ייבוא מלא |
| הוספת עמודה מקובץ | — | לא מומש |
| תמיכה ב-DB שאינם SQL Server | — | ארכיטקטורה מוכנה (Provider Pattern) |

---

## שיפורים עתידיים

- תמיכה ב-PostgreSQL / MySQL (מימוש `IDatabaseMetadataProvider` נוסף)
- סנכרון אוטומטי מתוזמן (Scheduled Sync) עם זיהוי Diff
- מילוי אוטומטי לפי AI (GPT API לתיאורים עסקיים)
- ייצוא ל-Excel ו-PDF
- ניהול גרסאות של השכבה הסמנטית (Version History)
- Role-based access control

---

## רישיון

פרויקט לימודי — מטלת בית.
