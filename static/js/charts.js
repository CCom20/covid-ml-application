// DATA RL CONSTANTS
const covidData = 'https://ccomstock-covid-dashboard.herokuapp.com/v2/state-overview';
// const nytData = "./data/nyt-master.json"
// const dailyCases = "./data/daily_new_cases.json"


// LANDING PAGE SUMMARY CARDS --- AT-A-GLANCE
function atAGlance(){

    d3.json(covidData, function(data) {

        // console.log(data);

        data.forEach(item => console.log(item.state))

        let state_vaccinated = data.map(item => [item.state, item.percent_vaccinated]);
        let state_cases = data.map(item => [item.state, item.cases]);
        let state_immune = data.map(item => [item.state, item.est_percent_immune]);

        // Find State - Vaccinated
        let topVaccState = "";
        let topVaccinated = 0;  
        
        state_vaccinated.forEach((state) => {

            if (state[1] > topVaccinated) {
                topVaccinated = state[1];
                topVaccState = state[0];
            };
        });

        // Find State - Cases
        let stateCases = "";
        let stateCasesNum = 0;

        state_cases.forEach((item) => {
            
            if (item[1] > stateCasesNum) {

                stateCases = item[0];
                stateCasesNum = item[1]
            };
        });

        let stateImmune = "";
        let stateImmuneNum = 0;

        state_immune.forEach((item) => {
            
            if (item[1] > stateImmuneNum) {

                stateImmune = item[0];
                stateImmuneNum = item[1]
            };
        });

        // Insert Information
        d3.select('#stateVaccinated').text(`${topVaccState} leads the way with ${topVaccinated}% of their population vaccinated.`)
        d3.select('#stateCases').text(`Currently, ${stateCases} has the most cases at ${stateCasesNum.toLocaleString('en-US')}.`)
        d3.select('#estImmune').text(`${stateImmune} leads the way with and estimated ${stateImmuneNum}% immune.`)
   
    });
}; 

atAGlance();

// U.S. FILTERED MAP
let mapSelections = d3.select("#usChoroplet")
mapSelections.on("change", usCasesMap); 

function usCasesMap(){
    
    d3.json(covidData, function(data){

        let mapFilter = mapSelections.property("value");

        if (mapFilter === 'Cases') {
            var mapData = data.map((item) => item.cases)
        } 
        else if (mapFilter === 'Deaths') {
            var mapData = data.map((item) => item.deaths)
        }
        else if (mapFilter === 'Vaccines Distributed') {
            var mapData = data.map((item) => item.total_distributed)
        }
        // else if (mapFilter === 'Est. Percent Immune') {
        //     var mapData = data.map((item) => item.est_percent_immune)
        // }
        else if (mapFilter === 'Percent Vaccinated') {
            var mapData = data.map((item) => item.percent_vaccinated)
        }
        else if (mapFilter === 'Vaccines Administered') {
            var mapData = data.map((item) => item.total_administered)
        }
        // else if (mapFilter === 'Vaccines Distributed') {
        //     var mapData = data.map((item) => item.total_distributed)
        // }

        var data = [{
            type: "choroplethmapbox", 
            name: "US states",
            colorscale: [[0, "#BBDEF4"], [1, "#0D527C"]], 
            geojson: "https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json", 
            locations: data.map((item) => item.Abb),
            z: mapData,
            zmin: d3.min(mapData), 
            zmax: d3.max(mapData)
        }];
           
        var layout = {
            mapbox: {
                style: "streets", 
                center: {
                    lon: -98.5795, 
                    lat: 39.8283}, 
                    zoom: 3
                },
            margin:{ r: 0, t: 0, b: 0, l: 0 },
        };
        
        var config = {mapboxAccessToken: API_KEY};
        
        Plotly.newPlot('usCasesMap', data, layout, config)
         
    }); 
};

usCasesMap();

// STATE DRILLDOWN --- SELECTION OPTIONS
d3.json(covidData, function(data) {

    data.forEach(item => {

        stateFilter.append('option').text(item.state)

    });
});

// CORRELATIONS SCATTER --- VACCINATIONS AND CASES
function usScatter(){
    
    d3.json(covidData, function(data) {

        let usCases = data.map((item) => item.cases);
        let percVacc = data.map((item) => item.percent_vaccinated);
        let regressData = data.map((item) => [item.percent_vaccinated, item.cases]);
        let regressDataSorted = regressData.sort((a, b) => a[0] - b[0]);
        let regressPlot = regression.logarithmic(regressDataSorted);

        var trace1 = {
            x: percVacc,
            y: usCases,
            name: "Cases & % Vaccinated Data",
            mode: 'markers',
            type: 'scatter',
            text: data.map((item) => item.state),
            marker: {
                color: '#0D527C'
            }
          };
        
        var trace2 = {
            x: regressPlot.points.map(item => item[0]), 
            y: regressPlot.points.map(item => item[1]),
            name: "Regression Model", 
            mode: 'lines',
            type: 'scatter',
          };
        
        let layout = {
            title: "Cases vs. Percent Vaccinated",
            xaxis: {
                title: "Percent Vaccinated",
            },
            yaxis: {
                title: "Number of Cases"
            },
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
              }
        }; 
          
        var data = [trace1, trace2];

        var config = {responsive: true}; 
          
        Plotly.newPlot('usScatterPlot', data, layout, config);

    });
};

usScatter(); 

// US DAILY CASES CHART

