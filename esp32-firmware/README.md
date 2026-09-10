# ESP32 Cold Storage Firmware

Program monitoring suhu dan pintu cold storage menggunakan:
- **ESP32** (any variant)
- **PT100 RTD** + **MAX31865** breakout (SPI)
- **Magnetic door sensor** / reed switch
- **Supabase** sebagai backend database via REST API

---

## 📁 Struktur File

```
esp32-firmware/
├── esp32-cold-storage.ino   ← Main program (buka ini di Arduino IDE)
├── config.h                 ← Konfigurasi WiFi, Supabase, pin, timing
├── temperature.h/.cpp       ← Driver PT100 + MAX31865
├── door.h/.cpp              ← Handler reed switch + kirim ke Supabase
└── supabase.h/.cpp          ← HTTP client ke Supabase REST API
```

> **Penting:** Semua file `.h` dan `.cpp` harus berada dalam **satu folder** yang sama dengan file `.ino`.

---

## 🔌 Wiring Diagram

### MAX31865 → ESP32

```
MAX31865 Pin    ESP32 Pin       Keterangan
────────────    ─────────       ──────────
VIN             3.3V            Power
GND             GND             Ground
CLK             GPIO18          SPI Clock
SDO (MISO)      GPIO19          SPI MISO
SDI (MOSI)      GPIO23          SPI MOSI
CS              GPIO5           Chip Select
```

```
         ESP32                    MAX31865
        ┌──────┐                 ┌──────────┐
   3.3V │      │────────────────▶│ VIN      │
    GND │      │────────────────▶│ GND      │
 GPIO18 │      │────────────────▶│ CLK      │
 GPIO19 │      │◀────────────────│ SDO(MISO)│
 GPIO23 │      │────────────────▶│ SDI(MOSI)│
  GPIO5 │      │────────────────▶│ CS       │
        └──────┘                 └──────────┘
                                      │
                                 ┌────┴────┐
                                 │  PT100  │
                                 │ Sensor  │
                                 └─────────┘
```

#### Konfigurasi jumper MAX31865:
- **2-wire PT100**: Solder jumper 2WIRE, pastikan `PT100_WIRES 2` di config.h
- **3-wire PT100**: Solder jumper 3WIRE ← **paling umum**
- **4-wire PT100**: Solder jumper 4WIRE (paling akurat)

---

### Reed Switch (Magnetic Door Sensor) → ESP32

```
Reed Switch     ESP32 Pin       Keterangan
───────────     ─────────       ──────────
Kaki 1          GPIO4           Signal pin (INPUT_PULLUP)
Kaki 2          GND             Ground
```

```
         ESP32
        ┌──────┐
  GPIO4 │      │────────┐
    GND │      │──────┐ │
        └──────┘      │ │
                      │ │   Reed Switch
                      └─┤   ┌──────────┐
                        └───│  NC/NO   │
                            └──────────┘
                               (Magnet menempel = kontak tertutup)
```

**Logika pin:**
| Kondisi | Pin GPIO4 | Keterangan |
|---------|-----------|------------|
| Magnet menempel (pintu TUTUP) | LOW | INPUT_PULLUP terhubung ke GND |
| Magnet menjauh (pintu BUKA) | HIGH | INPUT_PULLUP → 3.3V |

> Gunakan **Normally Closed (NC)** reed switch untuk deteksi yang lebih aman (jika kabel putus, sistem tahu pintu "terbuka").

---

## 📦 Library yang Diperlukan

Install semua library berikut via **Arduino IDE → Tools → Manage Libraries**:

| Library | Author | Versi |
|---------|--------|-------|
| `Adafruit MAX31865 library` | Adafruit | ≥ 1.6.0 |
| `ArduinoJson` | Benoit Blanchon | **v6.x** (bukan v7) |

Library bawaan ESP32 (sudah tersedia):
- `WiFi.h`
- `HTTPClient.h`
- `WiFiClientSecure.h`

---

## ⚙️ Setup Arduino IDE

### 1. Install ESP32 Board Support

1. Buka **File → Preferences**
2. Tambahkan URL berikut ke *Additional Boards Manager URLs*:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Buka **Tools → Board → Boards Manager**
4. Cari `esp32` → Install **"esp32 by Espressif Systems"**

### 2. Pilih Board

- **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
- Atau sesuaikan dengan varian ESP32 yang kamu pakai

### 3. Upload Settings

```
Upload Speed    : 921600
CPU Frequency   : 240MHz
Flash Frequency : 80MHz
Flash Mode      : QIO
Flash Size      : 4MB
Partition Scheme: Default 4MB with spiffs
```

---

## 🔧 Konfigurasi (config.h)

Sebelum upload, edit file `config.h`:

