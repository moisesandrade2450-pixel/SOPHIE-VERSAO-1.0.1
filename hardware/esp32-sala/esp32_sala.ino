/*
 * SOPHIE — Caixinha de aviso por sala (ESP32)
 *
 * Consulta o último aviso da sala no Supabase e toca um bip quando chega um novo.
 * Não usa Bluetooth no PC do telão — só Wi-Fi da escola.
 *
 * Dependências (Arduino Library Manager):
 *   - ArduinoJson by Benoit Blanchon
 *
 * Placa: ESP32 Dev Module
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#if __has_include("config.h")
#include "config.h"
#else
#error "Crie config.h a partir de config.h.example"
#endif

#ifndef POLL_INTERVAL_MS
#define POLL_INTERVAL_MS 2000
#endif

String lastAvisoId;

void playChime() {
  const int notes[] = {880, 1175, 1568};
  for (int n = 0; n < 3; n++) {
    tone(BUZZER_PIN, notes[n], 180);
    delay(200);
    noTone(BUZZER_PIN);
    delay(40);
  }
}

bool fetchLatestAviso(String& outId) {
  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/avisos?select=id&"
               "sala_id=eq." + String(SALA_ID) + "&order=created_at.desc&limit=1";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  int code = http.GET();
  if (code != 200) {
    Serial.printf("HTTP erro: %d\n", code);
    http.end();
    return false;
  }

  String payload = http.getString();
  http.end();

  JsonDocument doc;
  if (deserializeJson(doc, payload)) {
    Serial.println("JSON inválido");
    return false;
  }

  if (!doc.is<JsonArray>() || doc.size() == 0) {
    return false;
  }

  outId = doc[0]["id"].as<String>();
  return outId.length() > 0;
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.printf("\nConectado. Sala %d\n", SALA_ID);

  String id;
  if (fetchLatestAviso(id)) {
    lastAvisoId = id;
    Serial.println("Último aviso sincronizado (sem tocar).");
  }
}

void loop() {
  String id;
  if (fetchLatestAviso(id) && id.length() > 0) {
    if (lastAvisoId.length() == 0) {
      lastAvisoId = id;
    } else if (id != lastAvisoId) {
      Serial.println("Novo aviso!");
      lastAvisoId = id;
      playChime();
    }
  }
  delay(POLL_INTERVAL_MS);
}
