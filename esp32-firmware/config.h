#pragma once

// =============================================================
//  COLD STORAGE MONITOR — ESP32 Firmware
//  config.h — Semua konfigurasi pin, WiFi, Supabase, dan timing
// =============================================================

// -------------------------------------------------------------
// WiFi
// -------------------------------------------------------------
#define WIFI_SSID         "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD     "PASSWORD_WIFI_KAMU"

// Timeout koneksi WiFi (ms)
#define WIFI_TIMEOUT_MS   15000

// -------------------------------------------------------------
// Supabase
// -------------------------------------------------------------
#define SUPABASE_URL      "https://dpnerteilzewxvndziit.supabase.co"
#define SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmVydGVpbHpld3h2bmR6aWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDM0NjYsImV4cCI6MjEwMzkxOTQ2Nn0.Id4rkDHuOJAT479UsNSgif2J1l38nkOm9oGQ8RJbf6I"

// Nama tabel di Supabase
#define TABLE_TEMPERATURE "temperature_logs"
#define TABLE_DOOR        "door_logs"

// -------------------------------------------------------------
// Pin MAX31865 (SPI) — PT100
// -------------------------------------------------------------
// Default SPI ESP32: MOSI=23, MISO=19, CLK=18
// CS (Chip Select) bebas, gunakan GPIO yang tidak bentrok
#define MAX31865_CS_PIN   5    // GPIO5  → CS  MAX31865
#define MAX31865_MOSI_PIN 23   // GPIO23 → SDI MAX31865
#define MAX31865_MISO_PIN 19   // GPIO19 → SDO MAX31865
#define MAX31865_CLK_PIN  18   // GPIO18 → CLK MAX31865

// Tipe PT100 (2-wire, 3-wire, atau 4-wire)
// Sesuaikan dengan konfigurasi kabel sensor kamu
#define PT100_WIRES       3    // 2, 3, atau 4

// Resistansi referensi pada MAX31865 board
// Biasanya 430Ω untuk PT100, 4300Ω untuk PT1000
#define RREF              430.0

// Resistansi nominal PT100 pada 0°C
#define RNOMINAL          100.0

// -------------------------------------------------------------
// Pin Reed Switch (Magnetic Door Sensor)
// -------------------------------------------------------------
// Hubungkan: satu kaki ke GPIO, satu kaki ke GND
// INPUT_PULLUP digunakan — LOW = magnet mendekat (pintu TUTUP)
//                         HIGH = magnet menjauh (pintu BUKA)
#define DOOR_PIN          4    // GPIO4 → Reed Switch

// Debounce delay (ms) untuk mencegah false trigger
#define DOOR_DEBOUNCE_MS  50

// -------------------------------------------------------------
// Timing
// -------------------------------------------------------------
// Interval kirim data suhu ke Supabase (ms)
// Default: 60 detik
#define TEMP_SEND_INTERVAL_MS  60000

// Interval baca suhu lokal untuk rata-rata (ms)
// Default: 5 detik
#define TEMP_READ_INTERVAL_MS  5000

// Timeout HTTP request (ms)
#define HTTP_TIMEOUT_MS        10000

// Retry jika HTTP gagal
#define HTTP_MAX_RETRY         3
#define HTTP_RETRY_DELAY_MS    2000

// -------------------------------------------------------------
// Batas Suhu Alert (opsional, untuk Serial log)
// -------------------------------------------------------------
#define TEMP_ALERT_MIN    -25.0   // °C — terlalu dingin
#define TEMP_ALERT_MAX    -15.0   // °C — terlalu hangat (target -18°C)
