from random import shuffle
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def make_maze(w=16, h=8):
    # Initialize visited array - 0 means unvisited, 1 means visited
    vis = [[0] * w for _ in range(h)]
    
    # Initialize walls - 1 means wall exists, 0 means path is open
    ver = [[1]*w for _ in range(h)]  # vertical walls between cells in same row
    hor = [[1]*w for _ in range(h+1)]  # horizontal walls between rows

    def walk(x, y):
        vis[y][x] = 1
        # Directions: left, down, right, up
        d = [(x-1,y),(x,y+1),(x+1,y),(x,y-1)]
        shuffle(d)
        for xx, yy in d:
            if xx < 0 or xx >= w or yy < 0 or yy >= h or vis[yy][xx]:
                continue
            if xx == x:  # moving vertically
                hor[max(y,yy)][x] = 0  # remove horizontal wall between cells
            if yy == y:  # moving horizontally
                ver[y][max(x,xx)] = 0  # remove vertical wall between cells
            walk(xx, yy)

    # Start DFS from top-left corner (0, 0)
    walk(0, 0)

    # Ensure entrance at top-left (remove leftmost top wall)
    hor[0][0] = 0  # entrance at top-left
    
    # Ensure exit at bottom-right (remove rightmost bottom wall)
    hor[h][w-1] = 0  # exit at bottom-right

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
    maze_array = make_maze(w, h)
    return jsonify({"maze": maze_array})

if __name__ == '__main__':
    app.run(debug=True)
