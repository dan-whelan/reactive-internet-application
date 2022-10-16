"use strict"

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

//set up express server
const application = express();
const port = 3000;
const apiKey = "57ad7a485e738ee8fce6a4c886376c48" // <- Input openweathermap.org api key here.

// values relating to information regarding days.
const numEntriesPerDay = 8;
const numDays = 5;
const numEntriesInAllDays = numEntriesPerDay*numDays
const numEntriesPerHalfDay = (numEntriesPerDay/2)-1

const weatherMap = new Map();

// Take Json from openweather and convert to Response Map
const formatWeatherJson = async (weatherJson) => {
    for(let i = 0; i < numEntriesInAllDays; i += numEntriesPerDay) {
        weatherMap.set(`day_${(i/numEntriesPerDay)+1}`, getDailyInfo(i, weatherJson));
    }
    return weatherMap;
}

// Get Day Info fro a given day from an openweather Json
const getDailyInfo = (index, weatherJson) => {
    const dayMap = new Map();
    dayMap.set("temperature", getTemperatureInfo(index, weatherJson));
    dayMap.set("wind", getWindInfo(index, weatherJson));
    dayMap.set("weather", getWeatherInfo(index, weatherJson));
    dayMap.set("cloud_coverage", getCloudInfo(index, weatherJson));

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
    return (((windSpeed*1000)/60)/60)
}

// Get Weather Information
const getWeatherInfo = (index, weatherJson) => {
    // - Weather type and description
    const dailyWeather = new Map();
    const morningMap = new Map();
    const afternoonMap = new Map();
    const eveningMap = new Map();

    dailyWeather.set("morning", morningMap.set(
            "type", weatherJson.list[index].weather[0].main
        ).set(
            "description", weatherJson.list[index].weather[0].description
        )
    ).set(
        "afternoon", afternoonMap.set(
            "type", weatherJson.list[index+numEntriesPerHalfDay].weather[0].main
        ).set(
            "description", weatherJson.list[index+numEntriesPerHalfDay].weather[0].description
        )
    ).set(
        "evening", eveningMap.set(
            "type", weatherJson.list[index+(numEntriesPerDay-1)].weather[0].main
        ).set(
            "description", weatherJson.list[index+(numEntriesPerDay-1)].weather[0].description
        )
    );

    return dailyWeather;
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
// const getRainfallLevel = (index, weatherJson) => {
//     let rainfallLevel = 0;
//     for(let i = index; i < (index+numEntriesPerDay); i++) {
//         rainfallLevel += weatherJson.list[i].rain.3h;
//         if(i === (index+numEntriesPerDay)-1) {
//             rainfallLevel /= numEntriesPerDay;
//         }
//     }
    
//     return rainfallLevel;
// }

// Convert from Map to Json
const toJson = (map = new Map) =>
    Object.fromEntries
        ( Array.from
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
        const formattedWeatherMap = await formatWeatherJson(weatherJson);
        console.log("weather formatted");
        res.status(200).json(toJson(formattedWeatherMap));
        console.log("Response Sent");
    } catch (err) {
        console.log(err);
        res.status(500).json({msg: `Internal Server Error.`});    
    }
});

application.listen(port, () => console.log(`The app is listening on port: ${port}`));
