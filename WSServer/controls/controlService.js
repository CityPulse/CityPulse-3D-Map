'use strict'

// WebSocket Variables
var http = require('http');
const request = require('request');
var WebSocketServer = require('websocket').server;
var webSocketsServerPort = 8003;
var clients = new Array();


function setupWSServer() {
	// Set up WebSocket Server
	

	var server = http.createServer(function(request, response) {
	    // process HTTP request. Since we're writing just WebSockets server
	    // we don't have to implement anything.
	});

	server.listen(webSocketsServerPort, function() { 
	    console.log((new Date()) + " Control server is listening on port " + webSocketsServerPort);
	});

	// create the server
	let wsServer = new WebSocketServer({
	    httpServer: server
	});

	// WebSocket server
	wsServer.on('request', function(request) {
	    console.log((new Date()) + ' Connection from origin ' + request.origin);
	    var conn = request.accept(null, request.origin);

	    conn.on('message', function(message) {
	    	let obj = JSON.parse(message.utf8Data);
	        // if (message.type === 'utf8') {
			if(obj.type == "close") {
	        	var index = -1;
	        	clients.forEach(function(client) {
	        		if(client.id == obj.id) {
	        			console.log("client w/ id: "+client.id+ " has departed");
	        			index = clients.indexOf(client);
	        		}
	        	});

	        	clients.splice(index, 1);

	        }else if(obj.type == 'controls'){
	        	clients.forEach(function(client){
	        		if(client.id !== obj.id ){
	        			sendCameraToClient(client, obj.data.position, obj.data.lookAt);
	        		}
	        	});
	        }
	        // }
	    });

	    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    		return v.toString(16);
		});

	    conn.on('close', function(reasonCode, description) {
	    	console.log("close "+reasonCode+"  "+description);
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



function sendCameraToClient(client,position, lookAt){
	let data = {};
	data['type']="controls";
	data['data'] = {};
	data['data']['position'] = position;
	data['data']['lookAt'] = lookAt;
	client.conn.sendUTF(JSON.stringify(data));
}


function init() {

	setupWSServer();
	
}

init();
