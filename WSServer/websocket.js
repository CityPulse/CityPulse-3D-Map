var http = require('http');
var WebSocketServer = require('websocket').server;

var webSocketsServerPort = 8001;

// DUMMY SETUP
var numberOfBuildings = 300;
var maxValue = 100;
var minValue = 1;

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
    var connection = request.accept(null, request.origin);

    // Start interval of sending data every 5 seconds
    var refreshId = setInterval(function() {
        buildingId = Math.floor(Math.random() * numberOfBuildings) + 1;    
        value = Math.floor(Math.random() * maxValue) + minValue;        
        unit = "kWh";

        connection.sendUTF('{"id":'+buildingId+', "value":'+value+',"unit":"'+unit+'"}');
    }, 5000);


    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        console.log("Received "+message);
        if (message.type === 'utf8') {
            connection.sendUTF("Message recieved: " + message);
        }
    });

    connection.on('close', function(connection) {
        clearInterval(refreshId);
        connection.close();
    });
});