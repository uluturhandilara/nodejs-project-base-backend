# Node.js Project Base Backend

Express tabanlı bir REST API ve yönetim paneli backend’i. MongoDB (Mongoose) ile kalıcı veri, JWT ile oturum, rol tabanlı yetkilendirme, denetim kayıtları (audit logs), istatistik uçları, kategori içe/dışa aktarma (Excel) ve Server-Sent Events (SSE) ile bildirim kanalı içerir.

Tüm JSON API’ler `http://localhost:<PORT>/api/...` altında toplanır (`app.js` içinde `/api` ön eki).

---

## Gereksinimler

- **Node.js** (projede Docker için `node:22-alpine` kullanılıyor; yerelde 18+ önerilir)
- **MongoDB** (yerel kurulum veya MongoDB Atlas gibi uzak bir bağlantı dizesi)
- **npm** (bağımlılık kurulumu ve script’ler için)

---

## Proje yapısı (özet)

| Konum | Açıklama |
|--------|-----------|
| `api/` | Uygulama kökü: `app.js`, `bin/www`, `routes/`, `db/`, `lib/`, `config/` |
| `api/routes/` | Route dosyaları; `index.js` tüm `*.js` dosyalarını otomatik `/dosyaAdı` altında mount eder |
| `api/db/` | Mongoose bağlantısı (`Database.js`) ve modeller (`models/`) |
| `api/lib/` | Auth (Passport JWT), yanıt sarmalayıcı, logger, i18n, Excel import/export, event emitter |
| `api/config/` | Ortam ayarları, HTTP kodları, rol/yetki tanımları |
| `docker-compose.yml` | API imajını çalıştırmak için örnek servis tanımı |
| `api/Dockerfile` | Üretim bağımlılıklarıyla imaj oluşturma |

---

## `package.json` ile kullanılan paketler

### Bağımlılıklar (özet)

| Paket | Rol |
|--------|-----|
| **express** | HTTP sunucusu ve yönlendirme |
| **mongoose** / **mongodb** | ODM ve sürücü; veritabanı erişimi |
| **dotenv** | Geliştirme ortamında `.env` yükleme (`NODE_ENV !== "production"` iken) |
| **passport** + **passport-jwt** | JWT stratejisi; `Authorization: Bearer <token>` |
| **jwt-simple** | Girişte access token üretimi |
| **bcrypt** | Şifre hash’leme |
| **express-rate-limit** + **rate-limit-mongo** | `/users/auth` için IP başına istek sınırı (MongoDB store) |
| **multer** | Kategori Excel içe aktarımında dosya yükleme |
| **node-xlsx** | Excel işlemleri (import/export yardımcıları) |
| **winston** + **morgan** | Yapılandırılmış log ve HTTP istek logu |
| **cookie-parser**, **http-errors**, **debug** | Express şablonu ve hata/çerez yardımcıları |
| **ejs** | Hata sayfaları için view engine (`views/`) |
| **moment** | Audit log sorgularında tarih aralığı |
| **is_js** | E-posta vb. doğrulama |

### Geliştirme

| Paket | Rol |
|--------|-----|
| **nodemon** | Kod değişince sunucuyu yeniden başlatma (`npm run dev`) |
| **eslint** + **@eslint/js** + **globals** | Kod kalitesi (isteğe bağlı `npx eslint` ile) |

---

## Ne işe yarıyor? (özellikler)

1. **İlk kurulum (`POST /api/users/register`)**  
   Veritabanında kullanıcı yoksa ilk kayıt açılır; otomatik **SUPER_ADMIN** rolü atanır.

2. **Kimlik doğrulama (`POST /api/users/auth`)**  
   E-posta/şifre ile giriş; yanıtta **JWT** döner. Bu uç **rate limit** ile korunur (MongoDB’de `rateLimits` koleksiyonu).

