"use strict"

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

//set up express server
const application = express();
const port = 3000;
const apiKey = "" // <- Input openweathermap.org api key here.

// values relating to information regarding days.
const numEntriesPerDay = 8;
const numDays = 4;
const numEntriesInAllDays = numEntriesPerDay*numDays
const numEntriesPerHalfDay = (numEntriesPerDay/2)-1

const weatherMap = new Map();

// Take Json from openweather and convert to Response Map
const formatWeatherJson = async (weatherJson, aqiJson) => {
    const weatherArray = [];
    let index = 0;
    for(let i = 0; i < numEntriesInAllDays; i += numEntriesPerDay) {
        weatherArray[index] = toJson(getDailyInfo(i, weatherJson));
        index++;
    }
    weatherMap.set("city_and_country", parseCityAndCountry(weatherJson));
    weatherMap.set("days", weatherArray);
    weatherMap.set("AQI", parseAQI(aqiJson));
    return weatherMap;
}

// Get Day Info fro a given day from an openweather Json
const getDailyInfo = (index, weatherJson) => {
    const dayMap = new Map();
    dayMap.set("temperature", getTemperatureInfo(index, weatherJson));
    dayMap.set("wind", getWindInfo(index, weatherJson));
    dayMap.set("weather", getWeatherInfo(index, weatherJson));
    dayMap.set("cloud_coverage", getCloudInfo(index, weatherJson));
    dayMap.set("rainfall", getRainfallLevel(index, weatherJson))

    return dayMap;
}

// Get Temperature Information
const getTemperatureInfo = (index, weatherJson) => {
    // - Get Average Temperature for Day
    const temperatureMap = new Map()

    let averageTemp = 0;
    for(let i = index; i < (index + numEntriesPerDay); i++) {
        averageTemp += weatherJson.list[i].main.temp;
        if(i === (index+numEntriesPerDay)-1)
            averageTemp /= numEntriesPerDay;
    }
    temperatureMap.set("avg_temp", averageTemp);

    // - Get Max Temperature
    let maxTemp = - Number.MAX_VALUE;
    for(let i = index; i < (index + numEntriesPerDay); i++) {
        if(maxTemp <= weatherJson.list[i].main.temp_max)
            maxTemp = weatherJson.list[i].main.temp_max;
    }
    temperatureMap.set("max_temp", maxTemp)

    // - Get Min Temperature
    let minTemp = Number.MAX_VALUE;
    for(let i = index; i < (index + numEntriesPerDay); i++) {
        if(minTemp >= weatherJson.list[i].main.temp_min)
            minTemp = weatherJson.list[i].main.temp_min;
    }
    temperatureMap.set("min_temp", minTemp);

    // - Get average humidity
    let humidity = 0;
    for(let i = index; i < (index + numEntriesPerDay); i++) {
        humidity += weatherJson.list[i].main.humidity;
        if(i === (index + numEntriesPerDay)-1) {
            humidity /= numEntriesPerDay;
        }
    }
    temperatureMap.set("humidity", humidity);

    return temperatureMap
}

// Get Wind Information
const getWindInfo = (index, weatherJson) => {
    // - Wind Speed
    let windSpeed = 0;
    for(let i = index; i < (index + numEntriesPerDay); i++) {
        windSpeed += weatherJson.list[i].wind.speed;
        if(i === (index+numEntriesPerDay)-1)
            windSpeed /= numEntriesPerDay;
    }
    return (((windSpeed*1000)/60))
}

