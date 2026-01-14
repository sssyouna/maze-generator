from random import shuffle
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def make_maze(w=16, h=8):
    # Initialize visited array - 0 means unvisited, 1 means visited
    vis = [[0] * w for _ in range(h)]
    
    # Initialize walls - 1 means wall exists, 0 means path is open
    ver = [[1] * (w + 1) for _ in range(h)]  # vertical walls between cells in same row
    hor = [[1] * w for _ in range(h + 1)]  # horizontal walls between rows

    def walk(x, y):
        vis[y][x] = 1
        # Directions: left, down, right, up
        d = [(x-1,y),(x,y+1),(x+1,y),(x,y-1)]
        shuffle(d)
        for xx, yy in d:
            if xx < 0 or xx >= w or yy < 0 or yy >= h or vis[yy][xx]:
                continue
            if xx == x:  # vertical move
                hor[max(y, yy)][x] = 0  # remove horizontal wall between cells
            if yy == y:  # horizontal move
                ver[y][max(x, xx)] = 0  # remove vertical wall between cells
            walk(xx, yy)

    # Start DFS from top-left corner (0, 0)
    walk(0, 0)

    # Entrance: remove LEFT wall of start cell
    ver[0][0] = 0  # entrance at top-left
    
    # Exit: remove RIGHT wall of goal cell
    ver[h-1][w] = 0  # exit at bottom-right

    # Return the walls separately with dimensions
    return {
        "hor": hor,
        "ver": ver,
        "w": w,
        "h": h
    }

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_file(filename)

# Input validation helper functions
def clamp(value, min_val, max_val):
    return max(min_val, min(value, max_val))

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    w = clamp(int(data.get('width', 16)), 2, 30)
    h = clamp(int(data.get('height', 8)), 2, 50)
    maze_data = make_maze(w, h)
    return jsonify(maze_data)

if __name__ == '__main__':
    app.run(debug=True)