3. **JWT korumalı rotalar**  
   Passport JWT ile `Bearer` token doğrulanır; kullanıcının rolleri ve izinleri (`RolePrivileges`, `config/role_privileges.js`) yüklenir. Bazı işlemler `auth.checkRoles("yetki_anahtari")` ile ekstra kontrol edilir.

4. **Kullanıcılar, roller, kategoriler**  
   CRUD benzeri uçlar; kategorilerde Excel **export/import**, audit log ve event emitter entegrasyonu.

5. **Denetim kayıtları (`/api/auditlogs`)**  
   Tarih aralığı, sayfalama (`skip`/`limit`) ile listeleme.

6. **İstatistikler (`/api/stats/...`)**  
   Audit log özetleri, tekil kategori adları, kullanıcı sayısı gibi aggregation/distinct sorguları.

7. **SSE (`GET /api/event`)**  
   `text/event-stream` ile `notifications` emitter üzerinden anlık mesaj akışı.

8. **Basit sağlık kontrolü (`GET /api/events`)**  
   `{ success: true }` döner.

---

## Ortam değişkenleri

`api/config/index.js` üzerinden okunur. Üretimde `NODE_ENV=production` ise **dotenv dosyası yüklenmez**; değişkenleri ortamdan vermen gerekir.

| Değişken | Açıklama | Varsayılan (kod içi) |
|-----------|-----------|----------------------|
| `CONNECTION_STRING` | MongoDB bağlantı URI’si | `mongodb://localhost:27017/project_base_backend` |
| `PORT` | HTTP portu | `3000` |
| `JWT_SECRET` | JWT imza anahtarı | Kodda uzun bir varsayılan (üretimde **mutlaka** değiştir) |
| `TOKEN_EXPIRE_TIME` | Token süresi (saniye) | `86400` (24 saat) |
| `LOG_LEVEL` | Log seviyesi | `debug` |
| `FILE_UPLOAD_PATH` | Multer’ın dosya yazdığı dizin (import için) | Tanımsızsa kodda kullanıma göre ayarlanmalı |
| `DEFAULT_LANG` | i18n varsayılan dili | `EN` |

Örnek yerel `.env` (değerleri kendi ortamına göre doldur):

```env
CONNECTION_STRING=mongodb://localhost:27017/project_base_backend
PORT=3000
JWT_SECRET=güvenli-rastgele-bir-anahtar
LOG_LEVEL=debug
FILE_UPLOAD_PATH=/mutlak/yol/api/tmp
DEFAULT_LANG=EN
```

---

## Kurulum ve çalıştırma komutları

Tüm komutlar `api/` dizininde çalıştırılır.

```bash
cd api
npm install
```

MongoDB’nin `CONNECTION_STRING` ile erişilebilir olduğundan emin ol.

### Geliştirme (otomatik yenileme)

```bash
npm run dev
```

`nodemon` ile `bin/www` çalışır; `NODE_ENV` production değilse `.env` yüklenir.

### Üretim / doğrudan Node

```bash
npm start
```

`node ./bin/www` çalıştırır. Sunucu dinlemeye başladıktan sonra `Database` sınıfı MongoDB’ye bağlanır (`bin/www`).

### ESLint (isteğe bağlı)

```bash
cd api
npx eslint .
```

---

## Docker

### İmaj oluşturma

```bash
cd api
docker build -t nodejs-project-base-backend .
```

### Tek konteyner

```bash
docker run --name nodejsProject -p 3000:3000 \
  -e CONNECTION_STRING="mongodb://host.docker.internal:27017/project_base_backend" \
  -e JWT_SECRET="güvenli-anahtar" \
  -d nodejs-project-base-backend
```

`host.docker.internal` macOS/Windows’ta genelde ana makinedeki MongoDB’ye işaret eder; Linux’ta host ağına göre ayarla.

### Docker Compose

Kök dizinde:

```bash
docker compose up -d
```

`docker-compose.yml` örnek ortam değişkenleri ve `3000:3000` port eşlemesi içerir. İmaj adı `nodejs-project-base-backend:latest` olmalı (önce `docker build` ile oluştur).

