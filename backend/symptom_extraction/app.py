from flask import Flask, request, jsonify
from flask_cors import CORS  # Add this import
import spacy
from spacy.matcher import PhraseMatcher

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load spaCy model and initialize matcher
nlp = spacy.load("en_core_web_sm")

SYMPTOM_LIST = [
    "fever", "cough", "headache", "sore throat", "nausea", "fatigue", "shortness of breath",
    "chills", "vomiting", "diarrhea", "dizziness", "rash", "congestion", "runny nose", "muscle pain",
    "chest pain", "abdominal pain", "joint pain", "back pain", "ear pain", "eye pain", "blurred vision",
    "loss of appetite", "weight loss", "weight gain", "night sweats", "sneezing", "itching", "swelling",
    "palpitations", "fainting", "difficulty swallowing", "hoarseness", "bloody nose", "bloody stools",
    "constipation", "heartburn", "bloating", "gas", "indigestion", "frequent urination", "painful urination",
    "blood in urine", "yellowing of skin", "yellowing of eyes", "dry mouth", "dry eyes", "sensitivity to light",
    "ear ringing", "hearing loss", "coughing up blood", "wheezing", "difficulty breathing", "loss of taste",
    "loss of smell", "tingling", "numbness", "seizures", "memory loss", "confusion", "anxiety", "depression",
    "irritability", "insomnia", "bruising easily", "hair loss", "cold hands", "cold feet", "hot flashes",
    "excessive sweating", "dehydration", "leg cramps", "nosebleeds", "red eyes", "watery eyes", "chest tightness",
    "skin discoloration", "lump", "sores that don't heal", "vomiting blood", "rectal pain", "anal itching",
    "urinary incontinence", "sexual dysfunction", "menstrual irregularities", "heavy menstrual bleeding",
    "pelvic pain", "breast pain", "breast lump", "difficulty concentrating", "restlessness", "trouble sleeping",
    "balance problems", "speech difficulties", "trouble hearing", "vision loss", "double vision", "skin peeling",
    "mouth ulcers", "bad breath", "swollen glands", "neck stiffness", "jaw pain", "shoulder pain", "hip pain",
    "knee pain", "foot pain", "hand pain", "burning sensation", "pressure in chest", "loss of coordination",
    "feeling faint", "pale skin", "flushing", "abnormal heart rhythm", "increased thirst", "increased hunger",
    "dark urine", "light-colored stools", "pain during sex", "abnormal vaginal discharge", "abnormal penile discharge",
    "itchy scalp", "cracked lips", "skin bumps", "skin ulcers", "difficulty speaking", "drooping face", "new mole",
    "changing mole", "spasms", "hiccups", "difficulty breathing at night", "trouble waking up", "feeling cold",
    "feeling hot", "irregular heartbeat", "slow heartbeat", "fast heartbeat"
]

matcher = PhraseMatcher(nlp.vocab)
matcher.add("SYMPTOMS", [nlp.make_doc(symptom) for symptom in SYMPTOM_LIST])

@app.route('/extract-symptoms', methods=['POST'])
def extract_symptoms():
    data = request.get_json()
    transcript = data.get('transcript', '')
    doc = nlp(transcript)
    symptoms = list(set(doc[start:end].text.lower() for _, start, end in matcher(doc)))
    return jsonify({'symptoms': symptoms})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002, debug=True)  # Change host to '0.0.0.0'