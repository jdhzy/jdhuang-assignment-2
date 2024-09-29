// Attach event listeners to buttons
document.getElementById('generate-data').addEventListener('click', generateDataset);
document.getElementById('converge').addEventListener('click', goToConvergence);
document.getElementById('reset').addEventListener('click', reset);
document.getElementById('init-method').addEventListener('change', setInitializationMethod);
document.getElementById('num-clusters').addEventListener('change', updateNumClusters);

let dataPoints = [];
let centroids = [];
let k = parseInt(document.getElementById('num-clusters').value);  // Initialize k with the input value

// Update k when the user changes the input value
function updateNumClusters() {
    k = parseInt(document.getElementById('num-clusters').value);
}

// Generate random dataset on page load
window.onload = function() {
    generateDataset();
};


// Generate a new dataset using the Python backend
function generateDataset() {
    const numPoints = 100; // Number of data points
    const k = parseInt(document.getElementById('num-clusters').value); // Get the number of clusters

    // Fetch the dataset from the Python backend with the parameters
    fetch(`http://172.16.100.5:3000/generate-dataset?num_points=${numPoints}&k=${k}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch dataset');
            return response.json();
        })
        .then(data => {
            dataPoints = data.data;  // Update the data points with the fetched dataset
            console.log("Fetched Data Points:", dataPoints); // Log fetched data points
            setInitializationMethod();  // Initialize centroids based on the selected method
            visualizeData();  // Call the visualization function
        })
        .catch(error => console.error('Error fetching dataset:', error));
}

// Set the chosen initialization method
function setInitializationMethod() {
    const method = document.getElementById('init-method').value;
    const k = parseInt(document.getElementById('num-clusters').value); // Ensure we use the updated number of clusters

    centroids = [];

    if (method === 'random') {
        for (let i = 0; i < k; i++) {
            const randomPoint = dataPoints[Math.floor(Math.random() * dataPoints.length)];
            centroids.push({ x: randomPoint.x, y: randomPoint.y });
        }
    } else if (method === 'kmeans++') {
        initializeKMeansPlusPlus(k)
    } else if (method === 'farthest') {
        initializeFarthestFirst(k)
    } else if (method === 'manual') {
        addManualCentroidSelection()
    }

    visualizeData(); // Always visualize the updated centroids
}

// Allow manual selection of centroids
function addManualCentroidSelection() {
    const svg = d3.select("#plot-area").on("click", function(event) {
        const [x, y] = d3.pointer(event);
        if (centroids.length < k) {
            centroids.push({ x, y });
            visualizeData();
        }
    });
}

//Allow using Kmeans++
function initializeKMeansPlusPlus(k) {
    // Select the first centroid randomly
    const firstCentroid = dataPoints[Math.floor(Math.random() * dataPoints.length)];
    centroids.push({ x: firstCentroid.x, y: firstCentroid.y });

    // Select the remaining k - 1 centroids
    for (let i = 1; i < k; i++) {
        const distances = dataPoints.map(point => {
            // Find the nearest existing centroid for each point
            const nearestDistance = Math.min(...centroids.map(centroid => {
                return Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2);
            }));
            return nearestDistance;
        });

        // Choose the next centroid with probability proportional to the squared distance
        const totalDistance = distances.reduce((sum, d) => sum + d, 0);
        let randomValue = Math.random() * totalDistance;
        for (let j = 0; j < dataPoints.length; j++) {
            randomValue -= distances[j];
            if (randomValue <= 0) {
                centroids.push({ x: dataPoints[j].x, y: dataPoints[j].y });
                break;
            }
        }
    }

    visualizeData();
}

function initializeFarthestFirst(k) {
    // Select the first centroid randomly
    const firstCentroid = dataPoints[Math.floor(Math.random() * dataPoints.length)];
    centroids.push({ x: firstCentroid.x, y: firstCentroid.y });

    // Select the remaining k - 1 centroids
    for (let i = 1; i < k; i++) {
        let farthestPoint = null;
        let maxDistance = -1;

        // Find the point farthest from any existing centroid
        dataPoints.forEach(point => {
            const nearestDistance = Math.min(...centroids.map(centroid => {
                return Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2);
            }));

            if (nearestDistance > maxDistance) {
                maxDistance = nearestDistance;
                farthestPoint = point;
            }
        });

        if (farthestPoint) {
            centroids.push({ x: farthestPoint.x, y: farthestPoint.y });
        }
    }

    visualizeData();
}

let currentIteration = 0;
const maxIterations = 100; // Maximum iterations to avoid infinite loops
let hasConverged = false;  // Flag to check for convergence

function stepThrough() {
    if (hasConverged) {
        alert("KMeans algorithm has already reached convergence.");
        return;
    }

    console.log("Stepping through iteration:", currentIteration);
    
    if (currentIteration >= maxIterations) {
        alert("Reached maximum iterations without convergence.");
        return;
    }

    // Store current centroids for comparison
    const previousCentroids = JSON.parse(JSON.stringify(centroids));

    // Step 1: Assign each data point to the nearest centroid
    dataPoints.forEach(point => {
        let minDistance = Infinity;
        let assignedCluster = -1;

        centroids.forEach((centroid, index) => {
            const distance = Math.sqrt(Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2));
            if (distance < minDistance) {
                minDistance = distance;
                assignedCluster = index;
            }
        });

        point.cluster = assignedCluster;
    });

    // Step 2: Recompute centroids based on the mean position of assigned points
    centroids = centroids.map((centroid, index) => {
        const pointsInCluster = dataPoints.filter(point => point.cluster === index);
        
        if (pointsInCluster.length > 0) {
            const meanX = d3.mean(pointsInCluster, d => d.x);
            const meanY = d3.mean(pointsInCluster, d => d.y);
            return { x: meanX, y: meanY };
        }
        
        return centroid;
    });

    // Check for convergence: Compare old and new centroids
    hasConverged = centroids.every((centroid, index) => {
        return centroid.x === previousCentroids[index].x && centroid.y === previousCentroids[index].y;
    });

    if (hasConverged) {
        alert("KMeans algorithm has reached convergence!");
    }

    // Update the visualization to show the updated centroids and data point assignments
    visualizeData();

    // Increment the iteration counter
    currentIteration++;
}

// Ensure the "Step Through K Means" button is connected
document.getElementById('step-through').addEventListener('click', stepThrough);

function goToConvergence() {
    console.log("Running KMeans to convergence...");

    let iteration = 0;
    const maxIterations = 100; // Set a limit to avoid infinite loops
    hasConverged = false; // Ensure the convergence flag is reset

    // Run the KMeans steps until convergence or reaching the max iterations
    while (iteration < maxIterations && !hasConverged) {
        // Store current centroids for comparison
        const previousCentroids = JSON.parse(JSON.stringify(centroids));

        // Step 1: Assign each data point to the nearest centroid
        dataPoints.forEach(point => {
            let minDistance = Infinity;
            let assignedCluster = -1;

            centroids.forEach((centroid, index) => {
                const distance = Math.sqrt(Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    assignedCluster = index;
                }
            });

            point.cluster = assignedCluster;
        });

        // Step 2: Recompute centroids based on the mean position of assigned points
        centroids = centroids.map((centroid, index) => {
            const pointsInCluster = dataPoints.filter(point => point.cluster === index);
            
            if (pointsInCluster.length > 0) {
                const meanX = d3.mean(pointsInCluster, d => d.x);
                const meanY = d3.mean(pointsInCluster, d => d.y);
                return { x: meanX, y: meanY };
            }
            
            return centroid;
        });

        // Check for convergence: Compare old and new centroids
        hasConverged = centroids.every((centroid, index) => {
            return centroid.x === previousCentroids[index].x && centroid.y === previousCentroids[index].y;
        });

        iteration++;
        if (hasConverged) {
            console.log(`KMeans algorithm reached convergence after ${iteration} iterations`);
            break;
        }
    }

    // Display the final result once convergence is reached
    visualizeData();

    // Use setTimeout to delay the alert slightly, ensuring it appears after the graph updates
    setTimeout(() => {
        if (hasConverged) {
            alert(`KMeans algorithm has reached convergence after ${iteration} iterations!`);
        } else {
            alert("KMeans algorithm reached the maximum number of iterations without complete convergence.");
        }
    }, 100); // Adjust the delay time if needed
}
       
function updateCentroids() {
    // Get the selected initialization method
    const method = document.getElementById('init-method').value;
    
    // Update the centroids based on the selected method
    centroids = [];
    
    if (method === 'random') {
        // Reinitialize centroids with the new number
        for (let i = 0; i < parseInt(document.getElementById('num-clusters').value); i++) {
            const randomPoint = dataPoints[Math.floor(Math.random() * dataPoints.length)];
            centroids.push({ x: randomPoint.x, y: randomPoint.y });
        }
    } else {
        // Call the `setInitializationMethod` function to handle other methods
        setInitializationMethod();
    }

    // Redraw the data points and centroids
    visualizeData();
}



//Reset
function reset() {
    // Reset centroids but keep the existing data points
    centroids = [];
    
    // Reset iteration counters and flags
    currentIteration = 0;
    hasConverged = false;

    // Clear the cluster assignments from the data points (removing their colors)
    dataPoints = dataPoints.map(point => ({ x: point.x, y: point.y }));

    // Reinitialize centroids according to the current initialization method and the number of clusters
    updateCentroids();

    console.log("Reset the KMeans centroids and cleared data point colors");
}

// Ensure the "Reset" button is connected to the reset function
document.getElementById('reset').addEventListener('click', reset);


function visualizeData() {
    console.log("Visualizing Data Points:", dataPoints);
    console.log("Visualizing Centroids:", centroids);

    // Define the size of the SVG container
    const width = 600;
    const height = 600;

    // Create or select the SVG container
    const svg = d3.select("#plot-area").selectAll("svg").data([null]);
    const svgEnter = svg.enter().append("svg")
        .attr("width", width)
        .attr("height", height)
        .merge(svg);

    svgEnter.html(""); // Clear existing content

    // Draw data points
    svgEnter.selectAll("circle")
        .data(dataPoints)
        .enter()
        .append("circle")
        .attr("cx", d => d.x) // Use raw x values
        .attr("cy", d => d.y) // Use raw y values
        .attr("r", 5)
        .attr("fill", d => {
            const colors = ["gray", "blue", "green", "orange", "purple", "pink", "cyan", "yellow", "brown", "red"];
            return d.cluster !== undefined ? colors[d.cluster % colors.length] : "gray";
        });

    // Draw centroids
    svgEnter.selectAll("rect")
        .data(centroids)
        .enter()
        .append("rect")
        .attr("x", d => d.x - 5) // Adjust x-position to center the square
        .attr("y", d => d.y - 5) // Adjust y-position to center the square
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", "red")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5);
}