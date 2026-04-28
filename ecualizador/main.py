"""
╔══════════════════════════════════════════════════════╗
║         FPS AUDIO EQ — PUNTO DE ENTRADA              ║
║  Arranca el servidor Flask + lector de Arduino       ║
╚══════════════════════════════════════════════════════╝
Uso:
    python main.py               → modo real (Arduino)
    python main.py --demo        → modo demo (sin Arduino)
"""

import argparse
import sys
from modules.server import create_app, socketio
from modules.serial_handler import SerialHandler
from config.settings import SERVER_HOST, SERVER_PORT, DEBUG, ARDUINO_PORT, BAUD_RATE
import webbrowser, threading, time

def open_browser():
    """Abre el navegador automáticamente tras arrancar el servidor."""
    time.sleep(1.2)
    webbrowser.open(f"http://{SERVER_HOST}:{SERVER_PORT}")

def main():
    parser = argparse.ArgumentParser(description="FPS Audio Equalizer")
    parser.add_argument("--demo", action="store_true", help="Modo demo sin Arduino")
    parser.add_argument("--port", default=ARDUINO_PORT, help="Puerto serial Arduino (ej: COM3 o /dev/ttyUSB0)")
    args = parser.parse_args()

    app = create_app()

    # ── Inicializar lector de Arduino ──────────────────────────────
    serial = SerialHandler(
        port=args.port,
        baud_rate=BAUD_RATE,
        demo_mode=args.demo,
        socketio_instance=socketio
    )
    serial.start()  # Hilo en segundo plano

    # ── Abrir navegador automáticamente ───────────────────────────
    threading.Thread(target=open_browser, daemon=True).start()

    print(f"\n  ┌─────────────────────────────────┐")
    print(f"  │  FPS EQ  →  http://{SERVER_HOST}:{SERVER_PORT}    │")
    print(f"  │  Modo: {'DEMO' if args.demo else 'Arduino ' + args.port:<24}│")
    print(f"  └─────────────────────────────────┘\n")

    socketio.run(app, host=SERVER_HOST, port=SERVER_PORT, debug=DEBUG, use_reloader=False)

if __name__ == "__main__":
    main()
