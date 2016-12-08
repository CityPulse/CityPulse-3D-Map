
var dataVisualisation = (function(){

	//mapping used to make sure that building height do not reach infinity
	var maxEnergyLevel = 2;
	var minEnergyLevel = 0;
	var maxScale = 6;
	var minScale = 1;

	//global variables for events
	var eventList = {};
	var shownTextList = [];
	//vars for buildings
	var changedBuildingIds = [];

	///////////////////////////////////////////////////////////////
	// reset all buildings
	///////////////////////////////////////////////////////////////


	///////////////////////////////////////////////////////////////
	// Changing the height of buildings based on the energi level used
	///////////////////////////////////////////////////////////////

	function changeBuilding(energyLevel, buildingId, reset){
		if(maxEnergyLevel<energyLevel)
			maxEnergyLevel = energyLevel;
		var buidlingColor = 0xffffff;
		if(!reset){
			switch(energyLevel){
				case 1:
					buidlingColor = 0x0000ff;
					break;
				case 2:
					buidlingColor = 0xff0000;
					break;
			}
		}

		energyLevel = energyLevel.map(minEnergyLevel, maxEnergyLevel, minScale, maxScale);
		
		var timeout = 1500;
		
		let buildingMesh = buildingObjects[buildingId];
		//the building is not found.
		if(buildingMesh==undefined || buildingMesh.geoKey==undefined)
			return;
		changedBuildingIds.push(buildingId);
		
		let name = "buildings-"+buildingMesh.geoKey;
		

		for(var i=0; i<scene.children.length;i++){

			if(scene.children[i].name.indexOf(name) !=-1){

				var child = scene.children[i];
				
				var verticeColor = function(random, mesh){

					/*
					var r = Math.random();
					var b = Math.random();
					var g = Math.random();
					*/
					var meshFaces = mesh.geometry.faces;
					let newColor = random? buidlingColor:0xffffff;
					//console.log(newColor.toString(16));
					for(var j = 0; j<meshFaces.length;j++){
						meshFaces[j].color.setHex(newColor);
					}

					child.geometry.colorsNeedUpdate = true;
				};
				            			
			
						
				buildingMesh.rotation.set(0,0,0);
				buildingMesh.updateMatrix();
				
				//to be able to reset to original height
				if(reset && buildingMesh.oldLevel!==undefined)
					energyLevel = 1;
				
				if(buildingMesh.oldLevel == undefined){							
					buildingMesh.oldLevel = 1;
				}

				var start = 1/buildingMesh.oldLevel;
				

				//smooth the transistion between heights
				var tween = new TWEEN.Tween({scale:start} )
					.to( { scale: energyLevel }, timeout )
					.easing( TWEEN.Easing.Quadratic.InOut )
					.onUpdate( function () {
						
						buildingMesh.updateMatrix();
						buildingMesh.geometry.applyMatrix(buildingMesh.matrix);
						buildingMesh.matrix.identity();
						
						buildingMesh.scale.y = buildingMesh.oldLevel*this.scale; 

						buildingMesh.oldLevel = 1/this.scale;
						child.geometry.verticesNeedUpdate = true;

						

					})
					.onComplete(function(){
						
						TWEEN.remove(tween);
					})
					.start();

				verticeColor(true, buildingMesh);
				//setTimeout(verticeColor,timeout+500, false, buildingMesh);
				

				break;
			}
		}
	}



	///////////////////////////////////////////////////////////////
	// find the correct building id based on lat/long coordinates
	// return int for id or null if no building is found
	// coordinate: {lat:54.21, lng:12.35} form
	///////////////////////////////////////////////////////////////

	function findBuildingByCoords(coordinates){

	    var utmResult= converter.toUtm({coord: [coordinates.lng, coordinates.lat]});
		
	    var fCenterX = minX + (maxX-minX)*0.5;
	    var fCenterY = minY + (maxY-minY)*0.5;

	    var coordX = utmResult.coord.x-=fCenterX;
	    var coordY = utmResult.coord.y -=fCenterY;
		var origin = new THREE.Vector3(coordX,-5,coordY);
		var direction = new THREE.Vector3(0,1,0);


		var raycaster = new THREE.Raycaster();

		raycaster.set(origin,direction);

		var intersects = raycaster.intersectObjects( scene.children );
		
		var buildingId = undefined;

		for ( var i = 0; i < intersects.length; i++ ) 
		{
			if(intersects[i].object.name.startsWith("buildings") && intersects[i].face.readingId!==undefined){
				buildingId = intersects[i].face.readingId;
			}
		}

		return buildingId;
	}


	function _getTextFromEventType(type){
		var ret = "Kom Så De Hviie";
		switch(type){
			case "PublicParking":
				ret = "Public parking";
				break;
			case "TrafficJam":
				ret = "Traffic jam";
				break;
			case "AarhusPollution":
				ret = "Pollution";
				break;
			case "AarhusNoiseLevel":
				ret = "Noise";
				break;
		}
		return ret;
	}


	function _getTextFromServerity(severity){
		console.log(severity);
		var text = "Levels are good"
		switch(parseInt(severity)){
			case 0:
				text = "levels are good (0)"
				break;
			case 1:
				text = "levels are medium (1)"
				break;
			case 2:
				text = "levels are elevated (2)"
				break;
			case 3:
				text = "levels are high (3)"
				break;
			case 4:
				text = "levels are harsh (4)"
				break;
			case 5:
				text = "levels are extreme (5)"
				break;
		}
		console.log("with severity: "+severity+" return: "+text);
		return text;
	}


	///////////////////////////////////////////////////////////////
	// Helper method to calculate the height of the event, based on severity
	// Returns the calculated height
	// severity: {0,1,2}
	///////////////////////////////////////////////////////////////

	function _visualizeSeverity(severity){
		var top = 300;
		switch(parseInt(severity)){
			case 0:
				top = 100;
				break;
			case 1:
				top = 250;
				break;
			case 2:
				top = 300;
				break;
			case 3: 
				top = 350;
				break;
			case 4: 
				top = 400;
				break;
			case 5: 
				top = 500;
				break;
			default:
				top = 300;
		}

		return top;
	}





	return{

		changeBuild:function(level, buildingId){
			changeBuilding(level,buildingId,false);
		},


		showBuildingEnergy:function(coordinates,level){
			let buildingId = findBuildingByCoords(coordinates);
			if(buildingId===undefined)
				return;
			changeBuilding(level,buildingId,false);
		},

		resetBuildingEnergy:function(coordinates){
			let buildingId = findBuildingByCoords(coordinates);
			if(buildingId===undefined)
				return;
			changeBuilding(1,buildingId,true);
		},

		resetAllBuildings:function(){
			changedBuildingIds.forEach(function(id){
				changeBuilding(1,id,true);
			});
		},

		///////////////////////////////////////////////////////////////
		// Show a sphere to denote an event at a given coordinate with explanation
		// A wrapper for showEvent
		// coordinate: {lat:54.21, lng:12.35} form
		// id: eventId gotten from event
		// type: PublicParking(0), TrafficJam(1), AarhusPollution(2), AarhusNoise(3)
		// severity: [0,1,2]
		///////////////////////////////////////////////////////////////

		showEventByCoords:function(coordinates,id, type, severity){
			
			var utmResult= converter.toUtm({coord: [coordinates.lng, coordinates.lat]});
		        var coordX = utmResult.coord.x-=fCenterX;
		    
		        var coordY = utmResult.coord.y -=fCenterY;
			
			var location = {x:coordX, y:coordY};
			
			this.showEvent(location,id, type, severity);
		},


		///////////////////////////////////////////////////////////////
		// Show a sphere to denote an event at a given coordinate with explanation
		// coordinate:  {x:347019,y:6173507} form
		// id: eventId gotten from event
		// type: PublicParking(0), TrafficJam(1), AarhusPollution(2), AarhusNoise(3)
		// severity: {0,1,2}
		///////////////////////////////////////////////////////////////

		showEvent:function(coordinates,id, type, severity){
			
			console.log("SHOW EVENT-> coordX: "+coordinates.x+" coordY: "+coordinates.y+"  id: "+id+" type: "+type+" severity: "+severity);
			var color = 0xffff00;
			switch(type){
				case "PublicParking":
					color = 0x267326;
					break;
				case "TrafficJam":
					color = 0x0059b3;
					break;
				case "AarhusPollution":
					color = 0x1a1a00;
					break;
				case "AarhusNoise":
					color = 0xcc0000;
					break;
			}
			severity = severity;
			var top = _visualizeSeverity(severity);

			var radius = 20;
			var geometry = new THREE.SphereGeometry( radius, 10, 10 );	
			var material = new THREE.MeshBasicMaterial( {color: color} );
			material.transparent = true;
			material.opacity = 0.60;
			var sphere = new THREE.Mesh( geometry, material );
			sphere.castShadow = false;
			sphere.oldLevel=0;
			sphere.name = "event-";
			sphere.eventId = id;
			var meshes = [];
			meshes.push(sphere);
			addMeshes(meshes, "event");
			//move sphere to position     
			sphere.translateX(coordinates.x);
			sphere.translateZ(coordinates.y);
			sphere.translateY(-radius*2);

			//add string to sphere
			var stringLength = top-2*radius;
			var stringGeometry = new THREE.CylinderGeometry(radius,1,stringLength,8);
		    var string = new THREE.Mesh(stringGeometry, material);
		    string.castShadow = false;
			string.translateX(coordinates.x);
			string.translateZ(coordinates.y);
			string.translateY(-(stringLength/2+2*radius));
			var strings = [];
			strings.push(string);
			addMeshes(strings,"string");


			//setup the tweens
			var easing = TWEEN.Easing.Quartic.InOut;
			
			var movement = 0.5;
			var lowerTarget = {y:-(movement/2)};
			var topTarget = {y:movement/2};
			

			var startAnimation = function(){
					
				var level = this.yPos - sphere.oldLevel;
				sphere.translateY(level);
				sphere.oldLevel = this.yPos;
				string.translateY(level);
			}

			var startTween = new TWEEN.Tween({yPos:0} )
				.to( { yPos: top }, 2000 )
				.easing( easing )
				.onComplete(function(){
					sphere.geometry.computeBoundingSphere();
					sphere.matrixWorldNeedsUpdate = true;
					sphere.oldLevel=0;
				})
				.onUpdate(startAnimation);



			var animation = function(){
				sphere.translateY(this.y);
				string.translateY(this.y);
			}

			var bounceTween = new TWEEN.Tween(topTarget)
				.to(lowerTarget, 1500)
				.repeat( Infinity )
				.delay( 50 )
				.yoyo( true )
				.easing(easing)
				.onComplete(function(){
					//sphere.matrixWorldNeedsUpdate = true;
					
				})
				.onUpdate(animation);

			
			startTween.chain(bounceTween);
			
			startTween.start();
			
			let text = _getTextFromEventType(type);
			
			//add event to list, so it is possible to remove it later
			var event = {mesh:sphere, startTween:startTween, bounceTween:bounceTween, type:type, string:string, severity: severity};
			eventList[id] = event;
			//console.log("end of showEvent method!");
		},


		///////////////////////////////////////////////////////////////
		// shows the text from an event
		// eventId: the event id of the event that was clicked on
		///////////////////////////////////////////////////////////////

		showEventText:function(eventId){
			var event = eventList[eventId];
			
			if(eventId===undefined || event ===undefined)
				return;
			console.log(event.type);

			var header = _getTextFromEventType(event.type);
			var level = _getTextFromServerity(event.severity);	

			//$("#infoBox").css('display','inline');
			$("#infoBox").fadeIn("slow",function(){
				$("#serverityType").text(header);
				$("#severityLevel").text(level);
			});
			//TODO: Determine if we should use this again
			return;
			var event = eventList[eventId];
			
			if(eventId===undefined || event ===undefined)
				return;
			console.log(event.type);
			var text = _getTextFromEventType(event.type)+": severity: "+event.severity;
			//text geometry - how does it look and feel
			var textGeom = new THREE.TextGeometry( text, {
			    //font: "helvetiker", // Must be lowercase!
			    size: 45,
			    height:20
			});

			//y position for all text
			var textYPos = 600;
			var color = event.mesh.material.color;
			var material = new THREE.MeshBasicMaterial({color: color});
			var textMesh = new THREE.Mesh( textGeom, material );
			textMesh.name = "text-"+eventId;


			event.mesh.geometry.computeBoundingSphere();
			
			
			ePos = event.mesh.position;
			//move to event model position
			textMesh.position.set(ePos.x,ePos.y,ePos.z);
			textMesh.geometry.computeBoundingBox();
			textMesh.updateMatrix();
			
			var max = textMesh.geometry.boundingBox.max;
			var min = textMesh.geometry.boundingBox.min;
			var middleX =  (max.x-min.x)/2;
			var middleZ =  (max.z-min.z)/2;
			var yPos = textYPos-textMesh.position.y;
			
			textMesh.matrix.identity();
			//rorate to face camera
			var angle = Math.atan2( ( camera.position.x - textMesh.position.x ), ( camera.position.z - textMesh.position.z ) );
			textMesh.rotation.y = angle;
			//center text
			textMesh.translateX(-middleX);
			textMesh.translateZ(-middleZ);
			//move the text a bit up so its visible
			textMesh.translateY(yPos);
			
			//stop bounce effect
			//event.bounceTween.stop(); //screws up at the moment. seems like a bug in Tweens code
		    scene.add( textMesh );
		    var shownEvent = {event:event,textMesh:textMesh};
		    shownTextList.push(shownEvent);
		    /* for debugging
		    var hex  = 0xff0000;
			var bbox = new THREE.BoundingBoxHelper( textMesh, hex );
			bbox.update();
			scene.add( bbox );
			*/
		},


		///////////////////////////////////////////////////////////////
		// helper: remove all event text models from scene
		// 
		///////////////////////////////////////////////////////////////
		removeEventTexts:function(){
			$.each(shownTextList, function(i, shown){
				
				//safety to hinder crash
				if(shown===undefined)
					return;
				scene.remove(shown.textMesh);
				//shown.event.bounceTween.start(); //screws up at the moment. seems like a bug in Tweens code
			});
			shownTextList = [];
		},


		///////////////////////////////////////////////////////////////
		// remove a given event from the scene
		// Id is the eventId of the event as set in showEvent
		///////////////////////////////////////////////////////////////

		removeEvent:function(id){
			var event = eventList[id];
			//event not found in list - ignore to prevent error
			if(!event){
				console.log("event not found "+id);
				console.log(event);
				return;
			}

			TWEEN.remove(event.startTween);
			TWEEN.remove(event.bounceTween);
			var mesh = event.mesh;
			var string = event.string;
			var removeTween = new TWEEN.Tween({yPos:0} )
				.to( { yPos: -(mesh.position.y+mesh.geometry.boundingSphere.radius*2) }, 2000 )
				.easing( TWEEN.Easing.Quartic.InOut )
				.onUpdate(function(){
					var level = this.yPos - mesh.oldLevel;
					mesh.translateY(level);
					mesh.oldLevel = this.yPos;
					string.translateY(level);
				})
				.start();
			setTimeout(function(){
				scene.remove(mesh);
				scene.remove(string);
				delete eventList[id];
				TWEEN.remove(removeTween);
			},10000);

			
		},

		///////////////////////////////////////////////////////////////
		// helper: remove all events from the scene
		// 
		///////////////////////////////////////////////////////////////

		removeAllTypedEvents:function(type){

			$.each(eventList, function(i, event){
				//safety to hinder crash
				if(event===undefined || event.type!=type)
					return;
				console.log(i);
				dataVisualisation.removeEvent(i);
				
			});
		},


		///////////////////////////////////////////////////////////////
		// helper: remove all events from the scene
		// 
		///////////////////////////////////////////////////////////////

		removeAllEvents:function(){

			$.each(eventList, function(i, event){
				//safety to hinder crash
				if(event===undefined)
					return;
				TWEEN.remove(event.startTween);
				TWEEN.remove(event.bounceTween);
				scene.remove(event.mesh);	
				
			});
			eventList = [];
		},


		///////////////////////////////////////////////////////////////
		// updates a given event to a new severity aka. a height
		// eventId: the event id of the event that was clicked on
		///////////////////////////////////////////////////////////////
		updateEvent:function(eventId, severity){
			var event = eventList[eventId];
			//event not found in list - ignore to prevent error
			if(!event){
				console.log("event not found "+eventId);
				return;
			}
			var sphere = event.mesh;
			var string = event.string;
			string.oldLevel =1;

			var currentHeight = _visualizeSeverity(event.severity);
			var newHeight = _visualizeSeverity(severity);
			var diff = newHeight-currentHeight;
			
			//console.log(newHeight+" - "+currentHeight+" = "+diff);
			if(diff===0)
				return;

			var radius = sphere.geometry.boundingSphere.radius;

			var startY = sphere.position.y;

			var easing = TWEEN.Easing.Quartic.InOut;
			var startTween = new TWEEN.Tween({yPos:1} )
				.to( { yPos: diff }, 2000 )
				.easing( easing )
				.onComplete(function(){
					console.log("complete");
					sphere.geometry.computeBoundingSphere();
					sphere.oldLevel=0;
					
					var endY = sphere.position.y-radius;
					var _diff = Math.abs(endY)-Math.abs(startY);
					var scale = diff/startY+1;

					string.scale.y=scale;
					string.translateY(-_diff/2);


				})
				.onUpdate(function(){
					var level = this.yPos - sphere.oldLevel;
					sphere.translateY(level);
					sphere.oldLevel = this.yPos;
					string.translateY(level);

				});
			startTween.start();

			event.severity=severity;
		}


	}


})();
