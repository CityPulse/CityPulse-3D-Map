var connection = null;
var subscriptions = new Array();
var clientId;

//var waitingForResponse = false;


$(function(){
    //close any websocket connections before user leaves page
    $(window).on('beforeunload', function(){
      if(connection){
        connection.close();
      }
      
    });
});



///////////////////////////////////////////////////////////////
// Meta methods for WEBSOCKET
///////////////////////////////////////////////////////////////

function updateDatasources(name, minX, minY, maxX, maxY){
    if(!$.inArray(name, subscriptions)) {
        subscriptions.push(name);

        connection.send(JSON.stringify({id: clientId, subscriptions: subscriptions, minX:minX, minY:minY, maxX: maxX, maxY:maxY}))
    }

}

///////////////////////////////////////////////////////////////
// WEBSOCKET PART
///////////////////////////////////////////////////////////////


function setupBuildingEnergySocket(maxBuildings) {

    if(!maxBuildings)
        return;
    // if user is running mozilla then use it's built-in WebSocket
	window.WebSocket = window.WebSocket || window.MozWebSocket;

    // open connection
    buildingEnergyConnection = new WebSocket('ws://127.0.0.1:8001');

    buildingEnergyConnection.onopen = function () {
    	buildingEnergyConnection.send(JSON.stringify({type: "SETUP", data: {value : maxBuildings}}));
    };

    // most important part - incoming messages
    buildingEnergyConnection.onmessage = function (message) {
    	var msg = JSON.parse(message.data);
        console.log(msg);
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
    		//waitingForResponse = false;
    		break;
    	}
    	
    };
}



    //dummy method at the moment to test switching between multiple sources - should be properly implemented when Bjarke/Joao is ready
    function setupPollutionSocket(maxBuildings) {
    
    if(!maxBuildings)
        return;
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // open connection
    pollutionConnection = new WebSocket('ws://127.0.0.1:8001');

    pollutionConnection.onopen = function () {
        pollutionConnection.send(JSON.stringify({type: "SETUP", data: {value : maxBuildings}}));
    };

    // most important part - incoming messages
    pollutionConnection.onmessage = function (message) {
        var msg = JSON.parse(message.data);
        console.log(msg);
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
            //waitingForResponse = false;
            break;
        }
        
    };
}