from random import shuffle
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def make_maze(w=16, h=8):
    vis = [[0]*w + [1] for _ in range(h)] + [[1]*(w+1)]
    ver = [[1]*w for _ in range(h)]
    hor = [[1]*w for _ in range(h+1)]

    def walk(x, y):
        vis[y][x] = 1
        d = [(x-1,y),(x,y+1),(x+1,y),(x,y-1)]
        shuffle(d)
        for xx, yy in d:
            if vis[yy][xx]:
                continue
            if xx == x:
                hor[max(y,yy)][x] = 0  # open horizontal
            if yy == y:
                ver[y][max(x,xx)] = 0  # open vertical
            walk(xx, yy)

    walk(0, 0)

    # Entrance & exit
    hor[0][0] = 0  # entrance
    hor[h][w-1] = 0  # exit

    # Build 2D array representation
    maze_array = []
    for i in range(len(hor)):
        if i < len(ver):
            # Add horizontal row
            maze_array.append(hor[i][:])
            # Add vertical row
            maze_array.append(ver[i][:])
        else:
            # Add the last horizontal row
            maze_array.append(hor[i][:])
    
    return maze_array

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
