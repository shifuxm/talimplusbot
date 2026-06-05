# Database Backup

Bu papka Postgres databasening backup fayllarini o'z ichiga oladi.

## Restore qilish uchun:

### 1. SQL dump dan (agar .sql fayli bo'lsa):
```bash
psql $DATABASE_URL < database-backup.sql
```

### 2. Binary fayllardan (agar pgdata papkasi bo'lsa):
```bash
# Postgres to'xtating
sudo systemctl stop postgresql

# Backup fayllarni copy qiling
sudo cp -r pgdata/* /var/lib/postgresql/data/

# Postgres ishga tushiring
sudo systemctl start postgresql
```

## Fayllar:
- `pgdata/` - Postgres data directory (binary fayllar)
- `database-backup.sql` - SQL dump (agar mavjud bo'lsa)