---

## API uçları (özet)

Taban yol: **`/api/<routeDosyası>`** — örneğin `routes/users.js` → `/api/users`.

| Metot | Yol | Kimlik / not |
|--------|-----|----------------|
| POST | `/api/users/register` | JWT gerekmez; sadece DB boşken ilk kullanıcı |
| POST | `/api/users/auth` | Giriş; rate limit |
| GET | `/api/users/` | JWT |
| POST | `/api/users/add` | JWT |
| PUT | `/api/users/update` | JWT |
| DELETE | `/api/users/delete` | JWT + `user_delete` yetkisi |
| * | `/api/roles/*` | JWT (liste, ekleme, güncelleme, silme + `role_delete`, `role_privileges`) |
| * | `/api/categories/*` | JWT; bazıları `category_view`, `category_update`, silme için yetki |
| POST | `/api/categories/export` | JWT |
| POST | `/api/categories/import` | JWT; multipart `pb_file` |
| POST | `/api/auditlogs/` | JWT; body ile filtre/sayfalama |
| POST | `/api/stats/auditlogs` | JWT |
| POST | `/api/stats/categories/unique` | JWT |
| POST | `/api/stats/users/count` | JWT |
| GET | `/api/event/` | SSE (bu dosyada global JWT middleware yok; kullanım senaryona göre) |
| GET | `/api/events/` | Sağlık/test |

Korumalı isteklerde başlık:

```http
Authorization: Bearer <girişte_dönen_token>
```

---

## Mimari ve akış (özet)

### Bileşenler

- **İstemci** → **Express** (middleware, JSON body, cookie, static, morgan)
- **Router** (`/api` altında dinamik alt router’lar)
- **Auth**: JWT doğrulama sonrası `req.user` içinde id, roller, dil vb.
- **MongoDB**: Kullanıcılar, roller, rol–yetki eşlemesi, kategoriler, audit log’lar

### Akış 1: Kullanıcı girişi

1. İstemci `POST /api/users/auth` ile e-posta ve şifre gönderir.
2. Sunucu kullanıcıyı bulur, `bcrypt` ile şifreyi doğrular.
3. Başarılıysa `jwt-simple` ile token üretilir ve döner.

### Akış 2: Korumalı istek

1. İstemci `Authorization: Bearer` ile istek atar.
2. Passport JWT stratejisi token’ı doğrular; kullanıcı ve rol izinleri yüklenir.
3. Yetki gerektiren uçlarda `checkRoles` ek kontrol yapar.

### Akış 3: Kullanıcı listesi (JWT sonrası)

1. Token geçerliyse `GET /api/users/` ile kullanıcılar listelenir (şifre alanları dışlanır, roller ilişkilendirilir).

---

## Güvenlik notları

- **JWT_SECRET** ve **CONNECTION_STRING** değerlerini repoya commit etme; `.env` `.gitignore` içinde tutulmalı.
- Üretimde varsayılan JWT secret kullanma.
- İlk `register` ile oluşan süper admin hesabını üretimde sınırla veya kurulum sonrası şifre politikası uygula.
- `/auth` için rate limit MongoDB üzerinden IP başına uygulanır; Atlas kullanırken bağlantı izinlerinin doğru olduğundan emin ol.

---

## Sorun giderme

- **Port kullanımda**: `EADDRINUSE` — `PORT` değiştir veya o portu kullanan süreci kapat.
- **MongoDB bağlanamıyor**: `CONNECTION_STRING`, ağ ve firewall; Atlas’ta IP whitelist / `0.0.0.0/0` test için.
- **Import hatası**: `FILE_UPLOAD_PATH` yazılabilir bir dizin olmalı; konteynerda `docker-compose` örneğinde `/data/uploads` kullanılıyor.

---

Bu README, `api/package.json` bağımlılıkları ve mevcut route/config yapısına göre hazırlanmıştır; yeni uç ekledikçe `/api` tablosunu güncellemen yeterlidir.
