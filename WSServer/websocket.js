var http = require('http');
var WebSocketServer = require('websocket').server;

var debugging = false;

var webSocketsServerPort = 8001;

var historicalData = [];
var maxHistory = 5;

// DUMMY SETUP
var numberOfBuildings = 5;
var maxValue = 100;
var minValue = 1;
var dummyDataInterval = 1000; // mili seconds..

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

        if(historicalData[buildingId] == null) {
            var buildingHistory = [];
            buildingHistory.indexPointer = 0;
            buildingHistory[buildingHistory.indexPointer] = value;
            buildingHistory.indexPointer++;
            historicalData[buildingId] = buildingHistory;
        } else {
            historicalData[buildingId][historicalData[buildingId].indexPointer] = value;
            historicalData[buildingId].indexPointer++;
            if(historicalData[buildingId].indexPointer == maxHistory)
                historicalData[buildingId].indexPointer = 0;
        }

        if(debugging) {
            console.log('\033[2J');
            for(i = 0; i < historicalData.length; i++) {
                if(historicalData[i] == null) {
                    continue;
                }

                console.log("-------- BUILDING ID: "+i+" --------");
                for(j = 0; j < historicalData[i].length; j++) {
                    console.log(historicalData[i][j]);
                }
            }
        }

        connection.sendUTF('{"id":'+buildingId+', "value":'+value+',"unit":"'+unit+'"}');
    }, dummyDataInterval);


    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        console.log("Received "+message.utf8Data);
        if (message.type === 'utf8') {
            connection.sendUTF("Message recieved: " + message.utf8Data);
        }
    });

    connection.on('close', function(connection) {
        clearInterval(refreshId);
        connection.close();
    });
});