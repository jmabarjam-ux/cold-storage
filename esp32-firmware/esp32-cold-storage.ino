// =============================================================
//  esp32-cold-storage.ino
//  Cold Storage Monitor — Main Program
//
//  Hardware:
//    - ESP32 (any variant)
//    - PT100 + MAX31865 breakout (SPI)
//    - Magnetic door sensor / reed switch
//
//  Dependencies (install via Arduino Library Manager):
//    - Adafruit MAX31865 library
//    - ArduinoJson (v6)
//    - WiFi (built-in ESP32)
//    - HTTPClient (built-in ESP32)
// =============================================================

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#include "config.h"
#include "temperature.h"
#include "door.h"
#include "supabase.h"

// -------------------------------------------------------------
// Timing state (non-blocking, tidak pakai delay di loop)
// -------------------------------------------------------------
static uint32_t _last_temp_read_ms = 0;   // kapan terakhir baca suhu lokal
static uint32_t _last_temp_send_ms = 0;   // kapan terakhir kirim ke Supabase
static float    _last_temp         = NAN; // suhu terakhir yang valid

// Akumulasi untuk rata-rata sebelum kirim
static float    _temp_sum          = 0.0;
static uint8_t  _temp_count        = 0;

// -------------------------------------------------------------
// WiFi
// -------------------------------------------------------------
static void wifi_connect() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("\n[WiFi] Menghubungkan ke '%s'", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_TIMEOUT_MS) {
      Serial.println("\n[WiFi] ⚠️  Timeout — akan retry nanti");
      return;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.printf("\n[WiFi] ✅ Terhubung! IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("[WiFi] RSSI: %d dBm\n", WiFi.RSSI());
}

static void wifi_check_reconnect() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Koneksi terputus, reconnect...");
    WiFi.disconnect();
    delay(1000);
    wifi_connect();
  }
}

// -------------------------------------------------------------
// Print status ke Serial Monitor
// -------------------------------------------------------------
static void print_status() {
  Serial.println("─────────────────────────────────────");
  Serial.printf("  Suhu      : %.2f°C%s\n",
    _last_temp,
    isnan(_last_temp) ? " (error)" :
    (_last_temp > TEMP_ALERT_MAX ? " ⚠️  TERLALU HANGAT" :
    (_last_temp < TEMP_ALERT_MIN ? " ⚠️  TERLALU DINGIN" : " ✅ Normal"))
  );
  Serial.printf("  Pintu     : %s\n", door_is_open() ? "🔓 TERBUKA" : "🔒 Tertutup");
  if (door_is_open()) {
    Serial.printf("  Durasi    : %lu detik\n", door_open_duration_seconds());
  }
  Serial.printf("  WiFi      : %s (%d dBm)\n",
    WiFi.status() == WL_CONNECTED ? "✅" : "❌",
    WiFi.RSSI()
  );
  Serial.printf("  Uptime    : %lu detik\n", millis() / 1000);
  Serial.println("─────────────────────────────────────");
}

// -------------------------------------------------------------
// setup()
// -------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║   Cold Storage Monitor v1.0          ║");
  Serial.println("║   ESP32 + PT100/MAX31865 + Reed SW   ║");
  Serial.println("╚══════════════════════════════════════╝\n");

  // Init sensor suhu
  temperature_init();

  // Init sensor pintu
  door_init();

  // Koneksi WiFi
  wifi_connect();

  // Baca suhu awal
  _last_temp = temperature_read_average(3, 300);
  _last_temp_read_ms = millis();
  _last_temp_send_ms = millis();

  Serial.println("\n[Main] Setup selesai — mulai monitoring...\n");
}

// -------------------------------------------------------------
// loop()
// -------------------------------------------------------------
void loop() {
  uint32_t now = millis();

  // 1. Cek dan reconnect WiFi jika perlu
  wifi_check_reconnect();

  // 2. Baca suhu secara periodik (setiap TEMP_READ_INTERVAL_MS)
  if (now - _last_temp_read_ms >= TEMP_READ_INTERVAL_MS) {
    _last_temp_read_ms = now;

    float t = temperature_read();
    if (!isnan(t)) {
      _last_temp   = t;
      _temp_sum   += t;
      _temp_count++;
    }
  }

  // 3. Kirim rata-rata suhu ke Supabase (setiap TEMP_SEND_INTERVAL_MS)
  if (now - _last_temp_send_ms >= TEMP_SEND_INTERVAL_MS) {
    _last_temp_send_ms = now;

    float temp_to_send = NAN;

    if (_temp_count > 0) {
      // Kirim rata-rata dari semua sample sejak pengiriman terakhir
      temp_to_send = _temp_sum / _temp_count;
      _temp_sum    = 0.0;
      _temp_count  = 0;
    } else if (!isnan(_last_temp)) {
      // Fallback: pakai nilai terakhir
      temp_to_send = _last_temp;
    }

    if (!isnan(temp_to_send)) {
      Serial.printf("[Main] Kirim suhu ke Supabase: %.2f°C\n", temp_to_send);
      bool ok = supabase_insert_temperature(temp_to_send);
      if (!ok) {
        Serial.println("[Main] ⚠️  Gagal kirim suhu — akan retry di interval berikutnya");
      }
    } else {
      Serial.println("[Main] ⚠️  Tidak ada data suhu valid untuk dikirim");
    }

    // Print status ringkas setiap kali kirim
    print_status();
  }

  // 4. Update state pintu (non-blocking, setiap loop)
  door_update(_last_temp);

  // Sedikit delay untuk stabilitas — tidak mempengaruhi responsivitas pintu
  delay(10);
}
