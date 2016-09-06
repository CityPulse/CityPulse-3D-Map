// WebSocket Variables
var http = require('http');
var WebSocketServer = require('websocket').server;
var webSocketsServerPort = 8001;
var clients = new Array();

var secondsToRemoveEvents = 70

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
	    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	    var conn = request.accept(null, request.origin);

	    conn.on('message', function(message) {
	    	obj = JSON.parse(message.utf8Data);

	        // if (message.type === 'utf8') {
	        	if(obj.type == "setup") {
		        	clients.forEach(function(client){
		        		
		        		if(client.id == obj.id) {
		        			client.subscriptions = new Array();
		        			obj.subscriptions.forEach(function(sub) {
		        				client.subscriptions.push(sub);
		        			});
		        			
				            client.minX = obj.minX;
				            client.minY = obj.minY;
				            client.maxX = obj.maxX;
				            client.maxY = obj.maxY;

				            console.log("Client with id = " + client.id + " is now subscribing to " + client.subscriptions + " in the area of " + client.minX +","+ client.minY + " - " + client.maxX + "," + client.maxY);
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
	    	subscriptions:new Array(),
	    	minX:0,
	    	minY:0,
	    	maxX:0,
	    	maxY:0
	    }
	    clients.push(client);

	    console.log("clients length = " + clients.length + " and has id = " + id);
	});
}

function init() {

	setupWSServer();

	setInterval(function() {
		if(clients.length == 0) return;
		clients.forEach(function(client){
			if(client.subscriptions.length > 0) {
				var eventId = Math.random();
				var sub = Math.floor(Math.random()*client.subscriptions.length);
				var long = Math.random()*(client.maxX-client.minX)+client.minX;
				var lat = Math.random()*(client.maxY-client.minY)+client.minY;
				client.conn.sendUTF(JSON.stringify({
					eventId:eventId, 
					eventType:client.subscriptions[sub],
					severityLevel: 2,
					lat: lat,
					long: long,
					date: 0
				}));


				console.log('-------EVENT BEGIN-----------');
				console.log("eventId: ", eventId, "eventType: ", client.subscriptions[sub], "severityLevel: ", 2, "lat: ", lat, "long: ", long, "date: ", 0);
				console.log('--------EVENT END------------');

				setTimeout(function() {
					client.conn.sendUTF(JSON.stringify({
						eventId:eventId, 
						eventType:client.subscriptions[sub],
						severityLevel: 1,
						lat: lat,
						long: long,
						date: 0
					}));

					setTimeout(function() {
					client.conn.sendUTF(JSON.stringify({
						eventId:eventId, 
						eventType:client.subscriptions[sub],
						severityLevel: -1,
						lat: lat,
						long: long,
						date: 0
					}));
					}, secondsToRemoveEvents*1000);
				}, 20*1000);
				console.log("Sending message...");
			}
		});
	}, 3*1000);
}

init();
