# U.S. COVID-19 Dashboard

> *This project builds upon my previous U.S. COVID Response Dashboard. It utilizes machine learning to predict cases for counties that are missing from datasets, and there is a SARIMA model to predict 30-days of daily new COVID cases since the latest datapoint.*
> 
> Deployed dashboard: https://ccom20.github.io/covid-ml-application/ (Might take a minute to load.)

## Analysis

**Bottom-line Up Front**: The three-month natural immunity is falling, and the six-month natural immunity is leveling. A continued vaccination effort, along with COVID restrictions, is needed to ensure total immunity is pushed higher. 

If immunity for those infected is three months, then we are trending down in natural immunity at this time. We would have peaked in natural immunity sometime in mid-to-late February, possibly explaining why we are seeing cases trend down at the beginning of March.

If natural immunity is six months, we are starting to level off at this time, and we can expect a downward trend in natural immunity soon.

When we add those who are fully vaccinated (i.e., people who have received both doses of the vaccine), we are still trending up in estimated total immune. This is encouraging, but only puts us at 15-17% of the population immune to COVID-19. 

Now is not the time to relax restrictions. However, such relaxtions could be appropriate sometime over the summer. 

**To-Do List / Improvement List**
- [x] Automate file retrieval, cleaning, uploading to RDS with Keys
- [x] Read all data from API (Heroku)
- [x] Update Dashboard with new data and visualizations
- [x] Recalculate Estimated Immunity based on 3 and 6 month immunity
- [x] Use Machine Learning to predict cases for missing counties
- [x] Create SARIMA model to predict future cases

## Improvements

**Machine Learning Model**

There were a handful of missing counties. Data used in the model helps predict the number of cases for a given county. It looks at Population, Median Household Income, and if the county leans Democrat or Republican based on the finalized 2016 election results. These were the latest results available by the county-level from MIT.

**SARIMA Model**

The model looks at daily new cases and predicts 30-days since the latest datapoint. `Auto_arima` was used to find initial starting parameters, and then it was tweaked from there on a subset of data (following 80/20 rule for training and testing). The data was made stationary by taking the natural log. 

**Automate File Retrieval**

This mainly looks to grab files and scrape tables rather than manually downloading them. They are then written into the `/data` folder as a back-up. 

**Read Data from API**

The API can be found here: (https://ccomstock-covid-dashboard.herokuapp.com/)[https://ccomstock-covid-dashboard.herokuapp.com/]. Not all data provided in the API is used for the dashboard. There was some data that ended up being cross-correlated which needed to be discarded for the machine learning models. Nevertheless, it's still provided in the API in case anyone would like to use it for other analyses.

**Update Dashboard with Visualizations**

Most of the data is timeseries data. That being said, most of the graphs are the same, but some new charts were added, such as the 30-Day predictions chart. Additionally, users can now filter not only by state but also by counties in that state and see if there is correlation between Median Household Income and Cases.

**Estimated Immunity: 3 and 6 Month**

This is a rolling sum of cases shifted by 14 days, a little over the number of days to be considered no-longer contageous. Additionally, each esitmate adds vaccinations. 