function usDailyCasesSeries() {

    d3.json(dailyCases, function(data) {

        console.log(data);

        var trace1 = {
            x: data.map((item) => (item.date)),
            y: data.map((item) => item.daily_new_cases),
            type: 'bar',
            marker: {
                color: '#0D527C', 
            },
        };
    
        var timeSeriesData = [trace1];
    
        var layout = {
            title: `U.S. Daily Cases`,
            xaxis: {
                title: 'Date'
              },
            yaxis: {
            title: 'Total Cases'
            }
          };

        var config = {responsive: true}
    
        Plotly.newPlot('calendarChart', timeSeriesData, layout, config);

    });

};

usDailyCasesSeries();

// U.S. DAILY CASES --- WORST WEEK CARD
function usDailyCases(){
    d3.json(dailyCases, function(data){

        var usCases = 0;
        var worstDate = "";

        data.forEach((item) => {
            
            if (item.daily_new_cases > usCases) {
                usCases = item.daily_new_cases; 
                worstDate = item.date;
            }
        });

        var weekDate = worstDate.split(",")[0]; 

        d3.select("#worstWeek").append("p").text(`The U.S. saw the most cases on ${weekDate}.`)
    });
};

usDailyCases();

// SELECT TABLE AND FILTER
let table = d3.select("#covidTable").select("tbody")
let stateFilter = d3.select("#stateFilter")

// STATE DRILLDOWN ---- LINE CHART
function stateLineChart(){
    d3.json(nytData, function(data){

        stateFilter.on("change", stateLineChart); 

        let stateSelected = stateFilter.property('value');

        let stateData = data.filter(function(item){
            return item.state == `${stateSelected}`;         
            });

        var trace1 = {
            x: stateData.map(item => item.date),
            y: stateData.map(item => item.cases),
            type: 'scatter',
            marker: {
                color: '#0D527C', 
            },
        };

        var timeSeriesData = [trace1];

        var layout = {
            title: `${stateSelected} Cumulitive Cases Over Time`,
            xaxis: {
                title: 'Date',
                tickangle: 45
                },
            yaxis: {
            title: 'Total Cases'
            },
            legend: {
                x: 1,
                xanchor: 'right',
                y: 1
                }
            };

        var config = {responsive: true};


        Plotly.newPlot('stateTimeSeries', timeSeriesData, layout, config);

        filteredTable();
        stateBar(); 

    });
}; 
stateLineChart();

// STATE DRILLDOWN --- BAR CHART
function stateBar() {

    d3.json(covidData, function(data) {

        stateSelected = stateFilter.property('value');

        stateData = data.filter(function(item){
            return item.state == `${stateSelected}`;         
            }); 

        let perVaccinated = stateData.map(item => item.percent_vaccinated);
        let percInfected = stateData.map(item => item.est_percent_infected_to_date);
        let percImmune = stateData.map(item => item.est_percent_immune);

        let xValue = [`${stateSelected}`];

        let yValue = perVaccinated;
        let yValue2 = percInfected;
        let yValue3 = percImmune; 

        var trace1 = {
            x: xValue,
            y: yValue,
            type: 'bar',
            text: yValue.map(String),
            textposition: 'auto',
            hoverinfo: 'none',
            name: 'Percent Vaccinated', 
            opacity: 0.5,
            marker: {
                color: '#0089BA',
                line: {
                color: '#374955',
                width: 1.5
                }
            }
        };

        var trace2 = {
            x: xValue,
            y: yValue2,
            type: 'bar',
            text: yValue2.map(String),
            textposition: 'auto',
            hoverinfo: 'none',
            name: 'Est. Percent Infected',
            marker: {
                color: '#374955',
                line: {
                color: '#374955',
                width: 1.5
                }
            }
        };

        var trace3 = {
            x: xValue,
            y: yValue3,
            type: 'bar',
            text: yValue3.map(String),
            textposition: 'auto',
            name: 'Est. Percent Immune',
            hoverinfo: 'none',
            marker: {
                color: '#48DAA2',
                line: {
                color: '#374955',
                width: 1.5
                }
            }
        };

        var data = [trace1,trace2, trace3];

        var layout = {
        title: `${stateSelected} <br /> Estimated Infection, Vaccination, and Immunity`, 
        yaxis: {
            title: '% of Total State Population'
            },
            legend: {"orientation": "h"}
        };

        var config = {responsive: true};

        Plotly.newPlot('stateBarChart', data, layout, config);

    
    });
 
};

// STATE DRILLDOWN ---- INFO TABLE
function filteredTable() {
    d3.json(covidData, function(data) {

        table.html("")
        
        let stateSelected = stateFilter.property('value');
        let stateRow = table.append('tr')

        let tableHeader = d3.select("#stateTableHeader").text(`${stateSelected}`)

        data.forEach(item => {

            if (item.state == stateSelected) {

                stateRow.append('td').text((item.population).toLocaleString('en-US'))
                stateRow.append('td').text((item.cases).toLocaleString('en-US'))
                stateRow.append('td').text((item.deaths).toLocaleString('en-US'))
                stateRow.append('td').text((item.total_distributed).toLocaleString('en-US'))
                stateRow.append('td').text((item.total_administered).toLocaleString('en-US'))
                stateRow.append('td').text(item.percent_vaccinated)
                stateRow.append('td').text(item.est_percent_infected_to_date)
                stateRow.append('td').text(item.est_percent_immune)

            }; 

        }); 
    }); 
}; 