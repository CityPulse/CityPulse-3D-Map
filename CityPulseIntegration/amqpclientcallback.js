//VARIABLES
var queueName = '3dmapqueue-ttl';
var exchange = 'events';
var routingKey = '#';
var N3 = require('n3');
var amqpEndpoint = 'amqp://guest:guest@131.227.92.55:8007';
var debug = true;

// WebSocket Variables
var http = require('http');
var WebSocketServer = require('websocket').server;
var webSocketsServerPort = 8001;
var clients = new Array();

var secondsToRemoveEvents = 60;

// Test Variables
var testing = true;
//END VARIABLES


// Consumer
function consumer(conn) {
	var ok = conn.createChannel(on_open);
	function on_open(err, ch) {
		if (err != null) bail(err);    
		ch.assertQueue(queueName, {"messageTtl": 600000});
        ch.bindQueue(queueName, exchange, routingKey);
		ch.consume(queueName, function(msg) {
  			if (msg !== null) {
				var parser = N3.Parser();
				var triples = [];
				var toSendToMap = false;
				var rdfMessage = msg.content.toString();
				//console.log(rdfMessage);
				parser.parse(rdfMessage, function (error, triple, prefixes) {
                	if (triple) {
                    	triples.push(triple);
                    	if(
                    		triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#TrafficJam" || 
							triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#PublicParking" ||
							triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#AarhusPollution" ||
							triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#AarhusNoiseLevel" ||
							triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#Twitter.Aarhus") {
                            toSendToMap = true;
                    	}
                	}
					else {
						//FINISHED PARSING THE RDFMESSAGE
						if(toSendToMap){
							var eventId, eventType, severityLevel, lat, long, date;
							
							var eventIdSplit = triples[0].subject.split('#');
							eventId = eventIdSplit[1];
							
							var eventTypeSplit = triples[0].object.split('#');
							eventType = eventTypeSplit[1];
							
							var eventSeveritySplit = triples[2].object.split('^^');
							severityLevel = eventSeveritySplit[0].split('"')[1];
															
							var eventLatSplit = triples[4].object.split('^^');
							lat = parseFloat(eventLatSplit[0].split('"')[1]);

							var eventLongSplit = triples[5].object.split('^^');
							long = parseFloat(eventLongSplit[0].split('"')[1]);

							var eventDateSplit = triples[8].object.split('^^');
							date = eventDateSplit[0].split('"')[1];

							if(debug) {
								console.log('-------EVENT BEGIN-----------');
								console.log("eventId: ", eventId, "eventType: ", eventType, "severityLevel: ", severityLevel, "lat: ", lat, "long: ", long, "date: ", date);
								console.log('--------EVENT END------------');
							}
							
							var numberOfReceivers = sendToClients(eventId, eventType, severityLevel, lat, long, date);
							
							if(numberOfReceivers > 0) {
								setTimeout(function() {
									sendToClients(eventId, eventType, -1, lat, long, date);
									console.log("Deleting events again....id: "+eventId);
								}, secondsToRemoveEvents*1000);
							}
						}
					}
            	});
//		ch.ack(msg);
  			}
		});
  	}
}

function sendToClients(eventId, eventType, severityLevel, lat, long, date) {
// Send data to client
	var count = 0;
	clients.forEach(function(client){
		console.log('-------- CLIENT: '+client.id+' ------------');	
		if(client.conn != undefined && client.conn.connected) {
			console.log(client.subscriptions);
			if(client.subscriptions.indexOf(eventType) >= 0 && testForLocation(client, lat, long)) {
				console.log("before send");
				client.conn.sendUTF(JSON.stringify({
					eventId:eventId, 
					eventType:eventType,
					severityLevel: severityLevel,
					lat: lat,
					long: long,
					date: date
				}));
				console.log("after send");
				count += 1;
			} else {
				if(client.subscriptions.indexOf(eventType) < 0) {
					console.log("Message not sent to client because client is not subscribing to that type of event.");
				}
				if(!testForLocation(client, lat, long)) {
					console.log("Message not sent to client because event is out of area.");	
				}
			}
		} else {
			console.log("Message not sent to client because connection problems.");
		}
		console.log('--------------------------------------------');	
	});
	return count;
}

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
		        		console.log(obj);
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

	// Set up AMQP conn
	require('amqplib/callback_api').connect(amqpEndpoint, function(err, conn) {
    if (err != null) 
		bail(err);
    consumer(conn);
	});
}

function testForLocation(client, lat, long) {
	console.log(long + " > " + client.minX);
	console.log(long + " < " + client.maxX);
	console.log(lat + " > " + client.minY);
	console.log(lat + " < " + client.maxY);
	if( long > client.minX && long < client.maxX &&
		lat > client.minY && lat < client.maxY)
		return true;
	else return false;
}

init();
