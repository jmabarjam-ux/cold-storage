#pragma once

#include <Arduino.h>

// =============================================================
//  temperature.h — PT100 + MAX31865 driver
// =============================================================

/**
 * Inisialisasi MAX31865.
 * Panggil sekali di setup().
 */
void temperature_init();

/**
 * Baca suhu dari PT100 via MAX31865.
 * @return Suhu dalam °C, atau NAN jika terjadi fault.
 */
float temperature_read();

/**
 * Baca suhu rata-rata dari N sample.
 * @param samples  Jumlah sample (default 5)
 * @param delay_ms Jeda antar sample dalam ms (default 200)
 * @return Rata-rata suhu °C, atau NAN jika semua sample gagal.
 */
float temperature_read_average(uint8_t samples = 5, uint16_t delay_ms = 200);

/**
 * Cek dan print fault register MAX31865 ke Serial.
 * @return true jika ada fault.
 */
bool temperature_check_fault();
