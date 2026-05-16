-- PostgreSQL kurulum komutları
-- Terminal'de postgres kullanıcısı olarak çalıştırın:
-- sudo -u postgres psql

-- 1. Veritabanı oluştur
CREATE DATABASE mentonnect_db;

-- 2. Kullanıcı oluştur
CREATE USER mentonnect_user WITH PASSWORD 'sifrenizi_buraya_yazin';

-- 3. Yetkileri ver
ALTER ROLE mentonnect_user SET client_encoding TO 'utf8';
ALTER ROLE mentonnect_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE mentonnect_user SET timezone TO 'Europe/Istanbul';
GRANT ALL PRIVILEGES ON DATABASE mentonnect_db TO mentonnect_user;

-- PostgreSQL 15+ için ek yetki:
-- \c mentonnect_db
-- GRANT ALL ON SCHEMA public TO mentonnect_user;
