from flask import Flask
app = Flask(__name__)

@app.route('/')
def home():
    return "¡Servidor funcionando!"

if __name__ == '__main__':
    print("🟢 Servidor iniciado!")
    app.run(host='0.0.0.0', port=5000, debug=True)