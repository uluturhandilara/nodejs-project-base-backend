# Stage 1: kullandığımız base
FROM node:22-alpine
# Stage 2: çalışma dizinini ayarla
WORKDIR /data/app
# Stage 3: package'la başlayan, .json gördüğün dosyaları al, workdir'e kopyala yapıştır
COPY package*.json ./
# Stage 4: package-lock.json'u kur
RUN npm ci --only=production
# Stage 5: tüm dosyaları kopyala, /data/app'e yapıştır
COPY . . 
# Stage 6: port 3000'i aç
EXPOSE 3000
# Stage 7: node bin/www'yi çalıştır
CMD ["node", "./bin/www"]

# docker build -t nodejs-project-base-backend .
# docker images -> nodejs-project-base-backend görünürse build başarılı
# docker run --name nodejsProject -p 3000:3000 -d nodejs-project-base-backend -> container oluştur
# docker ps -> çalışan container'lar listelenecek
# docker start nodejsProject -> container'ı başlat
# docker exec -it nodejsProject sh -> container'a gir
# docker stop nodejsProject -> container'ı durdur
# docker rm nodejsProject -> container'ı sil
# docker rmi nodejs-project-base-backend -> image'ı sil

# docker compose up -d -> container'ları başlat
