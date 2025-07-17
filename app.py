from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html') 

@app.route('/api/translate', methods=['POST'])
def translate():
    data = request.get_json(force=True)
    text = data.get('text')
    target_lang = data.get('target_lang')
    # Placeholder: implement translation logic here
    return jsonify({'translated_text': f'{text} (translated to {target_lang})'})

if __name__ == '__main__':
    app.run(debug=True)
