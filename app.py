from flask import Flask, jsonify, request
from flask_cors import CORS  # Ensure CORS is imported
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for your Flask app

@app.route('/generate-dataset', methods=['GET'])
def generate_dataset():
    try:
        # Get the number of points and clusters from the query parameters
        num_points = int(request.args.get('num_points', 100))  # Default to 100 points if not specified
        k = int(request.args.get('k', 3))  # Default to 3 clusters if not specified

        # Generate random data points
        data_points = []
        for _ in range(num_points):
            point = {
                'x': random.uniform(0, 600),  # Random x-coordinate
                'y': random.uniform(0, 600)   # Random y-coordinate
            }
            data_points.append(point)

        # Return the generated dataset as a JSON response
        return jsonify({'data': data_points, 'k': k})

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