```cpp
// WiFi
#define WIFI_SSID      "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD  "PASSWORD_WIFI_KAMU"

// Supabase (sudah diisi otomatis)
#define SUPABASE_URL      "https://dpnerteilzewxvndziit.supabase.co"
#define SUPABASE_ANON_KEY "eyJ..."

// PT100 wiring — sesuaikan dengan kabel sensor kamu
#define PT100_WIRES  3   // 2, 3, atau 4

// Interval kirim suhu (default: 60 detik)
#define TEMP_SEND_INTERVAL_MS  60000
```

---

## 🗄️ Tabel Supabase

Pastikan tabel sudah dibuat di Supabase SQL Editor:

```sql
-- Tabel suhu
CREATE TABLE temperature_logs (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  temperature     NUMERIC(6,2)  NOT NULL,
  unit            TEXT          NOT NULL DEFAULT '°C',
  recorded_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Tabel pintu
CREATE TABLE door_logs (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opened_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  closed_at            TIMESTAMPTZ,
  duration_seconds     INTEGER,
  temperature_at_open  NUMERIC(6,2)
);

-- Index untuk query cepat
CREATE INDEX ON temperature_logs (recorded_at);
CREATE INDEX ON door_logs (opened_at);
```

### Row Level Security (RLS)

Untuk mengizinkan ESP32 insert data menggunakan anon key:

```sql
-- Aktifkan RLS
ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE door_logs ENABLE ROW LEVEL SECURITY;

-- Izinkan insert untuk anon
CREATE POLICY "Allow anon insert temperature"
  ON temperature_logs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert door"
  ON door_logs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update door"
  ON door_logs FOR UPDATE TO anon USING (true);
```

---

## 🚀 Cara Upload

1. Hubungkan ESP32 ke komputer via USB
2. Buka file `esp32-cold-storage.ino` di Arduino IDE
3. Edit `config.h` — isi WiFi SSID dan password
4. Pilih port yang benar di **Tools → Port**
5. Klik **Upload** (Ctrl+U)
6. Buka **Serial Monitor** (115200 baud) untuk melihat log

---

## 📊 Contoh Output Serial Monitor

```
╔══════════════════════════════════════╗
║   Cold Storage Monitor v1.0          ║
║   ESP32 + PT100/MAX31865 + Reed SW   ║
╚══════════════════════════════════════╝

[Temp] MAX31865 init — 3-wire PT100, Rref=430.0Ω, Rnominal=100.0Ω
[Door] Init — GPIO4, state awal: TERTUTUP
[WiFi] Menghubungkan ke 'ColdStorage_WiFi'...........
[WiFi] ✅ Terhubung! IP: 192.168.1.105
[WiFi] RSSI: -62 dBm
[Main] Setup selesai — mulai monitoring...

[Temp] Suhu: -18.45°C
─────────────────────────────────────
  Suhu      : -18.45°C ✅ Normal
  Pintu     : 🔒 Tertutup
  WiFi      : ✅ (-62 dBm)
  Uptime    : 60 detik
─────────────────────────────────────
[Door] 🔓 Pintu DIBUKA
[Supabase] POST door_logs → HTTP 201
[Door] Record ID: 42
[Door] 🔒 Pintu DITUTUP — durasi: 15 detik
[Supabase] PATCH door_logs → HTTP 204
[Door] Record 42 diupdate ✅
```

---

## 🔍 Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---------|---------------------|--------|
| Suhu selalu NAN | Wiring MAX31865 salah | Cek koneksi SPI dan CS pin |
| Suhu tidak akurat | Wiring PT100 salah | Cek konfigurasi 2/3/4-wire dan solder jumper |
| FAULT: REFINHIGH | FORCE- open / kabel PT100 putus | Cek kabel PT100 |
| HTTP 401 | Anon key salah | Cek `SUPABASE_ANON_KEY` di config.h |
| HTTP 403 | RLS belum dikonfigurasi | Jalankan SQL RLS policy di atas |
| Pintu tidak terdeteksi | Reed switch terbalik | Cek logika NC/NO, coba tukar kaki |
| WiFi tidak konek | SSID/password salah | Cek `WIFI_SSID` dan `WIFI_PASSWORD` |

---

## 📐 Skema Lengkap

```
                    ┌─────────────────────────────────────┐
                    │              ESP32                   │
                    │                                      │
   PT100 ──── MAX31865 (SPI)                              │
                    │  GPIO18 (CLK)                        │
                    │  GPIO19 (MISO)                       │
                    │  GPIO23 (MOSI)                       │
                    │  GPIO5  (CS)                         │
                    │                                      │
   Reed Switch ─────│  GPIO4  (INPUT_PULLUP)               │
                    │  GND                                 │
                    │                                      │
   USB Power ───────│  5V / 3.3V                          │
   atau 3.7V LiPo   │                                      │
                    └──────────────┬──────────────────────┘
                                   │ WiFi
                                   ▼
                            [ Router WiFi ]
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   Supabase REST API       │
                    │   temperature_logs        │
                    │   door_logs               │
                    └──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  cold-storage-jmabarjam   │
                    │  .vercel.app              │
                    │  (Dashboard Web App)      │
                    └──────────────────────────┘
```
