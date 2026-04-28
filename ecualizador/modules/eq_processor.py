"""
modules/eq_processor.py — Lógica del ecualizador (5 bandas + volumen)
"""
from config.settings import EQ_DB_MIN, EQ_DB_MAX, ADC_MIN, ADC_MAX, PRESETS
import math

class EQProcessor:
    def __init__(self):
        self._bands: list[int] = list(PRESETS["fps"])   # 5 valores dB
        self.master_gain: int  = 100                    # 0–100 %
        self.current_preset: str = "fps"

    def get_values(self) -> list[int]:
        return list(self._bands)

    def set_band(self, index: int, value_db: int):
        if 0 <= index < len(self._bands):
            self._bands[index] = max(EQ_DB_MIN, min(EQ_DB_MAX, int(value_db)))
            self.current_preset = "custom"

    def set_band_from_adc(self, index: int, adc_value: int):
        self.set_band(index, self.adc_to_db(adc_value))

    def set_volume_from_adc(self, adc_value: int):
        """Convierte ADC 0-1023 a volumen 0-100%"""
        self.master_gain = round((max(ADC_MIN, min(ADC_MAX, adc_value)) / ADC_MAX) * 100)

    def apply_preset(self, name: str) -> bool:
        if name in PRESETS:
            self._bands = list(PRESETS[name])
            self.current_preset = name
            return True
        return False

    def reset(self):
        self._bands = [0] * 5
        self.current_preset = "flat"
        self.master_gain = 100

    @staticmethod
    def adc_to_db(adc: int) -> int:
        adc = max(ADC_MIN, min(ADC_MAX, adc))
        return round(EQ_DB_MIN + (adc / ADC_MAX) * (EQ_DB_MAX - EQ_DB_MIN))

    @staticmethod
    def db_to_linear(db: float) -> float:
        return math.pow(10, db / 20.0)
