from flask import Flask, jsonify
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func
import datetime as dt
from config import endpoint, password, username, db_name

# Create the engine
engine = create_engine(f'postgresql://uscovid:{password}@{endpoint}/us_covid_db')

connection = engine.connect()

app = Flask(__name__)

# Home
@app.route("/")
def home():
    return ("<br/>"
            "Here are the available routes: <br/>"
            "<br/>"
            "/v1/state-overview<br/>")

# State Data
@app.route("/v1/state-overview")
def test():
    state_session = Session(engine)

    state_result = connection.execute("select * from master_table")

    state_session.close()

    state_info = []

    for row in state_result:
        
        state_dict = {}
        state_dict[f'{row[0]}'] = {
            "date": str(row[1]).split(" ")[0],
            "population": row[2],
            "cases": row[3],
            "deaths": row[4],
            "total_distributed": row[5],
            "total_administered": row[6],
            "percent_vaccinated": row[7],
            "est_percent_infected_to_date": row[8],
            "est_percent_immune": row[9]
        }
        
        state_info.append(state_dict)

    return jsonify(state_info)


if __name__ == "__main__":
    app.run(debug=False)