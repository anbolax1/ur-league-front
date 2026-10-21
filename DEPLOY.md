# Деплой фронтенда (обновление)

Прод: `zolotoyarena.pro` → Next.js (standalone) лиги на VPS `155.212.133.147`, порт `3010`, под
пользователем `admin2` (systemd --user сервис `ur-front`). За nginx + Let's Encrypt;
`/api` nginx передаёт бэкенду лиги (:8090).

> Сервер под лигу ещё не настроен: первый раз — шаги из `deploy/DEPLOY.md` в корне `UR_League`.
> На том же сервере работает GOARC (`respect-front`, порт 3000) — его не трогаем.

**Принцип:** собираем **локально** (`npm run build`), на сервер кладём только готовый
standalone-бандл. На сервере 960 МБ RAM — там `next build` не запускаем.

> Команды — для Git Bash на Windows. Доступ — по SSH как `admin2`
> (нет ключа — см. «Если нет SSH-доступа как admin2» внизу).

---

## Шаги

```bash
cd frontend
VPS=155.212.133.147

# 1. Чистая сборка (сносим прошлый кеш сборки, чтобы не тащить старые чанки)
rm -rf .next .deploybuild
npm run build           # NEXT_PUBLIC_API_BASE берётся из .env.production (вшивается!)

# 2. Собрать standalone-комплект (Next НЕ копирует static/public сам).
#    Репо одиночный → standalone ПЛОСКИЙ (server.js в корне .next/standalone).
#    Заворачиваем в frontend/, чтобы совпало с прод-юнитом (ExecStart node frontend/server.js).
mkdir -p .deploybuild/frontend
cp -r .next/standalone/. .deploybuild/frontend/
mkdir -p .deploybuild/frontend/.next
cp -r .next/static  .deploybuild/frontend/.next/static
cp -r public        .deploybuild/frontend/public
test -f .deploybuild/frontend/server.js && echo "server.js OK" || echo "!!! server.js НЕ на месте — проверь раскладку"

# 3. Залить в staging-каталог (не поверх работающего)
ssh admin2@$VPS 'rm -rf ~/ur-front_new && mkdir -p ~/ur-front_new'
scp -r .deploybuild/frontend admin2@$VPS:~/ur-front_new/

# 4. Атомарная подмена + перезапуск (старую версию держим как откат)
ssh admin2@$VPS '
  test -f ~/ur-front_new/frontend/server.js || { echo "ABORT: бандл неполный"; exit 1; }
  rm -rf ~/ur-front_old
  mv ~/ur-front ~/ur-front_old
  mv ~/ur-front_new ~/ur-front
  systemctl --user restart ur-front
'
```

## Проверка

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://zolotoyarena.pro            # 200
ssh admin2@$VPS 'systemctl --user is-active ur-front'             # active
```
Открой сайт и сделай **жёсткий refresh** (Ctrl+Shift+R) — на всякий случай.

После успешной проверки можно удалить откат:
```bash
ssh admin2@$VPS 'rm -rf ~/ur-front_old'
```

## Про кеш (важно)

- **JS/CSS-чанки Next хешированы по содержимому** (`/_next/static/.../*.HASH.js`) → при новой
  сборке имена меняются, браузер сам тянет свежие. Ручной «сброс кеша» обычно не нужен.
- Полная подмена каталога `~/ur-front` убирает старые чанки с сервера (поэтому льём заменой, а не поверх).
- HTML-страницы (`ƒ` в выводе сборки) рендерятся на каждый запрос — не кешируются.
- Локально перед сборкой чистим `.next` (шаг 1) — иначе турбопак-кеш может подсунуть старое.
- CDN/прокси перед сайтом нет — чистить нечего. Если появится Cloudflare — там делать Purge Cache.

## Что вшивается при сборке (build-time)

- `NEXT_PUBLIC_API_BASE=/api` — из `.env.production` (коммитится, значение публичное). API на том
  же домене, что и страница: `/api` на zolotoyarena.pro nginx передаёт бэкенду лиги.
  Абсолютный адрес сюда не вписывать: сайт на втором домене останется без данных и входа.
- Рантайм-переменные (`PORT`, `HOSTNAME`, `INTERNAL_API_URL`) — в systemd-юните на сервере, не в сборке.

## Откат (rollback)

Пока не удалил `~/ur-front_old` (шаг «Проверка»):
```bash
ssh admin2@$VPS '
  rm -rf ~/ur-front_bad
  mv ~/ur-front ~/ur-front_bad
  mv ~/ur-front_old ~/ur-front
  systemctl --user restart ur-front
'
```

## Траблшутинг

```bash
ssh admin2@$VPS 'systemctl --user status ur-front --no-pager'
ssh admin2@$VPS 'journalctl --user -u ur-front -n 50 --no-pager'
ssh admin2@$VPS 'systemctl --user restart ur-front'
```
- Белая страница / 500 → смотри логи; частая причина — забыли `static`/`public` в бандле (шаг 2).
- Данные не грузятся, запросы на `/api` отвечают 404 от Next → в nginx-блоке этого домена нет
  `include snippets/site-api.conf` (передача `/api` бэкенду).
- 502 → сервис не поднялся (`server.js` не там / нет node) — логи.

## Если нет SSH-доступа как admin2 (с этой машины)

Через PuTTY под root (как при первом деплое). `pscp` НЕ понимает `dir/.` — заливаем
top-level папки явно:
```bash
PSCP="/c/Program Files/PuTTY/pscp.exe"; PLINK="/c/Program Files/PuTTY/plink.exe"
HK="SHA256:QiiRhzn951tFxzGizQDfEYI8SfXyqNIBfOi3pmkCgAM"
"$PLINK" -batch -hostkey "$HK" -pw '<root-пароль>' root@155.212.133.147 'rm -rf /home/admin2/ur-front_new && mkdir -p /home/admin2/ur-front_new'
cd .deploybuild
"$PSCP" -batch -r -hostkey "$HK" -pw '<root-пароль>' frontend root@155.212.133.147:/home/admin2/ur-front_new/
"$PLINK" -batch -hostkey "$HK" -pw '<root-пароль>' root@155.212.133.147 '
  chown -R admin2:admin2 /home/admin2/ur-front_new
  rm -rf /home/admin2/ur-front_old
  mv /home/admin2/ur-front /home/admin2/ur-front_old
  mv /home/admin2/ur-front_new /home/admin2/ur-front
  systemctl --user -M admin2@ restart ur-front
'
```
