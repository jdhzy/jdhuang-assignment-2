# Install dependencies
install'
python3 -m venv venv
.venv/bin/activate && pip install -r requirements.txt

# Run the Flask app on port 3000
run:
venv/bin/activate && flask run --host=0.0.0.0 --port=3000
