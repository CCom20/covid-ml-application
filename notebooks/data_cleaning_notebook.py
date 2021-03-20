# Import dependancies
from bs4 import BeautifulSoup as bs
from splinter import Browser
import requests
import csv
import pandas as pd
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
import datetime as dt
import matplotlib.pyplot as plt

# Get Vaccinations Table from CDC website
executable_path = {'executable_path': ChromeDriverManager().install()}
browser = Browser('chrome', **executable_path, headless=False)
browser.visit("https://covid.cdc.gov/covid-data-tracker/#vaccinations")
vaccine_html = browser.html
browser.click_link_by_id("vaccinations-table-toggle")
cdc_html = browser.html
cdc_parsed = bs(cdc_html, "html.parser")
table = cdc_parsed.select("table")
browser.quit()


# Read the CDC Vaccine HTML Table
vaccines_df = pd.read_html(str(table))[0]

# Change "New York State" to "New York" for data merging
vaccines_df.loc[vaccines_df["State/Territory/Federal Entity"] == "New York State", "State/Territory/Federal Entity"] = "New York"

# Rename "State/Territory/Federal Entity" column to "state" for data merging
vaccines_df = vaccines_df.rename(columns={"State/Territory/Federal Entity": "state"})

# Read Daily COVID-19 CSV from AWS S3 Bucket - Rearc / NY Times Data 
us_covid_cases_data = requests.get("https://covid19-lake.s3.us-east-2.amazonaws.com/rearc-covid-19-nyt-data-in-usa/csv/us-states/us-states.csv", stream=True)

# Overwrite the US COVID Data CSV with the latest one 
with open("../data/us-covid-data.csv",  "wb") as file:
    file.write(us_covid_cases_data.content)

# Read US COVID Data CSV for data merging and cleaning 
us_covid_cases_df = pd.read_csv("../data/us-covid-data.csv")

# Get yesterday's date, which is the latest data 
today = dt.date.today()
yesterday = today - dt.timedelta(days = 1)
latest_data = yesterday.strftime("%Y-%m-%d")

# Get latest total cases by state for latest date
us_total_cases_to_date_df = us_covid_cases_df.groupby(["date", "state"]).sum()
us_total_cases_to_date_df.reset_index(inplace=True)
us_total_cases_to_date_df = us_total_cases_to_date_df.loc[us_total_cases_to_date_df["date"] == latest_data]

# Read State Lat-Lon CSV and rename columns for easier cleaning and merging
state_latlons_df = pd.read_csv("../data/statelatlong.csv")
state_latlons_df.rename(columns={"State": "abbr", "Latitude": "lat", "Longitude": "lon", "City": "state"}, inplace=True)

# Read State Population CSV for cleaning and merging
state_pop_df = pd.read_csv("../data/state_populations_cleaned.csv")

# Merge, rename, and focus on defined columns
state_overview_master_df = pd.merge(state_pop_df, state_latlons_df, how="inner", on="state")
state_overview_master_df = state_overview_master_df[["state", "abbr", "lat", "lon", "population"]]

# Merge with us_total_cases_to_date_df and focus on defined columns
state_overview_master_df = pd.merge(state_overview_master_df, us_total_cases_to_date_df, how="inner", on="state")
state_overview_master_df = state_overview_master_df[["date", "state", "abbr", "lat", "lon", "population", "fips", "cases", "deaths"]]

# Merge with Vaccination data, rename columns, focus data columns
state_overview_master_df = pd.merge(state_overview_master_df, vaccines_df, how="inner", on="state")
state_overview_master_df = state_overview_master_df.rename(columns={"Total Doses Administered by State where Administered": "total_doses_administered", "Doses Administered per 100k by State where Administered": "doses_administered_per_100k"})
state_overview_master_df = state_overview_master_df[["date", "state", "abbr", "lat", "lon", "population", "fips", "cases", "deaths", "total_doses_administered", "doses_administered_per_100k"]]

# Add Empty Column for New Calculation
state_overview_master_df["percent_vaccinated"] = ""

# Calcuation for percent vaccinated by state
for index, row in state_overview_master_df.iterrows():
    population = row["population"]
    vaccinated = row["total_doses_administered"]
    percent_vaccinated = round((vaccinated / population) * 100, 2)
    
    state_overview_master_df.at[index, "percent_vaccinated"] = percent_vaccinated

