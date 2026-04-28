/**
 * FPS Audio EQ — Arduino Uno
 * 5 potenciómetros EQ (A0-A4) + 1 volumen (A5)
 *
 * Conexión de cada potenciómetro:
 *   Pin izquierdo → GND
 *   Pin central   → Pin analógico
 *   Pin derecho   → 5V
 */

// ── Pines (cambiar según esquemático final) ──────────────────────
const int PIN_60HZ  = A0;   // EQ: graves profundos
const int PIN_250HZ = A1;   // EQ: graves medios
const int PIN_1KHZ  = A2;   // EQ: medios
const int PIN_4KHZ  = A3;   // EQ: medios-agudos
const int PIN_8KHZ  = A4;   // EQ: agudos
const int PIN_VOL   = A5;   // Volumen master

const int  SEND_INTERVAL_MS = 50;
const int  SMOOTH           = 4;

int  eqVals[5];
int  volVal;
int  buf[6][4];
int  idx = 0;
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 6; i++)
    for (int j = 0; j < SMOOTH; j++)
      buf[i][j] = 512;
  Serial.println("{\"status\":\"FPS_EQ_READY\"}");
}

void loop() {
  if (millis() - lastSend < SEND_INTERVAL_MS) return;
  lastSend = millis();

  int raw[6] = {
    analogRead(PIN_60HZ),
    analogRead(PIN_250HZ),
    analogRead(PIN_1KHZ),
    analogRead(PIN_4KHZ),
    analogRead(PIN_8KHZ),
    analogRead(PIN_VOL)
  };

  // Suavizado por promedio
  for (int i = 0; i < 6; i++) {
    buf[i][idx % SMOOTH] = raw[i];
    long sum = 0;
    for (int j = 0; j < SMOOTH; j++) sum += buf[i][j];
    if (i < 5) eqVals[i] = sum / SMOOTH;
    else       volVal     = sum / SMOOTH;
  }
  idx++;

  // Enviar JSON: bands = ADC 0-1023, volume = 0-100
  Serial.print("{\"bands\":[");
  for (int i = 0; i < 5; i++) {
    Serial.print(eqVals[i]);
    if (i < 4) Serial.print(",");
  }
  Serial.print("],\"volume\":");
  Serial.print(map(volVal, 0, 1023, 0, 100));
  Serial.println("}");
}
