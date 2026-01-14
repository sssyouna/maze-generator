from random import shuffle
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def make_maze(w=16, h=8):
    vis = [[0]*w + [1] for _ in range(h)] + [[1]*(w+1)]
    ver = [["v"]*w for _ in range(h)]
    hor = [["h"]*w for _ in range(h+1)]

    def walk(x, y):
        vis[y][x] = 1
        d = [(x-1,y),(x,y+1),(x+1,y),(x,y-1)]
        shuffle(d)
        for xx, yy in d:
            if vis[yy][xx]:
                continue
            if xx == x:
                hor[max(y,yy)][x] = "h0"  # open horizontal
            if yy == y:
                ver[y][max(x,xx)] = "v0"  # open vertical
            walk(xx, yy)

    walk(0, 0)

    # Entrance & exit
    hor[0][0] = "S"
    hor[h][w-1] = "E"

    # Build string with space delimiter
    s = ""
    for a, b in zip(hor, ver):
        s += ' '.join(a) + '\n'
        s += ' '.join(b) + '\n'
    return s

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    w = int(data.get('width', 16))
    h = int(data.get('height', 8))
    return jsonify({"maze": make_maze(w, h)})

if __name__ == '__main__':
    app.run(debug=True)
