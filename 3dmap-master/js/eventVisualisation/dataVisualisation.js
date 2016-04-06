///////////////////////////////////////////////////////////////
// Changing the height of buildings based on the energi level used
///////////////////////////////////////////////////////////////

function changeBuilding(energyLevel, buildingId, reset){

	if(maxEnergyLevel<energyLevel)
		maxEnergyLevel = energyLevel;

	energyLevel = energyLevel.map(minEnergyLevel, maxEnergyLevel, minScale, maxScale);
	
	var timeout = 1500;

	var name = "buildings-";
	var nameNumber = -1;
	if(!reset){
		nameNumber = Math.floor(buildingId/(noOfBuildings/noOfBuildingGeoSlice));
		name = "buildings-"+nameNumber;
	}

		

	for(var i=0; i<scene.children.length;i++){
		if(scene.children[i].name.indexOf(name) !=-1){

			var child = scene.children[i];
			
			var verticeColor = function(random, mesh){

				var r = Math.random();
				var b = Math.random();
				var g = Math.random();

				var meshFaces = mesh.geometry.faces;

				for(var j = 0; j<meshFaces.length;j++){
					if(random){
						meshFaces[j].color.setRGB(r,g,b);	
					}else{
						meshFaces[j].color.setHex(0xffffff);
					}
				}

				child.geometry.colorsNeedUpdate = true;
			};
			            			

			var mesh = buildingObjects[buildingId];
			
			if(mesh !=undefined){
					
				mesh.rotation.set(0,0,0);
				mesh.updateMatrix();
				
				//to be able to reset to original height
				if(reset && mesh.oldLevel!==undefined)
					energyLevel = 1;
				
				if(mesh.oldLevel == undefined){							
					mesh.oldLevel = 1;
				}

				var start = 1/mesh.oldLevel;
				

				//smooth the transistion between heights
				var tween = new TWEEN.Tween({scale:start} )
					.to( { scale: energyLevel }, timeout )
					.easing( TWEEN.Easing.Quadratic.InOut )
					.onUpdate( function () {
						
						mesh.updateMatrix();
						mesh.geometry.applyMatrix(mesh.matrix);
						mesh.matrix.identity();
						
						mesh.scale.y = mesh.oldLevel*this.scale; 

						mesh.oldLevel = 1/this.scale;
						child.geometry.verticesNeedUpdate = true;
						

					})
					.onComplete(function(){
						
						TWEEN.remove(tween);
						
					})
					.start();

				verticeColor(true, mesh);
				setTimeout(verticeColor,timeout+500, false, mesh);
			}	

			break;
		}
	}
}

//global variables for events
var eventList = [];


///////////////////////////////////////////////////////////////
// Show a sphere to denote an event at a given coordinate with explanation
// A wrapper for showEvent
// coordinate: {lat:54.21, lng:12.35} form
// text: text to be shown when event is clicked
// id: eventId gotten from event
// type: PublicParking(0), TrafficJam(1), AarhusPollution(2), AarhusNoise(3)
// serverity: [0,1,2]
///////////////////////////////////////////////////////////////

function showEventByCoords(coordinates, text,id, type, serverity){
	var utmResult= converter.toUtm({coord: [coordinates.lat, coordinates.lng]});
	var fCenterX = minX + (maxX-minX)*0.5;
    var fCenterY = minY + (maxY-minY)*0.5;

    var coordX = utmResult.coord.x-=fCenterX;
    var coordY = utmResult.coord.y -=fCenterY;

	var location = {x:coordX, y:coordY};
	showEvent(location, text,id, type, serverity);
}

///////////////////////////////////////////////////////////////
// Show a sphere to denote an event at a given coordinate with explanation
// coordinate:  {x:347019,y:6173507} form
// text: text to be shown when event is clicked
// id: eventId gotten from event
// type: PublicParking(0), TrafficJam(1), AarhusPollution(2), AarhusNoise(3)
// serverity: {0,1,2}
///////////////////////////////////////////////////////////////

