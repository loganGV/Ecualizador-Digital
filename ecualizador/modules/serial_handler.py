"""
modules/serial_handler.py
Protocolo Arduino → Python:
  {"bands":[v0,v1,v2,v3,v4], "vol": v5}
  donde cada valor es ADC 0-1023
"""
import threading, json, math, time, logging
from config.settings import DEMO_UPDATE_INTERVAL

logger = logging.getLogger("serial_handler")
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

class SerialHandler:
    def __init__(self, port, baud_rate, demo_mode, socketio_instance):
        self.port      = port
        self.baud_rate = baud_rate
        self.demo_mode = demo_mode
        self.sio       = socketio_instance
        self._running  = False
        self._thread   = None
        self._serial   = None

    def start(self):
        self._running = True
        target = self._demo_loop if self.demo_mode else self._serial_loop
        self._thread = threading.Thread(target=target, daemon=True)
        logger.info(f"SerialHandler → {'DEMO' if self.demo_mode else self.port}")
        self._thread.start()

    def stop(self):
        self._running = False
        if self._serial and self._serial.is_open:
            self._serial.close()

    def _serial_loop(self):
        try:
            import serial
        except ImportError:
            logger.error("Instala pyserial: pip install pyserial")
            return

        while self._running:
            try:
                self._serial = serial.Serial(self.port, self.baud_rate, timeout=1)
                logger.info(f"✓ Arduino en {self.port}")
                while self._running:
                    raw = self._serial.readline().decode("utf-8", errors="ignore").strip()
                    if raw:
                        self._process_line(raw)
            except Exception as e:
                logger.warning(f"Serial error: {e} — reintentando en 3s")
                time.sleep(3)

    def _process_line(self, raw: str):
        try:
            data = json.loads(raw)
            from modules.server import eq

            bands = data.get("bands", [])
            if len(bands) == 5:
                for i, adc in enumerate(bands):
                    eq.set_band_from_adc(i, int(adc))

            if "vol" in data:
                eq.set_volume_from_adc(int(data["vol"]))

            self.sio.emit("eq_update", {
                "bands":  eq.get_values(),
                "volume": eq.master_gain,
                "source": "arduino"
            })
        except (json.JSONDecodeError, ValueError):
            pass

    def _demo_loop(self):
        t = 0.0
        while self._running:
            bands = [round(math.sin(t * 0.7 + i * 0.9) * 6) for i in range(5)]
            volume = round(50 + math.sin(t * 0.2) * 40)
            self.sio.emit("eq_update", {
                "bands":  bands,
                "volume": volume,
                "source": "demo"
            })
            t += 0.1
            time.sleep(DEMO_UPDATE_INTERVAL)
