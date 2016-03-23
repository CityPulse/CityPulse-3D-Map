var buildingEnergyConnection = null;
var pollutionConnection = null;

//var waitingForResponse = false;


$(function(){
    //close any websocket connections before user leaves page
    $(window).on('beforeunload', function(){
      if(buildingEnergyConnection){
        buildingEnergyConnection.close();
      }
      if(pollutionConnection){
        pollutionConnection.close();
      }
    });
});



///////////////////////////////////////////////////////////////
// Meta methods for WEBSOCKET
///////////////////////////////////////////////////////////////

function startDatasources(name){
    switch(name){
        case "buildingEnergy":
        //noOfBuildings = null? no building data loaded.
        //buildingEnergyConnection!=null? Building connection is already set and data is shown.
        if(noOfBuildings===null || buildingEnergyConnection!==null) return;
        setupBuildingEnergySocket(noOfBuildings);
        break;

        case "pollution":
        //dummy methods at the moment - needs to be changed
        if(noOfBuildings===null || pollutionConnection!==null) return;
        setupPollutionSocket(noOfBuildings);
        break;
    }
}


function stopDatasources(name){
    switch(name){
        case "buildingEnergy":
            //no connection to tear down
            if(buildingEnergyConnection===null) return;
            buildingEnergyConnection.close();
            buildingEnergyConnection = null;
        break;

        case "pollution":
            if(pollutionConnection===null) return;
            pollutionConnection.close();
            pollutionConnection = null;
        break;
    }
}



function resetModels(name){
    switch(name){
        case "buildingEnergy":
        break;

        case "pollution":
        //dummy so far - needs to be changed
        break;


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