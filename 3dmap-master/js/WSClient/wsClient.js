var connection = null;
var subscriptions = new Array();
var clientId = -1;
var eventIds = new Array();

//var waitingForResponse = false;


$(function(){
    //close any websocket connections before user leaves page
    $(window).on('beforeunload', function(){
      if(connection){
        connection.send(JSON.stringify({type:"close", id: clientId}));
        connection.close();
      }
      
    });
});



///////////////////////////////////////////////////////////////
// Meta methods for WEBSOCKET
///////////////////////////////////////////////////////////////

function updateDatasources(name, minX, minY, maxX, maxY){
    if($.inArray(name, subscriptions) == -1) {
        subscriptions.push(name);
        connection.send(JSON.stringify({id: clientId, type:'setup', subscriptions: subscriptions, minX:minX, minY:minY, maxX: maxX, maxY:maxY}))
    } else {
        subscriptions.splice($.inArray(name, subscriptions), 1);
        connection.send(JSON.stringify({id: clientId, type:'setup', subscriptions: subscriptions, minX:minX, minY:minY, maxX: maxX, maxY:maxY}))
    }
    console.log(JSON.stringify({type:"setup", id: clientId, subscriptions: subscriptions, minX:minX, minY:minY, maxX: maxX, maxY:maxY}));

}

///////////////////////////////////////////////////////////////
// WEBSOCKET PART
///////////////////////////////////////////////////////////////

// If window is not in focus, it stores all incoming events untill window has focus again
// When window gets focus, it calls "handleDelayedEvent" and pops the first event in the
// queue, until no more events are in the queue.

var delayedEventTime = 1000;
function handleDelayedEvent() {
    if(window.blurred == true) return;
    handleMessage(eventQueue.pop());
    if(eventQueue.length > 0)
        setTimeout(handleDelayedEvent, delayedEventTime);
}

var eventQueue = new Array();
window.onblur = function() { window.blurred = true; };
window.onfocus = function() { 
    if(eventQueue.length > 0)
    setTimeout(function() {
        setTimeout(handleDelayedEvent, delayedEventTime);
    }, delayedEventTime);
    window.blurred = false; 
};

function setupSocket() {

    // if user is running mozilla then use it's built-in WebSocket
	window.WebSocket = window.WebSocket || window.MozWebSocket;

    // open connection
    connection = new WebSocket('ws://127.0.0.1:8001');

    connection.onopen = function () {
        // Send flagged subscribtions
    	//connection.send(JSON.stringify({type: "SETUP", data: {value : maxBuildings}}));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
       // console.log(message);

        var msg = JSON.parse(message.data);
       // console.log(msg);

        if(msg.type != null && msg.type == "setup") {
            clientId = msg.id;
        } else {
            if(window.blurred) {
                eventQueue.push(msg);
            } else {
		//console.log("will handle message!");
                handleMessage(msg);
            }
        }


        
    	
        
    	// switch(msg.type) {
    	// 	case "ENERGY":
    	// 	$.each(msg.data, function(index, building) {
     //            changeBuilding(building.value, building.id, false);  
     //        });
    	// 	break;
    	// 	case "HISTORYRESP":
    	// 	if(msg.data.value != -1) {
    	// 		var chartData = [];
    	// 		for(var i = 0; i < msg.data.value.length; i++) {
    	// 			chartData.push({index: i, value: msg.data.value[i]});
    	// 		}
    	// 		setupInfoBox(chartData);
    	// 	} else {
    	// 		$("#infoBox").append("<p>No historical data for this building.</p>")
    	// 	}
    	// 	//waitingForResponse = false;
    	// 	break;
    	// }
    	
    };
}

function handleMessage(msg) {
    //console.log($.inArray(msg.eventId, eventIds))
    if($.inArray(msg.eventId, eventIds) == -1 && msg.severityLevel != -1) { // If event is new and not to be deleted
//        console.log(1);
        eventIds.push(msg.eventId);
        //console.log("will call showEvent");

	console.log("handleMessage -> lat: "+msg.lat+" long: "+msg.long+" eventId: "+msg.eventId+" eventType: "+msg.eventType+" severity: "+msg.severityLevel);

	var coordinates = {lat:msg.lat, lng:msg.long}; 

	showEventByCoords(coordinates, "loool", msg.eventId, msg.eventType, msg.severityLevel);

    } else if($.inArray(msg.eventId, eventIds) != -1 && msg.severityLevel != -1) { // If event is not new and not to be deleted
        updateEvent(msg.eventId, msg.severityLevel);
    } else if($.inArray(msg.eventId, eventIds) != -1 && msg.severityLevel == -1) { // If event is not new and to be deleted
        removeEvent(msg.eventId);
    } else {
    }
}



