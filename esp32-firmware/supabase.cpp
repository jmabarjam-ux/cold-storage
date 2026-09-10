#include "supabase.h"
#include "config.h"

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =============================================================
//  supabase.cpp — Implementasi HTTP POST/PATCH ke Supabase
// =============================================================

// Header yang selalu dikirim ke setiap request Supabase
static void _set_headers(HTTPClient& http) {
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SUPABASE_ANON_KEY);
  http.addHeader("Authorization", "Bearer " SUPABASE_ANON_KEY);
  http.addHeader("Prefer",        "return=representation"); // kembalikan data yg dibuat
}

// Helper: POST JSON ke endpoint tertentu, return HTTP status code
// responseBody diisi jika tidak NULL
static int _http_post(const char* endpoint, const String& body, String* responseBody = nullptr) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Supabase] WiFi tidak terhubung, skip POST");
    return -1;
  }

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/" + endpoint;
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT_MS);
  _set_headers(http);

  int statusCode = -1;
  for (int attempt = 1; attempt <= HTTP_MAX_RETRY; attempt++) {
    statusCode = http.POST(body);
    if (statusCode > 0) break;
    Serial.printf("[Supabase] POST gagal (attempt %d), retry...\n", attempt);
    delay(HTTP_RETRY_DELAY_MS);
  }

  if (responseBody != nullptr) {
    *responseBody = http.getString();
  }

  if (statusCode > 0) {
    Serial.printf("[Supabase] POST %s → HTTP %d\n", endpoint, statusCode);
  } else {
    Serial.printf("[Supabase] POST %s → Error: %s\n", endpoint, http.errorToString(statusCode).c_str());
  }

  http.end();
  return statusCode;
}

// Helper: PATCH JSON ke endpoint dengan filter query
static int _http_patch(const char* endpoint, const char* query, const String& body) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Supabase] WiFi tidak terhubung, skip PATCH");
    return -1;
  }

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/" + endpoint + "?" + query;
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT_MS);
  _set_headers(http);
  // Override Prefer untuk PATCH — tidak perlu return body
  http.addHeader("Prefer", "return=minimal");

  int statusCode = -1;
  for (int attempt = 1; attempt <= HTTP_MAX_RETRY; attempt++) {
    statusCode = http.PATCH(body);
    if (statusCode > 0) break;
    Serial.printf("[Supabase] PATCH gagal (attempt %d), retry...\n", attempt);
    delay(HTTP_RETRY_DELAY_MS);
  }

  Serial.printf("[Supabase] PATCH %s → HTTP %d\n", endpoint, statusCode);
  http.end();
  return statusCode;
}

// -------------------------------------------------------------
// Public: Insert temperature log
// -------------------------------------------------------------
bool supabase_insert_temperature(float temperature, const char* unit) {
  // Buat JSON payload
  StaticJsonDocument<128> doc;
  doc["temperature"] = serialized(String(temperature, 2));
  doc["unit"]        = unit;
  // recorded_at tidak perlu diisi — Supabase pakai default now()

  String body;
  serializeJson(doc, body);

  int status = _http_post(TABLE_TEMPERATURE, body);
  return (status == 201);
}

// -------------------------------------------------------------
// Public: Insert door open event, return record ID
// -------------------------------------------------------------
long supabase_door_open(float temperature_at_open) {
  StaticJsonDocument<128> doc;
  // opened_at tidak perlu diisi — Supabase pakai default now()
  if (!isnan(temperature_at_open)) {
    doc["temperature_at_open"] = serialized(String(temperature_at_open, 2));
  }

  String body;
  serializeJson(doc, body);

  String responseBody;
  int status = _http_post(TABLE_DOOR, body, &responseBody);

  if (status != 201) {
    Serial.println("[Supabase] Gagal insert door open");
    return -1;
  }

  // Parse ID dari response array: [{"id":123,...}]
  StaticJsonDocument<256> resp;
  DeserializationError err = deserializeJson(resp, responseBody);
  if (err || !resp.is<JsonArray>() || resp.as<JsonArray>().size() == 0) {
    Serial.printf("[Supabase] Parse response gagal: %s\n", responseBody.c_str());
    return -1;
  }

  long id = resp[0]["id"].as<long>();
  Serial.printf("[Supabase] Door open — record ID: %ld\n", id);
  return id;
}

// -------------------------------------------------------------
// Public: Update door close event
// -------------------------------------------------------------
bool supabase_door_close(long record_id, int duration_secs) {
  if (record_id <= 0) {
    Serial.println("[Supabase] record_id tidak valid, skip door close");
    return false;
  }

  // Buat timestamp closed_at dalam format ISO 8601
  // Gunakan millis-based estimation — NTP lebih baik tapi opsional
  StaticJsonDocument<128> doc;
  doc["duration_seconds"] = duration_secs;
  // closed_at: kita biarkan NULL dulu, bisa diisi via trigger Supabase
  // atau kirim timestamp jika NTP tersedia
  // doc["closed_at"] = "2026-09-10T10:00:00+00:00"; // contoh jika pakai NTP

  String body;
  serializeJson(doc, body);

  // Filter: id=eq.<record_id>
  char query[32];
  snprintf(query, sizeof(query), "id=eq.%ld", record_id);

  int status = _http_patch(TABLE_DOOR, query, body);
  return (status == 200 || status == 204);
}
