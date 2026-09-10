#pragma once

#include <Arduino.h>

// =============================================================
//  door.h — Magnetic door sensor (reed switch) handler
// =============================================================

/**
 * Inisialisasi pin reed switch.
 * Panggil sekali di setup().
 */
void door_init();

/**
 * Panggil di setiap iterasi loop() — non-blocking.
 * Mendeteksi perubahan state pintu dan trigger callback.
 * @param current_temp  Suhu saat ini untuk dicatat saat pintu dibuka
 */
void door_update(float current_temp);

/**
 * Kembalikan state pintu saat ini.
 * @return true jika pintu sedang TERBUKA
 */
bool door_is_open();

/**
 * Kembalikan berapa lama pintu sudah terbuka (detik).
 * @return 0 jika pintu tertutup
 */
uint32_t door_open_duration_seconds();
