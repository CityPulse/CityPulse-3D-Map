//VARIABLES
var queueName = '3dmapqueue';
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
//END VARIABLES


// Consumer
function consumer(conn) {
	var ok = conn.createChannel(on_open);
	function on_open(err, ch) {
		if (err != null) bail(err);    
		ch.assertQueue(queueName);
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
							triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#AarhusNoiseLevel") {
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
							lat = eventLatSplit[0].split('"')[1];

							var eventLongSplit = triples[5].object.split('^^');
							long = eventLongSplit[0].split('"')[1];

							var eventDateSplit = triples[8].object.split('^^');
							date = eventDateSplit[0].split('"')[1];

							if(debug) {
								console.log('-------EVENT BEGIN-----------');
								console.log("eventId: ", eventId, "eventType: ", eventType, "severityLevel: ", severityLevel, "lat: ", lat, "long: ", long, "date: ", date);
								console.log('--------EVENT END------------');
							}
							
							// Send data to client
							clients.forEach(function(client){
								if(client.conn != undefined && client.conn.connected) {
									if($.inArray(eventType, client.subscribtions) && testForLocation(client, lat, long)) {

										client.conn.sendUTF(JSON.stringify({
											eventId:eventId, 
											eventType:eventType,
											severityLevel: severityLevel,
											lat: lat,
											long: long,
											date: date
										}));
									}
								}
							});
						}
					}
            	});
  			}
		});
  	}
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
	        if (message.type === 'utf8') {
	            var client = clients[obj.id];
	            client.subscribtions = obj.subscribtions;
	            client.minX = obj.minX;
	            client.minY = obj.minY;
	            client.maxX = obj.maxX;
	            client.maxY = obj.maxY;
	        }
	    });

	    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    		return v.toString(16);
		});

	    conn.on('close', function(reasonCode, description) {
	    	
	    });

	    conn.sendUTF(JSON.stringify({
			id:id
		}));

	    var client = {
	    	conn:conn,
	    	id:id,
	    	subscribtions:new Array(),
	    	minX:0,
	    	minY:0,
	    	maxX:0,
	    	maxY:0
	    }
	    clients[id] = client;
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
	if( long > client.minX && long < client.maxX &&
		lat > client.minY && lat < client.maxY)
		return true;
	else return false;
}

init();

