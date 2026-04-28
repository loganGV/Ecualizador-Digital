# FPS Audio EQ — Ecualizador Analógico con Interfaz Digital

## Estructura del proyecto

```
fps_equalizer/
├── main.py                     ← Punto de entrada
├── requirements.txt            ← Dependencias Python
├── config/
│   └── settings.py             ← ⚙️  Pines Arduino, puertos, presets
├── modules/
│   ├── server.py               ← Servidor Flask + WebSocket
│   ├── serial_handler.py       ← Lectura del Arduino
│   └── eq_processor.py         ← Lógica EQ (conversión ADC→dB)
├── templates/
│   └── index.html              ← Interfaz HTML principal
├── static/
│   ├── css/style.css           ← Estilos
│   └── js/
│       ├── waveform.js         ← Animación forma de onda
│       ├── eq_ui.js            ← Sliders, medidores, tabla pines
│       └── socket_client.js    ← Conexión WebSocket
├── arduino/
│   └── fps_eq.ino              ← Sketch Arduino (pines provisionales)
└── .vscode/
    ├── launch.json             ← Configuraciones de debug
    └── settings.json           ← Config del workspace
```

---

## Pasos de instalación en VS Code

### Paso 1 — Clonar / abrir el proyecto
```
Archivo → Abrir Carpeta → selecciona fps_equalizer/
```

### Paso 2 — Crear entorno virtual
Abre la terminal integrada (Ctrl+`) y ejecuta:
```bash
python -m venv .venv

# Windows:
.venv\Scripts\activate

# Linux / Mac:
source .venv/bin/activate
```

### Paso 3 — Instalar dependencias
```bash
pip install -r requirements.txt
```

### Paso 4 — Seleccionar intérprete en VS Code
```
Ctrl+Shift+P → "Python: Select Interpreter" → .venv
```

### Paso 5 — Ejecutar en modo DEMO (sin Arduino)
```bash
python main.py --demo
```
El navegador se abrirá automáticamente en http://127.0.0.1:5050

### Paso 6 — Ejecutar con Arduino real
1. Conecta el Arduino por USB
2. Abre el Arduino IDE, abre `arduino/fps_eq.ino` y súbelo
3. Identifica el puerto (ej: COM3 en Windows)
4. Edita `config/settings.py`:
   ```python
   ARDUINO_PORT = "COM3"   # ← tu puerto aquí
   ```
5. Ejecuta:
   ```bash
   python main.py --port COM3
   ```

### Paso 7 — Debug en VS Code
Usa el panel Run & Debug (Ctrl+Shift+D) y selecciona:
- `▶ FPS EQ — Modo Demo` → sin Arduino
- `▶ FPS EQ — Arduino COM3` → con Arduino en Windows

---

## Actualizar pines cuando el hardware esté listo

Edita **`config/settings.py`**:

```python
BAND_PIN_MAP = {
    0:  {"pin": "A0",    "freq": "32Hz",  "status": "ok"},
    # ... cambia los pines según tu esquemático
}
```

Y en **`arduino/fps_eq.ino`**:
```cpp
const int PIN_32HZ = A0;  // ← cambia el pin
```

---

## Protocolo Arduino → Python

El Arduino envía una línea JSON por serial cada 50ms:
```json
{"bands":[512,512,400,400,700,768,768,768,768,870]}
```
- Cada valor es ADC 10-bit: **0–1023**
- Python lo convierte automáticamente a **-12dB … +12dB**
- La UI se actualiza en tiempo real vía WebSocket