# Convert percent vaccinated into a float
state_overview_master_df = state_overview_master_df.astype({"percent_vaccinated": 'float64'})

state_overview_master_df.to_csv("../data/state-master-data.csv")

state_overview_master_df["date"] = pd.to_datetime(state_overview_master_df["date"])


# County Overview Data
populations_county = pd.read_csv("../data/census-bureau-population-by-county.csv")
poverty_county = pd.read_csv("../data/poverty-and-median-household-income-data-by-us-county-2019.csv")
state_keys = pd.read_csv("../data/state-names-codes.csv")

poverty_county = poverty_county[["Postal Code", "county", "Poverty Estimate, All Ages", "Median Household Income"]]
poverty_county = poverty_county.rename(columns={"Postal Code": "code", "Poverty Estimate, All Ages": "poverty_est_all_ages", 
                                              "Median Household Income": "median_household_income"})
poverty_county["county"] = poverty_county["county"].str.rstrip()

state_keys = state_keys.rename(columns={"Code": "code", "State": "state"})
state_keys = state_keys[["state", "code"]]

poverty_county = pd.merge(poverty_county, state_keys, how="inner", on="code")
poverty_county.drop(columns={"state"}, inplace=True)

populations_county = populations_county.merge(state_keys, how="inner", on="state")
populations_county = populations_county[["code", "county", "state", "population_est"]]
populations_county["code"] = populations_county["code"].str.rstrip()
populations_county["county"] = populations_county["county"].str.rstrip()

merged_data = populations_county.merge(poverty_county, how='inner', left_on=["code", "county"], right_on=["code", "county"])

merged_data.dropna(how="any", inplace=True)

county_cases = requests.get("https://covid19-lake.s3.us-east-2.amazonaws.com/rearc-covid-19-nyt-data-in-usa/csv/us-counties/us-counties.csv", stream=True)

# Overwrite the US COVID Data CSV with the latest one 
with open("../data/county-covid-data.csv",  "wb") as file:
    file.write(county_cases.content)

# Read US COVID Data CSV for data merging and cleaning 
us_county_cases = pd.read_csv("../data/county-covid-data.csv")

us_county_cases = us_county_cases.groupby(["date", "state", "county"]).sum()
us_county_cases.reset_index(inplace=True)

us_county_cases = us_county_cases.merge(merged_data, how="left")

us_county_cases.to_csv("../data/county-cases-daily-master.csv")

us_county_cases["date"] = pd.to_datetime(us_county_cases["date"])

latest_covid_cases = us_county_cases.loc[us_county_cases["date"] == latest_data]

latest_covid_cases.dropna(how="any", inplace=True)

for index, row in latest_covid_cases.iterrows():
    latest_covid_cases.at[index, "poverty_est_all_ages"] = row["poverty_est_all_ages"].replace('.', "0")
    latest_covid_cases.at[index, "median_household_income"] = row["median_household_income"].replace('.', "0")

latest_covid_cases.fillna(0, inplace=True)

latest_covid_cases["poverty_est_all_ages"] = latest_covid_cases["poverty_est_all_ages"].astype('int64')
latest_covid_cases["median_household_income"] = latest_covid_cases["median_household_income"].astype('int64')

education_data = pd.read_csv("../data/county-level-education-stats-2015-2019.csv")

education_data.rename(columns={"state": "code"}, inplace=True)

education_data["county"] = education_data["county"].str.rstrip()

latest_covid_cases = latest_covid_cases.merge(education_data, how='outer', left_on=["code", "county"], right_on=["code", "county"])

latest_covid_cases.dropna(inplace=True)

for index, row in latest_covid_cases.iterrows():
    cases_per_100k = round((row["cases"] / row["population_est"]) * 100000)
    
    latest_covid_cases.at[index, "cases_per_100k"] = cases_per_100k

latest_covid_cases.to_csv("../data/county-cases-latest-master.csv")


daily_vaccinations = pd.read_csv("https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/us_state_vaccinations.csv")

daily_vaccs_cleaned = daily_vaccinations[["date", "location", "people_fully_vaccinated"]]

daily_vaccs_cleaned["date"] = pd.to_datetime(daily_vaccs_cleaned["date"])

daily_vaccs_cleaned.rename(columns={"location": "state"}, inplace=True)

