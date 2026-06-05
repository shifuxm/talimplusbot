# Database Backup Instructions

## Muammo:
Sandbox VM dan Postgres internal network (`postgres.railway.internal`) ga kira olmaydi.

## Yechim 1: Railway CLI dan (Tavsiya qilinadi)

```bash
# 1. Railway CLI login qilish
railway login

# 2. Postgres container ichida pg_dump qilish
cd /root/repo
railway run pg_dump -U postgres -d railway > database-backup/database-backup.sql

# 3. Git ga add qilish
git add database-backup/database-backup.sql
git commit -m "Add database SQL dump"
git push
```

## Yechim 2: DATABASE_PUBLIC_URL dan

Postgres service da TCP Proxy enabled. Public URL dan foydalanish:

```bash
# Railway Dashboard dan DATABASE_PUBLIC_URL ni olish
# Postgres → Variables → DATABASE_PUBLIC_URL

export DATABASE_PUBLIC_URL="postgresql://postgres:password@host:port/railway"
pg_dump $DATABASE_PUBLIC_URL > database-backup/database-backup.sql
```

## Yechim 3: Local Postgres dan

Agar sizda local Postgres bo'lsa:

```bash
# Local Postgres dan backup qilish
pg_dump -U postgres -d railway > database-backup/database-backup.sql
```

---

**Qaysi yo'lni tanlaysiz?**
