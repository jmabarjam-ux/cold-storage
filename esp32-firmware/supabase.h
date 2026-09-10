#pragma once

#include <Arduino.h>

// =============================================================
//  supabase.h — HTTP client untuk Supabase REST API
// =============================================================

/**
 * Kirim data suhu ke tabel temperature_logs.
 * @param temperature  Nilai suhu dalam °C
 * @param unit         Satuan, default "°C"
 * @return true jika berhasil (HTTP 201)
 */
bool supabase_insert_temperature(float temperature, const char* unit = "°C");

/**
 * Insert baris baru ke door_logs saat pintu dibuka.
 * Hanya mengisi opened_at dan temperature_at_open.
 * @param temperature_at_open  Suhu saat pintu dibuka (°C)
 * @return id record yang dibuat, atau -1 jika gagal
 */
long supabase_door_open(float temperature_at_open);

/**
 * Update baris door_logs saat pintu ditutup.
 * Mengisi closed_at dan duration_seconds.
 * @param record_id       ID record dari supabase_door_open()
 * @param duration_secs   Durasi pintu terbuka dalam detik
 * @return true jika berhasil (HTTP 200/204)
 */
bool supabase_door_close(long record_id, int duration_secs);
