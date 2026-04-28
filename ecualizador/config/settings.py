"""
config/settings.py — Configuración central
"""

SERVER_HOST  = "127.0.0.1"
SERVER_PORT  = 5050
DEBUG        = False

ARDUINO_PORT = "/dev/cu.usbmodem1401"
BAUD_RATE    = 115200

# 5 bandas EQ: A0–A4
BAND_PIN_MAP = {
    0: {"pin": "A0", "freq": "60Hz",  "status": "ok"},
    1: {"pin": "A1", "freq": "250Hz", "status": "ok"},
    2: {"pin": "A2", "freq": "1KHz",  "status": "ok"},
    3: {"pin": "A3", "freq": "4KHz",  "status": "ok"},
    4: {"pin": "A4", "freq": "16KHz", "status": "ok"},
}

# Volumen master: A5
VOLUME_PIN = {"pin": "A5", "label": "VOLUMEN", "status": "ok"}

EQ_DB_MIN = -12
EQ_DB_MAX = +12
ADC_MIN   = 0
ADC_MAX   = 1023

PRESETS = {
    "flat":   [ 0,  0,  0,  0,  0],
    "fps":    [ 0, -1,  5,  5,  4],
    "bass":   [ 8,  5,  0, -2, -3],
    "vocal":  [-2,  1,  4,  2,  0],
    "rock":   [ 5,  2,  0,  3,  3],
    "cinema": [ 4,  1,  1,  3,  2],
}

DEMO_UPDATE_INTERVAL = 0.08
