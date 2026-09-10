#include "door.h"
#include "config.h"
#include "supabase.h"

// =============================================================
//  door.cpp — Implementasi deteksi pintu + kirim ke Supabase
// =============================================================

// State internal
static bool     _door_open       = false;  // state terakhir yang confirmed
static bool     _raw_state       = false;  // state mentah dari pin
static uint32_t _last_debounce   = 0;      // waktu terakhir pin berubah (ms)
static uint32_t _open_start_ms   = 0;      // millis() saat pintu dibuka
static long     _current_record  = -1;     // ID record Supabase yang sedang aktif

// Baca pin: HIGH = pintu BUKA (INPUT_PULLUP + NO reed switch)
// LOW  = magnet mendekat = pintu TUTUP
// HIGH = magnet menjauh  = pintu BUKA
static inline bool _pin_is_open() {
  return digitalRead(DOOR_PIN) == HIGH;
}

// -------------------------------------------------------------
// Init
// -------------------------------------------------------------
void door_init() {
  pinMode(DOOR_PIN, INPUT_PULLUP);
  _raw_state   = _pin_is_open();
  _door_open   = _raw_state;
  _open_start_ms  = 0;
  _current_record = -1;

  Serial.printf("[Door] Init — GPIO%d, state awal: %s\n",
    DOOR_PIN, _door_open ? "TERBUKA" : "TERTUTUP");
}

// -------------------------------------------------------------
// Update — panggil di loop()
// -------------------------------------------------------------
void door_update(float current_temp) {
  bool reading = _pin_is_open();
  uint32_t now = millis();

  // Debounce: reset timer jika pin masih berubah-ubah
  if (reading != _raw_state) {
    _raw_state       = reading;
    _last_debounce   = now;
    return; // tunggu sampai stabil
  }

  // Belum melewati debounce window
  if ((now - _last_debounce) < DOOR_DEBOUNCE_MS) return;

  // State sudah stabil — cek apakah berbeda dari state confirmed
  if (reading == _door_open) return; // tidak ada perubahan

  // ---- STATE BERUBAH ----
  _door_open = reading;

  if (_door_open) {
    // ========================
    // PINTU BARU DIBUKA
    // ========================
    _open_start_ms = now;
    Serial.println("[Door] 🔓 Pintu DIBUKA");

    // Kirim ke Supabase — dapatkan record ID untuk di-update nanti
    _current_record = supabase_door_open(current_temp);

    if (_current_record > 0) {
      Serial.printf("[Door] Record ID: %ld\n", _current_record);
    } else {
      Serial.println("[Door] ⚠️  Gagal insert door open ke Supabase");
    }

  } else {
    // ========================
    // PINTU BARU DITUTUP
    // ========================
    uint32_t duration_ms   = now - _open_start_ms;
    uint32_t duration_secs = duration_ms / 1000;

    Serial.printf("[Door] 🔒 Pintu DITUTUP — durasi: %lu detik\n", duration_secs);

    // Update record di Supabase
    if (_current_record > 0) {
      bool ok = supabase_door_close(_current_record, (int)duration_secs);
      if (ok) {
        Serial.printf("[Door] Record %ld diupdate ✅\n", _current_record);
      } else {
        Serial.printf("[Door] ⚠️  Gagal update record %ld\n", _current_record);
      }
    } else {
      Serial.println("[Door] ⚠️  Tidak ada record aktif untuk diupdate");
    }

    _current_record = -1;
    _open_start_ms  = 0;
  }
}

// -------------------------------------------------------------
// Getters
// -------------------------------------------------------------
bool door_is_open() {
  return _door_open;
}

uint32_t door_open_duration_seconds() {
  if (!_door_open || _open_start_ms == 0) return 0;
  return (millis() - _open_start_ms) / 1000;
}
