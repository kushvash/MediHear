def extract_symptoms(text):
    keywords = ['fever', 'cough', 'headache', 'nausea', 'fatigue', 'pain', 'sore throat']
    return [kw for kw in keywords if kw in text.lower()]