var http = require('http');
var WebSocketServer = require('websocket').server;

var debugging = false;

var webSocketsServerPort = 8001;

var historicalData = [];
var maxHistory = 10;

// DUMMY SETUP
var numberOfBuildings = 5;
var maxValue = 10;
var minValue = 1;
var dummyDataInterval = 100; // mili seconds..

var locked = false;

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
        if(locked) return;
        var buildingId = Math.floor(Math.random() * numberOfBuildings) + 1;    
        value = Math.floor(Math.random() * maxValue) + minValue;        
        unit = "kWh";

        if(historicalData[buildingId] == null) {
            var buildingHistory = [maxHistory];
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
            for(var i = 0; i < historicalData.length; i++) {
                if(historicalData[i] == null) {
                    continue;
                }

                console.log("-------- BUILDING ID: "+i+" --------");
                for(var j = 0; j < historicalData[i].length; j++) {
                    console.log(historicalData[i][j]);
                }
            }
        }
        connection.sendUTF(JSON.stringify({type:"ENERGY", data:{id:buildingId, value:value, unit:unit}}));
        //connection.sendUTF('{"type":"ENERGY", "data":{"id":'+buildingId+', "value":'+value+',"unit":"'+unit+'"}}');
    }, dummyDataInterval);


    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if(locked) return;
        locked = true;
        console.log("--> RECEIVED: " + message.utf8Data);
        obj = JSON.parse(message.utf8Data);
        if (message.type === 'utf8') {
            switch(obj.type) {
                case "SETUP":
                    numberOfBuildings = obj.data.value;
                break;
                case "HISTORYREQ":
                    var buildingId = obj.data.value;
                    if(historicalData[buildingId] != null) {
                        var buildingHistory = historicalData[buildingId];
                        var sortedArray = [];
                        var endCondition = buildingHistory.indexPointer-1;

                        if(buildingHistory.indexPointer > 1) {
                            for(var i = buildingHistory.indexPointer; i != endCondition; i++) {
                                
                                if(i == maxHistory) i = 0;
                                console.log(i + " - " + buildingHistory[i]);
                                if(buildingHistory[i] == null) continue;
                                sortedArray.push(buildingHistory[i]);
                            }
                            sortedArray.push(buildingHistory[endCondition]);
                        } else {
                            sortedArray.push(buildingHistory[0]);
                        }

                        var resp = JSON.stringify({type:"HISTORYRESP", data:{value:sortedArray}});
                        connection.sendUTF(resp);
                        console.log("<-- SEND: " + resp);
                    } else {
                        var resp = JSON.stringify({type:"HISTORYRESP", data:{value:-1}});
                        connection.sendUTF(resp);
                        console.log("<-- SEND: " + resp);
                    }
                break;
            };
            
        }
        locked = false;
    });

    connection.on('close', function(connection) {
        clearInterval(refreshId);
        connection.close();
    });
});