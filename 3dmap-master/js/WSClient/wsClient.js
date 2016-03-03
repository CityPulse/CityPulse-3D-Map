var connection = null;
var waitingForResponse = false;

///////////////////////////////////////////////////////////////
// WEBSOCKET PART
///////////////////////////////////////////////////////////////


// if user is running mozilla then use it's built-in WebSocket


function setupWSConnection(maxBuildings) {
	window.WebSocket = window.WebSocket || window.MozWebSocket;

    // open connection
    connection = new WebSocket('ws://127.0.0.1:8001');

    connection.onopen = function () {
    	connection.send(JSON.stringify({type: "SETUP", data: {value : maxBuildings}}));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
    	var msg = JSON.parse(message.data);
    	switch(msg.type) {
    		case "ENERGY":
    		$.each(msg.data, function(index, building) {
                changeBuilding(building.value, building.id, false);  
            });
    		break;
    		case "HISTORYRESP":
    		if(msg.data.value != -1) {
    			var chartData = [];
    			for(var i = 0; i < msg.data.value.length; i++) {
    				chartData.push({index: i, value: msg.data.value[i]});
    			}
    			setupInfoBox(chartData);
    		} else {
    			$("#infoBox").append("<p>No historical data for this building.</p>")
    		}
    		waitingForResponse = false;
    		break;
    	}
    	
    };
}