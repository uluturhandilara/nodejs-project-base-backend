# NodeJS Project Base Backend

Bu dokümantasyon, projenin **Projenin Oluşturulması** adımından itibaren diyagramdaki sırayı takip eder.

## Authentication & User List Flow - Sequence Diagram

Bu diyagram, kullanıcı girişi ve kullanıcı listesi sorgulama işlemlerinin yaşam döngüsünü göstermektedir.

### System Architecture

Sistem dört ana bileşenden oluşmaktadır:

- **Client**: Kullanıcı arayüzü
- **Server**:
  - **Middleware**: İstekleri kontrol eden ara katman
  - **Router**: İstekleri yönlendiren katman
- **DB**: Veritabanı

### Flow 1: User Login (Kullanıcı Girişi)

```
Client → Middleware: User Login Request
Middleware: check username and password
Middleware → Router: (validated request)
Router → DB: Find (Select)
DB → Router: User or Null
Router → Middleware: return User
Middleware → Client: Response with JWT Token
```

### Adımlar:

1. Client, kullanıcı giriş isteği gönderir
2. Middleware, kullanıcı adı ve şifre kontrolü yapar
3. Doğrulama başarılı ise Router'a iletilir
4. Router, veritabanından kullanıcıyı sorgular (Select)
5. DB, kullanıcı bilgisini döner (User) veya bulunamazsa Null döner
6. Router, sonucu Middleware'e iletir
7. Middleware, Client'a JWT Token ile yanıt döner

### Flow 2: Get User List (Kullanıcı Listesi)

```
Client → Middleware: Request for User List
Middleware: check JWT Token
Middleware → Router: (validated request)
Router → DB: Find (Select)
DB → Router: User List
Router → Middleware: User List
Middleware → Client: Response with User List
```

### Adımlar:

1. Client, kullanıcı listesi isteği gönderir
2. Middleware, JWT Token kontrolü yapar
3. Token geçerli ise Router'a iletilir
4. Router, veritabanından kullanıcı listesini sorgular (Select)
5. DB, kullanıcı listesini döner
6. Router, listeyi Middleware'e iletir
7. Middleware, Client'a kullanıcı listesi ile yanıt döner

### Security Notes

- Tüm istekler Middleware katmanında doğrulanır
- Login işleminde kullanıcı adı ve şifre kontrolü yapılır
- Sonraki isteklerde JWT Token ile kimlik doğrulama yapılır
- Doğrulama başarısız olursa istek Router'a iletilmez

### Database Operations

- `Find (Select)`: Veritabanı sorgulama işlemi
- Sonuç: User object veya User List
- Kullanıcı bulunamazsa: Null döner