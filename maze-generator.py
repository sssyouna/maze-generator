from random import shuffle
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

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
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    w = int(data.get('width', 16))
    h = int(data.get('height', 8))
    maze_data = make_maze(w, h)
    return jsonify(maze_data)

if __name__ == '__main__':
    app.run(debug=True)
