#include "temperature.h"
#include "config.h"

#include <Adafruit_MAX31865.h>

// =============================================================
//  temperature.cpp — Implementasi PT100 + MAX31865
// =============================================================

// Instance MAX31865 dengan pin SPI software (bit-bang)
// Gunakan hardware SPI jika perlu performa lebih baik:
//   Adafruit_MAX31865 sensor(CS_PIN); // hardware SPI
static Adafruit_MAX31865 sensor(
  MAX31865_CS_PIN,
  MAX31865_MOSI_PIN,
  MAX31865_MISO_PIN,
  MAX31865_CLK_PIN
);

// Tentukan tipe wiring PT100
#if PT100_WIRES == 2
  #define MAX31865_WIRE_TYPE  MAX31865_2WIRE
#elif PT100_WIRES == 3
  #define MAX31865_WIRE_TYPE  MAX31865_3WIRE
#elif PT100_WIRES == 4
  #define MAX31865_WIRE_TYPE  MAX31865_4WIRE
#else
  #define MAX31865_WIRE_TYPE  MAX31865_3WIRE
#endif

// -------------------------------------------------------------
// Init
// -------------------------------------------------------------
void temperature_init() {
  sensor.begin(MAX31865_WIRE_TYPE);
  Serial.printf("[Temp] MAX31865 init — %d-wire PT100, Rref=%.1fΩ, Rnominal=%.1fΩ\n",
    PT100_WIRES, RREF, RNOMINAL);
}

// -------------------------------------------------------------
// Baca suhu tunggal
// -------------------------------------------------------------
float temperature_read() {
  // Cek fault sebelum baca
  if (temperature_check_fault()) {
    return NAN;
  }

  float temp = sensor.temperature(RNOMINAL, RREF);

  // Validasi range masuk akal untuk cold storage (-60°C s/d +50°C)
  if (temp < -60.0 || temp > 50.0) {
    Serial.printf("[Temp] Pembacaan di luar range: %.2f°C — abaikan\n", temp);
    return NAN;
  }

  Serial.printf("[Temp] Suhu: %.2f°C\n", temp);
  return temp;
}

// -------------------------------------------------------------
// Baca rata-rata dari beberapa sample
// -------------------------------------------------------------
float temperature_read_average(uint8_t samples, uint16_t delay_ms) {
  float sum   = 0.0;
  uint8_t valid = 0;

  for (uint8_t i = 0; i < samples; i++) {
    float t = temperature_read();
    if (!isnan(t)) {
      sum += t;
      valid++;
    }
    if (i < samples - 1) delay(delay_ms);
  }

  if (valid == 0) {
    Serial.println("[Temp] Semua sample gagal — return NAN");
    return NAN;
  }

  float avg = sum / valid;
  Serial.printf("[Temp] Rata-rata %d/%d sample: %.2f°C\n", valid, samples, avg);
  return avg;
}

// -------------------------------------------------------------
// Cek fault register
// -------------------------------------------------------------
bool temperature_check_fault() {
  uint8_t fault = sensor.readFault();
  if (fault == 0) return false;

  Serial.printf("[Temp] ⚠️  FAULT: 0x%02X\n", fault);

  if (fault & MAX31865_FAULT_HIGHTHRESH)
    Serial.println("[Temp]   → RTD High Threshold");
  if (fault & MAX31865_FAULT_LOWTHRESH)
    Serial.println("[Temp]   → RTD Low Threshold");
  if (fault & MAX31865_FAULT_REFINLOW)
    Serial.println("[Temp]   → REFIN- > 0.85 x Bias");
  if (fault & MAX31865_FAULT_REFINHIGH)
    Serial.println("[Temp]   → REFIN- < 0.85 x Bias (FORCE- open)");
  if (fault & MAX31865_FAULT_RTDINLOW)
    Serial.println("[Temp]   → RTDIN- < 0.85 x Bias (FORCE- open)");
  if (fault & MAX31865_FAULT_OVUV)
    Serial.println("[Temp]   → Under/Over voltage");

  sensor.clearFault();
  return true;
}
