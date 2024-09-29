import random
import numpy as np

class KMeans:
    def __init__(self, k, max_iterations=100):
        self.k = k
        self.max_iterations = max_iterations
        self.centroids = []
        self.labels = []

    def initialize_centroids(self, data, method='random'):
        if method == 'random':
            # Choose k random points as centroids
            self.centroids = random.sample(data, self.k)
        elif method == 'farthest':
            # Implement Farthest First initialization
            self.centroids = [random.choice(data)]
            for _ in range(1, self.k):
                distances = [min([np.linalg.norm(np.array(point) - np.array(centroid)) for centroid in self.centroids]) for point in data]
                next_centroid = data[np.argmax(distances)]
                self.centroids.append(next_centroid)
        elif method == 'kmeans++':
            # Implement KMeans++ initialization
            self.centroids = [random.choice(data)]
            for _ in range(1, self.k):
                distances = [min([np.linalg.norm(np.array(point) - np.array(centroid))**2 for centroid in self.centroids]) for point in data]
                probabilities = distances / np.sum(distances)
                cumulative_probabilities = np.cumsum(probabilities)
                random_value = random.random()
                for idx, probability in enumerate(cumulative_probabilities):
                    if random_value < probability:
                        self.centroids.append(data[idx])
                        break

    def fit(self, data):
        self.initialize_centroids(data)
        for iteration in range(self.max_iterations):
            # Step 1: Assign labels
            self.labels = [self._closest_centroid(point) for point in data]

            # Step 2: Recompute centroids
            new_centroids = []
            for i in range(self.k):
                points_in_cluster = [data[j] for j in range(len(data)) if self.labels[j] == i]
                if points_in_cluster:
                    new_centroid = np.mean(points_in_cluster, axis=0).tolist()
                    new_centroids.append(new_centroid)
                else:
                    # In case a cluster has no points, reinitialize a random centroid
                    new_centroids.append(random.choice(data))
            
            # Check for convergence (if centroids do not change)
            if np.allclose(self.centroids, new_centroids):
                break

            self.centroids = new_centroids

    def predict(self, data):
        return [self._closest_centroid(point) for point in data]

    def _closest_centroid(self, point):
        distances = [np.linalg.norm(np.array(point) - np.array(centroid)) for centroid in self.centroids]
        return np.argmin(distances)