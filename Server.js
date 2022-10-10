"use strict"

const express = require("express");
const fetch = require("node-fetch")

//set up express server
const application = express();
const port = 3000;
const apiKey = "" // <- Input openweathermap.org api key here.

// values relating to information regarding days.
const numEntriesInFourDays = 40
const numEntriesPerDay = 8;
const numDays = 5;

 // Temperature values
const currTemp = { name: 'Temperature' };
const minTemp = { name: 'Minimum Temperature'};
const maxTemp = { name: 'Maximum Temperature'};
const humidity = { name: 'Humidity' };

// Weather Conditions
const weatherConditions = { name: 'Weather Conditions' };
const weatherDescription = { name: 'Weather Description'};

//Cloud Coverage
const cloudCoverage = { name: 'Cloud Coverage' };

//Wind Conditions
const windSpeed = { name: 'Wind Speed'};
const windDirection = { name: 'Wind Direction' };

//Rain Conditions
const chanceOfRain = { name: 'Chance of Rain' };


const formatWeatherJson = (weatherJson) => {
    
}

const getDailyInfo = () => {

}

application.get("/weather/:cityName", async (req, res) => {
    try {
        const location = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${req.params.cityName}&limit=1&appId=${apiKey}`);
        const locationJson = await location.json();
        const weather = 
            await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${locationJson[0].lat}&lon=${locationJson[0].lon}&appId=${apiKey}&units=metric`);
        const weatherJson = await weather.json();
        const formattedWeatherJson = formatWeatherJson(weatherJson);
        res.status(200).json(formattedWeatherJson);
    } catch {
        console.log(err);
        res.status(500).json({msg: `Internal Server Error.`})    
    }
})

application.listen(port, () => console.log(`The app is listening on port: ${port}`));
