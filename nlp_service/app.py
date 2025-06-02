from symptom_extractor import extract_symptoms

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/extract', methods=['POST'])
def extract():
    data = request.json
    text = data.get('text', '')
    symptoms = extract_symptoms(text)
    return jsonify({"symptoms": symptoms})

if __name__ == '__main__':
    app.run(port=5001)