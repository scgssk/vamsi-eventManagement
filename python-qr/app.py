# app.py
import os
import hmac
import hashlib
import json
from flask import Flask, request, jsonify
import qrcode
from io import BytesIO
import base64

app = Flask(__name__)
QR_SHARED_SECRET = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"

def verify(signed):
    payload = signed.get('payload')
    signature = signed.get('signature')
    if payload is None or signature is None:
        return False
    payload_json = json.dumps(payload, separators=(',', ':'), sort_keys=False)
    mac = hmac.new(QR_SHARED_SECRET.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, signature)

@app.route('/health')
def health():
    return jsonify({'ok': True})

@app.route('/generate_qr', methods=['POST'])
def generate_qr():
    body = request.get_json()
    signed = body.get('data')
    if not signed:
        return jsonify({'error': 'data required'}), 400
    if not verify(signed):
        return jsonify({'error': 'invalid signature'}), 400

    # We will encode the signed object as JSON in the QR (so scanner can decode)
    qr_payload = json.dumps(signed, separators=(',', ':'))
    img = qrcode.make(qr_payload)

    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    data_uri = f"data:image/png;base64,{img_b64}"
    return jsonify({'pngDataUri': data_uri})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))
