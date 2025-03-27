# The app controller for Wri-Thread with all the routes, session and app configs
import os

# from cs50 import SQL
from flask import Flask, render_template, request, redirect, flash, url_for, session, send_from_directory, jsonify
from flask_session import Session

# Configure the app
app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Open the prototype SQL database
# db = SQL("sqlite:///prototype.db")
# TODO link the prototype db through SQAlchemy
# TODO switch from prototype db to file I/O

# Routes
# TODO wrap routes requiring a loaded project

# Canvas test
@app.route("/canvas")
def canvas():
    return render_template("canvas.html")

# Default page
@app.route("/")
def index():
    # plots = db.execute("SELECT * FROM plots ORDER BY priority")
    # scenes = db.execute("SELECT * FROM scenes ORDER BY chronology")
    # narrative = db.execute("SELECT * FROM scenes JOIN narrative ON scenes.id = narrative.scene_id ORDER BY scenes.id")

    data = {
        'scenes': [
            {'title': 'Beginning. Introducing LRRH', 'scene_id': 1, 'type': 'normal', 'contents': 'LRRH sets out into the forest to bring her grandma some bread', 'pick_main': 1, 'part_of': [1]},
            {'title': 'Middle', 'scene_id': 2, 'type': 'normal', 'contents': 'Some text', 'pick_main': 1, 'part_of': [1, 2]},
            {'title': 'End', 'scene_id': 3, 'type': 'normal', 'contents': 'Lorem ipsum', 'pick_main': 2, 'part_of': [1, 2]},
        ],
        'plots': [
            {'title': 'Beginning', 'id': '1', 'colour': 'tomato', 'length': 3},
            {'title': 'Development', 'id': '2', 'colour': 'purple', 'length': 2},
        ],
    }

    # Data for testing the scripts with no pre-written scenes
    empty = {
        'scenes': [],
        'plots': [],
    }

    return render_template("index.html", title="prototype", data=empty)
    # TODO dynamically populate project info fields


# JSON request handling route
@app.route("/fetch", methods=["GET", "POST"])
def fetch():
    if request.method == "GET":
        answer = []
        return jsonify(answer)


# Scene page
@app.route("/scene", methods=["GET", "POST"])
def scene():
    if request.method == "POST":
        return redirect("/")
    else:
        return render_template("scene.html")
    

if __name__ == '__main__':
    app.run(debug=True)