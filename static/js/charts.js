// DATA RL CONSTANTS
const covidData = 'https://ccomstock-covid-dashboard.herokuapp.com/v2/state-overview';

// LANDING PAGE SUMMARY CARDS --- AT-A-GLANCE
function atAGlance(){

    d3.json(covidData, function(data) {

        let state_vaccinated = data.map(item => [item.state, item.doses_administered_per_100k]);
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

        // Find Doses per 100k
        state_immune.forEach((item) => {
            
            if (item[1] > stateImmuneNum) {

                stateImmune = item[0];
                stateImmuneNum = item[1]
            };
        });

        // Insert Information
        d3.select('#stateVaccinated').text(`${topVaccState} leads the way with ${topVaccinated.toLocaleString('en-US')} per 100,000 vaccinated.`)
        d3.select('#stateCases').text(`Currently, ${stateCases} has the most cases at ${stateCasesNum.toLocaleString('en-US')}.`)
   
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
        else if (mapFilter === 'Doses Administered per 100k') {
            var mapData = data.map((item) => item.doses_administered_per_100k)
        }
        else if (mapFilter === 'Vaccines Administered') {
            var mapData = data.map((item) => item.total_administered)
        }

        var data = [{
            type: "choroplethmapbox", 
            name: "US states",
            colorscale: [[0, "#BBDEF4"], [1, "#0D527C"]], 
            geojson: "https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json", 
            locations: data.map((item) => item.state_code),
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

// Immunity Chart

let estImmune = d3.select('#usImmunity');
estImmune.on("change", usImmunityChart); 

const stateData = "https://ccomstock-covid-dashboard.herokuapp.com/v2/daily-new-cases"
function usImmunityChart(){
    
    d3.json(stateData, function(data) {

        let immuneFilter = estImmune.property("value");

        if (immuneFilter === '3-Month Immunity') {
            var immuneData = data.map((item) => item.three_month_immunity)
        } 
        else if (immuneFilter === '6-Month Immunity') {
            var immuneData = data.map((item) => item.six_month_immunity)
        }
        
        var trace1 = {
            x: data.map(d => (d.date).slice(0, 12)),
            y: immuneData,
            type: 'bar',
            marker: {
                color: '#0D527C', 
            },
        };
    
        var estImmunityData = [trace1];
    
        var layout = {
            title: `U.S. Immunity Estimations by Day`,
            xaxis: {
                title: 'Date',
                automargin: true,
              },
            yaxis: {
            title: 'Total Cases',
            automargin: true,
            }
          };

        var config = {responsive: true}
    
        Plotly.newPlot('usImmunityPlot', estImmunityData, layout, config);

    });
};

usImmunityChart();

// 30 DAY PREDICTIONS
predictions = "https://ccomstock-covid-dashboard.herokuapp.com/v2/thirty-day-prediction"

function predictionsChart() {

    d3.json(predictions, function(data) {

        let dates = data.map(item => (item.date).slice(0, 12));

        var trace1 = {
            x: dates,
            y: data.map((item) => item.predicted_cases),
            type: 'lines+markers',
            mode: 'lines+markers',
            marker: {
                color: '#0D527C', 
            },
        };
    
        var timeSeriesData = [trace1];
    
        var layout = {
            title: `Predictions for the Next 30 Days`,
            xaxis: {
                title: 'Date',
                automargin: true,
              },
            yaxis: {
            title: 'Total Cases'
            }
          };

        var config = {responsive: true}
    
        Plotly.newPlot('predictedCases', timeSeriesData, layout, config);

    });

};

predictionsChart();

// US DAILY CASES CHART

function usDailyCasesSeries() {

    d3.json(stateData, function(data) {

        let dates = data.map(item => (item.date).slice(0, 12));

        var trace1 = {
            x: dates,
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
                title: 'Date',
                automargin: true,
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
    d3.json(stateData, function(data){

        var usCases = 0;
        var worstDate = "";

        data.forEach((item) => {
            
            if (item.daily_new_cases > usCases) {
                usCases = item.daily_new_cases; 
                worstDate = (item.date).slice(0, 16);
            }
        });

        var weekDate = worstDate; 

        d3.select("#worstWeek").append("p").text(`The U.S. saw the most cases on ${weekDate}.`)
    });
};

usDailyCases();

// SELECT TABLE AND FILTER
let stateTable = d3.select("#covidTable").select("tbody")
let stateFilter = d3.select("#stateFilter")
stateFilter.on("change", filteredTable);

// function callTables() {
//     filteredTable();
//     countyFilterFunc();
// };

let stateOverview = "https://ccomstock-covid-dashboard.herokuapp.com/v2/state-overview";
let countyData = "https://ccomstock-covid-dashboard.herokuapp.com/v2/county-cases-totals";


// COUNTY DRILLDOWN OPTIONS
let countyFilter = d3.select("#countyFilter")

function countyFilterFunc() {
    d3.json(countyData, function(data) {

        countyFilter.html("")

        let stateSelected = stateFilter.property('value');
    
        data.forEach(item => {
    
            if (item.state === stateSelected) {
    
                countyFilter.append('option').text(item.county)
    
            }
    
        });
    
    });
};
// countyFilterFunc(); 

// COUNTY DRILLDOWN --- BAR CHART

function countyBar() {

        d3.json(countyData, function(data) {
    
            stateSelected = stateFilter.property('value');
    
            stateData = data.filter(function(item){
                return item.state == `${stateSelected}`;         
                }); 
    
            let perVaccinated = stateData.map(item => item.percent_vaccinated);
    
            let xValue = [`${stateSelected}`];
    
            let yValue = perVaccinated;
    
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

    
            var data = [trace1];
    
            var layout = {
            title: `${stateSelected} <br /> Estimated Infection, Vaccination, and Immunity`, 
            yaxis: {
                title: '% of Total State Population'
                },
                legend: {"orientation": "h"}
            };
    
            var config = {responsive: true};
    
            // Plotly.newPlot('stateBarChart', data, layout, config);
    
        
        });
     
    };

// STATE DRILLDOWN ---- INFO TABLE
function filteredTable() {
    d3.json(covidData, function(data) {

        stateTable.html("")
        
        let stateSelected = stateFilter.property('value');
        let stateRow = stateTable.append('tr')

        let tableHeader = d3.select("#stateTableHeader").text(`${stateSelected}`)

        data.forEach(item => {

            if (item.state == stateSelected) {

                stateRow.append('td').text((item.population).toLocaleString('en-US'))
                stateRow.append('td').text((item.cases).toLocaleString('en-US'))
                stateRow.append('td').text((item.deaths).toLocaleString('en-US'))
                stateRow.append('td').text((item.total_administered).toLocaleString('en-US'))
                stateRow.append('td').text((item.doses_administered_per_100k).toLocaleString('en-US'))

            }; 

        });

    });

    countyFilterFunc();
    countyTable();
    stateScatter();

};
filteredTable();

// STATE SCATTER PLOT
function stateScatter() {
    d3.json(countyData, function(data) {

        let stateSelected = stateFilter.property('value');

        let stateData = data.filter(function(item){
            return item.state == `${stateSelected}`;         
            });

        let x = stateData.map(item => item.median_household_income);

        var trace1 = {
                    x: stateData.map(item => item.median_household_income),
                    y: stateData.map(item => item.cases_per_100k),
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Team A',
                    text: stateData.map(item => item.county),
                    marker: { size: 7 }
                };
                    
                  
        var data = [ trace1 ];
        
        var layout = {
            title:'Median Household Income and Cases by County',
            xaxis: {
                title: "Median Household Income",
            },
            yaxis: {
                title: "Cases per 100,000",
            }
        };
          
        Plotly.newPlot('stateScatterPlot', data, layout);

    });
};

// stateScatter();

// countyTableHeader
let countyHTMLTable = d3.select("#covidByCountyTable").select("tbody")
countyTable();

countyFilter.on("change", countyTable)

// County DRILLDOWN ---- INFO TABLE
function countyTable() {
    d3.json(countyData, function(data) {

        let countyHTMLTable = d3.select("#covidByCountyTable").select("tbody");

        countyHTMLTable.html("")
        
        let countySelected = countyFilter.property('value');
        let countyRow = countyHTMLTable.append('tr');
        let stateSelected = stateFilter.property('value');

        let tableHeader = d3.select("#countyTableHeader").text(`${countySelected}`)

        let stateData = data.filter(function(item){
            return item.state == `${stateSelected}`;         
            });
            
        stateData.forEach(item => {

            if (item.county == countySelected) {

                countyRow.append('td').text((item.date).toLocaleString('en-US').slice(0, 16))
                countyRow.append('td').text((item.population_estimate).toLocaleString('en-US'))
                countyRow.append('td').text((item.cases).toLocaleString('en-US'))
                countyRow.append('td').text((item.deaths).toLocaleString('en-US'))
                countyRow.append('td').text((item.median_household_income).toLocaleString('en-US'))

            }; 

        });

    });
};