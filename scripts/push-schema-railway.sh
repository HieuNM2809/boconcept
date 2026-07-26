#!/usr/bin/env bash
# Áp doc/schema.sql + TẤT CẢ doc/migrations/*.sql lên MySQL Railway.
# CỐ Ý KHÔNG chạy doc/seed.sql (seed dùng ON DUPLICATE KEY UPDATE image=... ->
# ghi đè ảnh thật đã upload bằng ảnh placeholder picsum).
#
# URL DB đọc từ biến môi trường MYSQL_PUBLIC_URL (do `railway run --service MySQL`
# bơm vào) -> mật khẩu KHÔNG lộ ra chat/URL. Chạy qua mysql client TRONG container
# boconcept-mysql vì client đó hiểu DELIMITER/CREATE PROCEDURE của các file
# migration (script Node mysql2 với multipleStatements thì KHÔNG hiểu DELIMITER).
#
# Cách chạy (sau khi `railway login` + `railway link`):
#   railway run --service MySQL bash scripts/push-schema-railway.sh
set -euo pipefail

URL="${MYSQL_PUBLIC_URL:-${DATABASE_URL:-}}"
if [ -z "$URL" ]; then
  echo "❌ Thiếu MYSQL_PUBLIC_URL. Hãy chạy qua: railway run --service MySQL bash $0" >&2
  exit 1
fi

# Parse mysql://user:pass@host:port/db?...
rest="${URL#mysql://}"
creds="${rest%@*}"
hostpart="${rest#*@}"
DB_USER="${creds%%:*}"
DB_PASS="${creds#*:}"
hostport="${hostpart%%/*}"
DB_NAME="${hostpart#*/}"; DB_NAME="${DB_NAME%%\?*}"
DB_HOST="${hostport%%:*}"
DB_PORT="${hostport#*:}"; [ "$DB_PORT" = "$DB_HOST" ] && DB_PORT=3306

echo "Đích: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}  (mật khẩu ẩn)"

run_sql () {
  local file="$1"
  [ -f "$file" ] || { echo "  (bỏ qua, không có $file)"; return 0; }
  echo ">>> áp $file"
  # MYSQL_PWD qua -e để mật khẩu không nằm trong argv (đỡ lộ ở `ps`).
  docker exec -i -e MYSQL_PWD="$DB_PASS" boconcept-mysql \
    mysql --default-character-set=utf8mb4 -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$file"
}

run_sql doc/schema.sql
for m in doc/migrations/*.sql; do
  run_sql "$m"
done

echo "✅ XONG — đã áp schema + migration. (seed.sql KHÔNG chạy.)"
