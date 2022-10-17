# reactive-internet-application
A simple web application that demonstrates the reactive capabilities of internet application using Vue.js and express.
<hr>

## Table of Contents
  - [Table of Contents](#table-of-contents)
  - [High Level Overview](#high-level-overview)
  - [Dependencies](#dependencies)
  - [Build](#build)
  - [Using The Service](#using-the-service)
<hr>

## High Level Overview
The objective of this is to develop a simple Internet Application which
demonstrates the following features:<br>
Client implementation:
<ul>
<li>A reactive client running in an Internet Browser using Vue.js</li>
<li>The client utilizes V- directives and moustache syntax</li>
<li>The client interacts with a Server-Side application using a Web API primitive.</li>
</ul>
Server implementation:
<ul>
<li>A Server-side application which exposes at least one API primitive and consumes the services of openweather API</li>
</ul>
<hr>

## Dependencies
Run npm install to install all dependencies
 ```bash
 npm install
 ```
<hr>

## Build
To build and run the server locally, use the command:
```bash
node Server.js
``` 
This creates the Server, running on port `3000`<br>
This can be accessed on `http://localhost:3000`<br>
<br>
To build and run the client locally, use the command:
```bash
open index.html
```
This will open the HTML file in your default Browser
<hr>

## Using The Service
To make api calls directly to the Locally Running Server please use the following URL:
```bash
http://localhost:3000/weather/<cityName>
```
Replacing *cityName* with the city of your choosing.
<br>
<br>
To Make Use of the Client-Side Enter the *cityName* into the search bar on the HTML page and hit the **ENTER** key.
