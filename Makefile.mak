# Define your virtual environment and Flask app
VENV = venv
FLASK_APP = app.py

# Install dependencies and set up the virtual environment
install:
	python3 -m venv $(VENV)
	./$(VENV)/bin/pip install --upgrade pip
	./$(VENV)/bin/pip install -r requirements.txt

# Run the Flask application
run:
	./$(VENV)/bin/python $(FLASK_APP)

# Clean up the virtual environment
clean:
	rm -rf $(VENV)

# Reinstall all dependencies
reinstall: clean install