# Database Schema - MongoDB

## Database: MongoDB

Proje MongoDB veritabanı kullanmaktadır ve aşağıdaki koleksiyonları içermektedir.

---

## Collections & Schemas

### 1. Users
Kullanıcı bilgilerini tutan ana koleksiyon.
```javascript
{
  _id: ObjectID,
  email: String,
  password: String,
  is_active: Boolean,
  first_name: String,
  last_name: String,
  phone_number: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

**İlişkiler:**
- `User_Roles` ile Many-to-Many ilişki
- `Categories` ile One-to-Many ilişki (created_by)
- `AuditLogs` ile One-to-Many ilişki

---

### 2. Roles
Sistem rollerini tanımlayan koleksiyon.
```javascript
{
  _id: ObjectID,
  role_name: String,
  is_active: Boolean,
  created_by: ObjectID,
  created_at: DateTime,
  updated_at: DateTime
}
```

**İlişkiler:**
- `Role_Privileges` ile One-to-Many ilişki
- `User_Roles` ile Many-to-Many ilişki

---

### 3. Role_Privileges
Rollere atanan yetkileri tutan koleksiyon.
```javascript
{
  _id: ObjectID,
  role_id: ObjectID,
  permission: String,
  created_by: ObjectID,
  created_at: DateTime,
  updated_at: DateTime
}
```

**İlişkiler:**
- `Roles` ile Many-to-One ilişki

---

### 4. User_Roles
Kullanıcılar ve roller arasındaki ara tablo (junction table).
```javascript
{
  _id: ObjectID,
  role_id: ObjectID,
  user_id: ObjectID,
  created_at: DateTime,
  updated_at: DateTime
}
```

**İlişkiler:**
- `Users` ile Many-to-One ilişki
- `Roles` ile Many-to-One ilişki

---

### 5. Categories
Kategori bilgilerini tutan koleksiyon.
```javascript
{
  _id: ObjectID,
  is_active: Boolean,
  created_by: ObjectID,
  created_at: DateTime,
  updated_at: DateTime
}
```

**İlişkiler:**
- `Users` ile Many-to-One ilişki (created_by referansı)

---

### 6. AuditLogs
Sistem üzerinde yapılan işlemlerin log kayıtlarını tutan koleksiyon.
```javascript
{
  _id: ObjectID,
  level: String,
  email: String,
  location: String,
  proc_type: String,
  log: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

**Açıklama:**
- `level`: Log seviyesi (info, warning, error, vb.)
- `email`: İşlemi yapan kullanıcının email'i
- `location`: İşlemin gerçekleştiği lokasyon/endpoint
- `proc_type`: İşlem tipi
- `log`: Detaylı log mesajı

---

## Entity Relationship Overview
```
Users (1) ←→ (N) User_Roles (N) ←→ (1) Roles
  ↓                                      ↓
  ↓                                      ↓
(1:N) Categories              (1:N) Role_Privileges
  
Users (1) ←→ (N) AuditLogs
```

---

## Indexes (Önerilen)

### Users Collection
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ is_active: 1 })
db.users.createIndex({ created_at: -1 })
```

### User_Roles Collection
```javascript
db.user_roles.createIndex({ user_id: 1, role_id: 1 }, { unique: true })
db.user_roles.createIndex({ role_id: 1 })
```

### Roles Collection
```javascript
db.roles.createIndex({ role_name: 1 }, { unique: true })
db.roles.createIndex({ is_active: 1 })
```

### AuditLogs Collection
```javascript
db.auditlogs.createIndex({ email: 1 })
db.auditlogs.createIndex({ created_at: -1 })
db.auditlogs.createIndex({ level: 1, created_at: -1 })
```

---

## Notlar

- Tüm koleksiyonlar `_id` alanını ObjectID olarak kullanır
- `created_at` ve `updated_at` alanları DateTime formatındadır
- `is_active` alanları Boolean tipindedir ve soft delete için kullanılabilir
- `created_by` alanları Users koleksiyonuna referans verir
- Şifre alanları hash'lenmiş olarak saklanmalıdır (bcrypt önerilir)