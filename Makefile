# Define your virtual environment and Flask app
VENV = venv
FLASK_APP = app.py

# Install dependencies and set up the virtual environment
install:
	python3 -m venv $(VENV)
	./$(VENV)/bin/pip install --upgrade pip
	./$(VENV)/bin/pip install -r requirements.txt

# Run the Flask application using flask run
run:
	./$(VENV)/bin/pip install flask  # Ensure Flask is installed
	FLASK_APP=$(FLASK_APP) ./$(VENV)/bin/flask run --host=0.0.0.0 --port=3000

# Clean up the virtual environment
clean:
	rm -rf $(VENV)

# Reinstall all dependencies
reinstall: clean install
