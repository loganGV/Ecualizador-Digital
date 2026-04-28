"""
modules/server.py — Flask + SocketIO
"""
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
from config.settings import PRESETS, BAND_PIN_MAP, VOLUME_PIN
from modules.eq_processor import EQProcessor
import logging

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")
eq = EQProcessor()

def create_app() -> Flask:
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config["SECRET_KEY"] = "fps-eq-2024"
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    socketio.init_app(app)
    _routes(app)
    _sockets()
    return app

def _routes(app):
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/api/state")
    def state():
        return jsonify({
            "bands":   eq.get_values(),
            "volume":  eq.master_gain,
            "preset":  eq.current_preset,
            "pins":    {str(k): v for k, v in BAND_PIN_MAP.items()},
            "vol_pin": VOLUME_PIN,
        })

def _sockets():
    @socketio.on("connect")
    def on_connect():
        emit("eq_update", {"bands": eq.get_values(), "volume": eq.master_gain, "preset": eq.current_preset})

    @socketio.on("set_band")
    def on_band(data):
        eq.set_band(int(data["band"]), int(data["value"]))
        emit("eq_update", {"bands": eq.get_values(), "volume": eq.master_gain}, broadcast=True)

    @socketio.on("set_volume")
    def on_volume(data):
        eq.master_gain = max(0, min(100, int(data.get("volume", 100))))
        emit("eq_update", {"bands": eq.get_values(), "volume": eq.master_gain}, broadcast=True)

    @socketio.on("apply_preset")
    def on_preset(data):
        eq.apply_preset(data.get("preset", "flat"))
        emit("eq_update", {"bands": eq.get_values(), "volume": eq.master_gain, "preset": eq.current_preset}, broadcast=True)