// Get Weather Information
const getWeatherInfo = (index, weatherJson) => {
    // - Weather type and description
    const weatherArray = [];
    const morningMap = new Map();
    const afternoonMap = new Map();
    const eveningMap = new Map();

    morningMap.set(
            "type", weatherJson.list[index].weather[0].main
        ).set(
            "description", weatherJson.list[index].weather[0].description
        );
    afternoonMap.set(
            "type", weatherJson.list[index+numEntriesPerHalfDay].weather[0].main
        ).set(
            "description", weatherJson.list[index+numEntriesPerHalfDay].weather[0].description
        );
    eveningMap.set(
            "type", weatherJson.list[index+(numEntriesPerDay-1)].weather[0].main
        ).set(
            "description", weatherJson.list[index+(numEntriesPerDay-1)].weather[0].description
        );
    
    weatherArray[0] = toJson(morningMap);
    weatherArray[1] = toJson(afternoonMap);
    weatherArray[2] = toJson(eveningMap);
    return weatherArray;
}

// Get Cloud Information
const getCloudInfo = (index, weatherJson) => {
    //Get Cloud Coverage
    let cloudCoverage = 0;
    for(let i = index; i < (index+numEntriesPerDay); i++) {
        cloudCoverage += weatherJson.list[i].clouds.all;
        if(i == (index+numEntriesPerDay)-1){
            cloudCoverage /= numEntriesPerDay;
        }
    }

    return cloudCoverage;
}
// Get Rainfall level average
const getRainfallLevel = (index, weatherJson) => {
    let rainfallLevel = 0;
    for(let i = index; i < (index+numEntriesPerDay); i++) {
        rainfallLevel += (weatherJson.list[i].rain) ? weatherJson.list[i].rain['3h'] : 0
        if(i === (index+numEntriesPerDay)-1) {
            rainfallLevel /= numEntriesPerDay;
        }
    }
    return rainfallLevel;
}

// Get AQI average TODO
const parseAQI = (aqiJson) => {
    let averageAQI = 0
    for(let i = 0; i < aqiJson.list.length; i++) {
        averageAQI += aqiJson.list[i].components.pm2_5;
    }
    return averageAQI/aqiJson.list.length;
}

// Get City and Country info
const parseCityAndCountry = (weatherJson) => {
    return `${weatherJson.city.name}, ${weatherJson.city.country}`;
}

// Convert from Map to Json
const toJson = (map = new Map) =>
    Object.fromEntries( 
        Array.from
            ( map.entries()
            , ([ k, v ]) =>
                v instanceof Map
                ? [ k, toJson(v) ]
                : [ k, v ]
            )
        );

// Server Endpoint for Weather    
application.get("/weather/:cityName", cors(), async (req, res) => {
    try {
        console.log("request received");
        const location = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${req.params.cityName}&limit=1&appId=${apiKey}`);
        const locationJson = await location.json();
        console.log("location parsed");
        const weather = 
            await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${locationJson[0].lat}&lon=${locationJson[0].lon}&appId=${apiKey}&units=metric`);
        const weatherJson = await weather.json();
        console.log("weather parsed");
        const aqi = 
            await fetch(`https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${locationJson[0].lat}&lon=${locationJson[0].lon}&appId=${apiKey}`);
        const aqiJson = await aqi.json();
        console.log("AQI Parsed");
        let formattedWeatherMap = await formatWeatherJson(weatherJson, aqiJson);
        console.log("weather formatted");        
        res.status(200).json(toJson(formattedWeatherMap));
        console.log("Response Sent");
    } catch (err) {
        console.log(err);
        res.status(500).json({msg: `Internal Server Error.`});    
    }
});

// Server Endpoint for Jokes
application.get("/the/best/jokes", cors(), async (req, res) => {
    try {
        console.log("Prepare to Laugh");
        const joke = 
            await fetch(`https://official-joke-api.appspot.com/random_joke`);
        const jokeJson = await joke.json();
        const jokeMap = new Map();
        jokeMap.set("setup", jokeJson.setup);
        jokeMap.set("punchline", jokeJson.punchline);
        res.status(200).json(toJson(jokeMap));
        console.log("Laugh Package has been sent");
    } catch (err) {
        console.log(err);
        res.status(500).json({msg: `Internal Server Error.`});
    }
});

application.listen(port, () => console.log(`The app is listening on port: ${port}`));