# Convert Dates to pd.Datetimes
us_covid_cases_df["date"] = pd.to_datetime(us_covid_cases_df["date"])

us_covid_cases_df = us_covid_cases_df.merge(daily_vaccs_cleaned, how="left", left_on=["date", "state"], right_on=["date", "state"])

us_covid_cases_df.fillna(0, inplace=True)

# Create Daily New Cases Dataframe
daily_new_cases_df = us_covid_cases_df.groupby("date").sum()

daily_new_cases_df["daily_new_fully_vaccinated"] = ""

previous_day_vaccinations = 0

for index, row in daily_new_cases_df.iterrows():

    if row["people_fully_vaccinated"] == 0:
        new_vaccinations = row["people_fully_vaccinated"]
        daily_new_cases_df.at[index, "daily_new_fully_vaccinated"] = new_vaccinations
        
    else:
        new_vaccinations = row["people_fully_vaccinated"] - previous_day_vaccinations
        previous_day_vaccinations = row["people_fully_vaccinated"]
        daily_new_cases_df.at[index, "daily_new_fully_vaccinated"] = new_vaccinations

daily_new_cases_df.reset_index(inplace=True)

daily_new_cases_df[daily_new_cases_df["date"] > dt.datetime(2021, 2, 10)]

# Add new Empty Columns for Daily New Cases and Deaths
daily_new_cases_df["daily_new_cases"] = ""
daily_new_cases_df["daily_new_deaths"] = ""

previous_day_cases = 0
previous_day_deaths = 0
    
for index, row in daily_new_cases_df.iterrows():
    
    # Cases
    new_cases = row["cases"] - previous_day_cases
    previous_day_cases = row["cases"]
    daily_new_cases_df.at[index, "daily_new_cases"] = new_cases
    
    # Deaths
    new_deaths = row["deaths"] - previous_day_deaths
    previous_day_deaths = row["deaths"]
    daily_new_cases_df.at[index, "daily_new_deaths"] = new_deaths

daily_new_cases_df["new_cases_shift"] = daily_new_cases_df["daily_new_cases"].shift(periods=14)
daily_new_cases_df.fillna(0, inplace=True)

daily_new_cases_df["3_month_immunity_est"] = daily_new_cases_df["new_cases_shift"].rolling(90).sum()

daily_new_cases_df["6_month_immunity_est"] = daily_new_cases_df.rolling(180)["new_cases_shift"].sum()

daily_new_cases_df = daily_new_cases_df.fillna(0)

daily_new_cases_df[["3_month_immunity_est", "6_month_immunity_est"]].plot()

for index, row in daily_new_cases_df.iterrows():
    
    # 3-month immunity
    recovered = row["3_month_immunity_est"]
    fully_vaccinated = row["people_fully_vaccinated"]
    
    daily_new_cases_df.at[index, "3_month_immunity_est"] = recovered + fully_vaccinated
    
    # 6-month immunity
    six_recovered = row["6_month_immunity_est"]
    
    daily_new_cases_df.at[index, "6_month_immunity_est"] = six_recovered + fully_vaccinated

daily_new_cases_df[daily_new_cases_df["date"] == dt.datetime(2021, 2, 16)]

daily_new_cases_df.info()

daily_new_cases_df.to_csv("../data/state-daily-stats.csv")

# Config Variables, and SQLalchemy
from config import endpoint, username, password
from sqlalchemy import create_engine

# Connect to AWS Database instance 
engine = create_engine(f'postgresql://uscovid:{password}@{endpoint}/us_covid_db')
connection = engine.connect()

# 50 States & D.C. Data
state_overview_master_df.to_sql('master_table', index=False, if_exists='replace', con=connection)
engine.execute('ALTER TABLE master_table ADD PRIMARY KEY (state);')

# Daily Cases Data
daily_new_cases_df.to_sql("daily_new_cases", index=False, if_exists='replace', con=connection)
engine.execute('ALTER TABLE daily_new_cases ADD PRIMARY KEY (date);')

# County Data
latest_covid_cases.to_sql("county_cases_latest", index=True, if_exists='replace', con=connection)
engine.execute('ALTER TABLE county_cases_latest ADD PRIMARY KEY (index);')

# Raw NTY Data
us_covid_cases_df.to_sql('nyt_table', index=True, if_exists='replace', con=connection)
engine.execute('ALTER TABLE nyt_table ADD PRIMARY KEY (index);')