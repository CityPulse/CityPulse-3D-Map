
var dataVisualisation = (function(){

	//mapping used to make sure that building height do not reach infinity
	var maxEnergyLevel = 3;
	var minEnergyLevel = -1;
	var maxScale = 10;
	var minScale = 0.5;

	///////////////////////////////////////////////////////////////
	// Changing the height of buildings based on the energi level used
	///////////////////////////////////////////////////////////////

	function changeBuilding(energyLevel, buildingId, reset){
		if(maxEnergyLevel<energyLevel)
			maxEnergyLevel = energyLevel;

		energyLevel = energyLevel.map(minEnergyLevel, maxEnergyLevel, minScale, maxScale);
		
		var timeout = 1500;

		
		
		let buildingMesh = buildingObjects[buildingId];
		//the building is not found.
		if(buildingMesh==undefined || buildingMesh.geoKey==undefined)
			return;
		
		
		let name = "buildings-"+buildingMesh.geoKey;
		

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
				setTimeout(verticeColor,timeout+500, false, buildingMesh);
				

				break;
			}
		}
		//HACK: to give the feeling of dynamically created/deleted events
		//demoEventHack();
	}

	//global variables for events
	var eventList = {};
	var shownTextList = [];


	//just for testing
	var counter = 0;
	function demoEventHack(){
		counter++;
		if(counter%5!=0){
			return;
		}
		var key = null;
		if(Object.keys(eventList).length>=30){
			for(key in eventList){
				removeEvent(key);
				break;
			}
		}

		addTestEvent();
		console.log("no of events: "+Object.keys(eventList).length);
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
			case "publicParking":
				ret = "Public Parking";
				break;
			case "trafficJam":
				ret = "Traffic Jam";
				break;
			case "aarhusPollution":
				ret = "Pollution";
				break;
			case "aarhusNoise":
				ret = "Noise";
				break;
		}
		return ret;
	}


	///////////////////////////////////////////////////////////////
	// Helper method to calculate the height of the event, based on severity
	// Returns the calculated height
	// severity: {0,1,2}
	///////////////////////////////////////////////////////////////

	function _visualizeSeverity(severity){
		var top = 300;
		switch(severity){
			case 0:
				top = 100;
				break;
			case 1:
				top = 250;
				break;
			case 2:
				top = 400;
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
				case "publicParking":
					color = 0x267326;
					break;
				case "trafficJam":
					color = 0x0059b3;
					break;
				case "aarhusPollution":
					color = 0x1a1a00;
					break;
				case "aarhusNoise":
					color = 0xcc0000;
					break;
				case 4:
					color = 0x000000;
					break;
			}

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
			
			var movement = 1;
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
				.to(lowerTarget, 1000)
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
			var text = _getTextFromEventType(event.type)+": severity: "+event.severity;
			//text geometry - how does it look and feel
			var textGeom = new THREE.TextGeometry( text, {
			    font: "helvetiker", // Must be lowercase!
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
			},2050);

			
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
			
			console.log(newHeight+" - "+currentHeight+" = "+diff);
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