function showEvent(coordinates, text,id, type, serverity){
	
	var color = 0xffff00;
	switch(type){
		case 0:
			color = 0x267326;
			break;
		case 1:
			color = 0x0059b3;
			break;
		case 2:
			color = 0x1a1a00;
			break;
		case 3:
			color = 0xcc0000;
			break;
	}

	var top = 300;
	switch(serverity){
		case 0:
			top = 100;
			break;
		case 1:
			top = 250;
			break;
		case 2:
			top = 400;
	}
	var radius = 20;
	var geometry = new THREE.SphereGeometry( radius, 10, 10 );	
	var material = new THREE.MeshBasicMaterial( {color: color} );
	material.transparent = true;
	material.opacity = 0.60;
	var sphere = new THREE.Mesh( geometry, material );
	sphere.oldLevel=0;
	sphere.name = "event-";
	sphere.eventId = id;
	var meshes = [];
	meshes.push(sphere);
	addMeshes(meshes, "event");
	
	//add the text to the sphere object for reference on click
	sphere.text = text;

	//move sphere to position     
	sphere.translateX(coordinates.x);
	sphere.translateZ(coordinates.y);
	sphere.translateY(-radius*2);

	//setup the tweens
	var easing = TWEEN.Easing.Quartic.InOut;
	
	var movement = 1;
	var lowerTarget = {y:-(movement/2)};
	var topTarget = {y:movement/2};
	

	var update = function(){
			
		var level = this.yPos - sphere.oldLevel;
		sphere.translateY(level);
		sphere.oldLevel = this.yPos;
	}

	var startTween = new TWEEN.Tween({yPos:0} )
		.to( { yPos: top }, 2000 )
		.easing( easing )
		.onComplete(function(){
			sphere.geometry.computeBoundingSphere();
			sphere.matrixWorldNeedsUpdate = true;
			sphere.oldLevel=0;
		})
		.onUpdate(update);



	var animation = function(){
		var level = this.y - sphere.oldLevel;
		sphere.translateY(this.y);
		sphere.oldLevel = this.y;
	}

	var bounceTween = new TWEEN.Tween(topTarget)
		.to(lowerTarget, 1000)
		.repeat( Infinity )
		.delay( 50 )
		.yoyo( true )
		.easing(easing)
		.onComplete(function(){
			sphere.matrixWorldNeedsUpdate = true;
			
		})
		.onUpdate(animation);

	
	startTween.chain(bounceTween);
	
	startTween.start();

	//add event to list, so it is possible to remove it later
	var event = {mesh:sphere, startTween:startTween, bounceTween:bounceTween};
	eventList[id] = event;

}


///////////////////////////////////////////////////////////////
// remove a given event from the scene
// Id is the eventId of the event as set in showEvent
///////////////////////////////////////////////////////////////

function removeEvent(id){
	var event = eventList[id];
	//event not found in list - ignore to prevent error
	if(!event)
		return;

	console.log(event.mesh);
	TWEEN.remove(event.startTween);
	TWEEN.remove(event.bounceTween);
	var mesh = event.mesh;
	var removeTween = new TWEEN.Tween({yPos:0} )
		.to( { yPos: -(mesh.position.y+mesh.geometry.boundingSphere.radius) }, 2000 )
		.easing( TWEEN.Easing.Quartic.InOut )
		.onComplete(function(){
			scene.remove(event.mesh);
			delete eventList[id];
			TWEEN.remove(removeTween);
		})
		.onUpdate(function(){
			var level = this.yPos - mesh.oldLevel;
			mesh.translateY(level);
			mesh.oldLevel = this.yPos;
		})
		.start();


	
}


///////////////////////////////////////////////////////////////
// remove all events from the scene
// 
///////////////////////////////////////////////////////////////

function removeAllEvents(){

	$.each(eventList, function(i, event){
		console.log(event);
		//safety to hinder crash
		if(event===undefined)
			return;
		TWEEN.remove(event.startTween);
		TWEEN.remove(event.bounceTween);
		scene.remove(event.mesh);	
		
	});
	eventList = [];
}

/*
An event is characterised by:
eventID: unique identifier
eventType: PublicParking, TrafficJam, AarhusPollution, AarhusNoise, …
severityLevel: which is basically a number that I will explain for each of the cases, basically is the event value
Lat and Long: geo coordinates of the event
Date: when the event occurred
Now the severity of an event: 
TrafficJam events -> 0 or 1, meaning: 0 -> no more traffic jam, 1 -> traffic jam. This means that for every traffic jam event that we receive with 1 in the severity value we will receive an event with the same id with the value 0 when there is not anymore any traffic jam.
PublicParking -> There are still some discussions regarding this particular type of event as the values are inconsistent. However here is a simple explanation that does not reflect the current values, but in order to keep it simple for now we have. 0 -> parking lot almost empty; 1 -> parking lot 50% occupied; 2 -> parking lot almost full
AarhusPollution -> 0 -> low level of pollution, 1 -> avg. Level of pollution, 2 -> high level of pollution
AarhusNoise -> not yet implemented but I guess it will be the same as the pollution
Twitter –> needs to be discussed still.
*/