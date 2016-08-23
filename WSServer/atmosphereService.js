// WebSocket Variables
var http = require('http');
const request = require('request');
var WebSocketServer = require('websocket').server;
var webSocketsServerPort = 8002;
var clients = new Array();

var cities = {};
cities['8k']     = {}, cities['8k'].id = 2624652;
cities['Cph']    = {}, cities['Cph'].id = 2618425;
cities['Ry']     = {}, cities['Ry'].id = 2614387;
cities['Odense'] = {}, cities['Odense'].id = 2615876;

var lightType = ['drizzle','light'];
var heavyType = ['heavy','shower','extreme','freezing','ragged'];

var openweathermapAPIKey = "a3db4cff42becb040d3673f6ef1e3e1b";


function setupWSServer() {
	// Set up WebSocket Server
	

	var server = http.createServer(function(request, response) {
	    // process HTTP request. Since we're writing just WebSockets server
	    // we don't have to implement anything.
	});

	server.listen(webSocketsServerPort, function() { 
	    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
	});

	// create the server
	wsServer = new WebSocketServer({
	    httpServer: server
	});

	// WebSocket server
	wsServer.on('request', function(request) {
	    console.log((new Date()) + ' Connection from origin ' + request.origin);
	    var conn = request.accept(null, request.origin);

	    conn.on('message', function(message) {
	    	obj = JSON.parse(message.utf8Data);
	    	console.log(obj);
	        // if (message.type === 'utf8') {
        	if(obj.type == "SETUP") {
	        	clients.forEach(function(client){
	        		
	        		if(client.id == obj.id) {
	        			console.log("setting city value of client");
	        			client.city = obj.data.city;
	        			sendWeatherDataToClient(client);
	        			sendTimeDataToClient(client);
	        		}
	        	});

	        } else if(obj.type == "close") {
	        	var index = -1;
	        	clients.forEach(function(client) {
	        		if(client.id == obj.id) {
	        			index = clients.indexOf(client);
	        		}
	        	});

	        	clients.splice(index, 1);
	        }
	        // }
	    });

	    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    		return v.toString(16);
		});

	    conn.on('close', function(reasonCode, description) {
	    	
	    });

	    conn.sendUTF(JSON.stringify({
	    	type:"setup",
			id:id
		}));

	    var client = {
	    	conn:conn,
	    	id:id,
	    	city:null
	    }
	    clients.push(client);

	    console.log("clients length = " + clients.length + " and has id = " + id);
	});
}


function getCurrentWeatherForCity(city){
	
	var id = cities[city]['id'];
	var url = "http://api.openweathermap.org/data/2.5/weather?id="+id+"&units=metric&appid=" + openweathermapAPIKey;
	
	request(url, (error, response, body)=> {
	  	if (!error && response.statusCode === 200) {
	    	const fbResponse = JSON.parse(body);
	    	console.log(fbResponse);
	    	//atm we only support rain and snow, so we only look for that. could be expanded at a later time based on: http://openweathermap.org/weather-conditions
	    	const weather = fbResponse.weather;
	    	if(weather == undefined)
	    		return;
	    	console.log(new Date()+": Got weather for "+city+":");
	    	//console.log(weather);
	    	let newWeatherType = extrapolateWeatherType(weather);
	    	let newWeatherSeverity = extrapolateWeatherSeverity(weather);
	    	let timeInfo = extrapolateTimeInfo(fbResponse);

	    	let cityObj = cities[city];
	    	if((!cityObj.weatherType || cityObj.weatherType!==newWeatherType) || (!cityObj.weatherSeverity || cityObj.weatherSeverity!==newWeatherSeverity) || (!cityObj.timeInfo || cityObj.timeInfo!==timeInfo)){
	    		cityObj.weatherType = newWeatherType;
	    		cityObj.weatherSeverity = newWeatherSeverity;
	    		cityObj.timeInfo = timeInfo;
	    		//send update to relevant clients
	    		clients.forEach(function(client){
	    			if(client.city===city){
	    				sendWeatherDataToClient(client);
	    				console.log("Sending..");
	    				sendTimeDataToClient(client);
	    			}
	    		});
	    	}
	    	//console.log("Got a response: ", fbResponse.weather[0])

	  	} else {
	    	console.log("Got an error: ", error, ", status code: ")
	  	}
	});
}

function getWeatherForAllCities(){
	for(var city in cities){
		getCurrentWeatherForCity(city);
	}
}

function getRandWeather(){
	var types = ["rain","snow","clear"];
	var type = types[Math.floor(Math.random() * 3)];
	return type;
}

function getRandWeatherAmount(){
	var types = ["light","middle","heavy"];
	var type = types[Math.floor(Math.random() * 3)];
	return type;
}


/*
* based on this list:http://openweathermap.org/weather-conditions
* we try and extrapolate a weather feature to be shown.
* at the moment, the clients only support rain and snow, so we only look for statues prefixed with 3xx (drizzle), 
* 5xx (rain) and 6xx (snow)
*/
function extrapolateWeatherType(weather){

	var weatherId = weather[0].id;

	var drizzleRegExp = /^3[0-9].*$/
	var rainRegExp = /^5[0-9].*$/
	var snowRegExp = /^6[0-9].*$/

	var weatherType;
	if(rainRegExp.test(weatherId)){
		weatherType = "rain";

	}else if(snowRegExp.test(weatherId)){
		weatherType = "snow";
	}else if(drizzleRegExp.test(weatherId)){
		weatherType = "rain";
	}else{
		weatherType = "clear";
	}

	return weatherType;
}


function extrapolateWeatherSeverity(weather){
	var weatherDescription = weather[0].description;
	
	var serverity = "middle"
	for(var i =0; i<lightType.length; i++){
		if(weatherDescription.indexOf(lightType[i])!=-1){
			serverity = "light";
			break;
		}
	}

	for(var i =0; i<heavyType.length; i++){
		if(weatherDescription.indexOf(heavyType[i])!=-1){
			serverity = "heavy";
			break;
		}
	}

	return serverity;
}

function extrapolateTimeInfo(data){
	let currentTime = data['dt'];
	let sunrise = data['sys']['sunrise'];
	let sunset = data['sys']['sunset'];
	let timeInfo = {sunrise:sunrise,sunset:sunset,currentTime:currentTime};
	return timeInfo;
}

function sendWeatherDataToClient(client){
	
	var weatherType = cities[client.city].weatherType;
	var weatherSeverity = cities[client.city].weatherSeverity;

	//no weather data to send
	if(!weatherType || !weatherSeverity){
		return;
	}
	console.log("sending: "+weatherType+" with: "+weatherSeverity+" for city: ",client.city);
	client.conn.sendUTF(JSON.stringify({
		city:client.city,
		weatherType: weatherType,
		severityLevel: weatherSeverity
	}));
}



function sendTimeDataToClient(client){
	let timeInfo = cities[client.city].timeInfo;
	console.log("sending time info: "+JSON.stringify(timeInfo)+" for city: "+client.city);
	timeInfo['type']='timeInfo';
	client.conn.sendUTF(JSON.stringify(timeInfo));
}


function init() {
	getWeatherForAllCities();

	//update weather every 30 minutes	
	setInterval(function(){
		getWeatherForAllCities();
	},1800000);

	setupWSServer();
	
}

init();
