// WebSocket Variables
var http = require('http');
var WebSocketServer = require('websocket').server;
var webSocketsServerPort = 8002;
var clients = new Array();


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
	    	console.log(obj);
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
	    	city:"aarhus"
	    }
	    clients.push(client);

	    console.log("clients length = " + clients.length + " and has id = " + id);
	});
}

function getRandWeather(){
	var types = ["rain","snow","clear"];
	var type = types[Math.floor(Math.random() * 3)];
	return type;
}

function getRandWeatherAmount(){
	var types = ["drizzle","middle","heavy"];
	var type = types[Math.floor(Math.random() * 3)];
	return type;
}

function init() {

	setupWSServer();
	setInterval(function() {
		weatherType = getRandWeather();
		if(clients.length == 0) return;
		clients.forEach(function(client){
			weatherType = getRandWeather();
			serverity = getRandWeatherAmount();
			client.conn.sendUTF(JSON.stringify({
						city:client.city,
						weatherType: weatherType,
						severityLevel: serverity
			}));
		});
		
	},5000);

}

init();
