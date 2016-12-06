
var interaction = (function(){

	var selectedObject=null;
	var numberOfElementsInDataList = 0;
	var connectedToCameraControlServer=false;

	function resetPlaneSize(){
		minY = minX = 10000000;
		maxY = maxX = -100000.0;
	}


	function resetDatasources(){
		$(".dropdown-data > ul").find("input").each(function(i){
			$(this).prop("checked",false);
		});
		closeWebsockets();
	}

	function handleButtonActivation(isActive){
		let val = isActive?"inline":"none";
		$('#toggleAutoCam').css('display', val);
		$('#dataSourceChooser').css('display', val);
		
		
		if(numberOfElementsInDataList>0){
			$('#dataSourceChooser').attr('value',"Choose data source");
			$('#dataSourceChooser').prop('disabled',false);
		}else{
			$('#dataSourceChooser').attr('value',"No data sources available for this city");
			$('#dataSourceChooser').prop('disabled',true);
		}
		
	}

	function showRelevantButtons(city){

		$(".dropdown-data > ul >div").css('display','none');
		$(".dropdown-data > ul >div."+city).css('display','inline');
		var number = $(".dropdown-data > ul >div."+city).length;
		return number;
	}

	function resetCamera(){
		if(camera){
			camera.position.x=initCameraPosition.x;
			camera.position.y=initCameraPosition.y;
			camera.position.z=initCameraPosition.z;
			camera.lookAt(new THREE.Vector3(0,0,0));
		}
	}


	return{
		addMenuHandler: function(){
			
			$("#toggleAutoCam").on('click',function(e){
				autoCamAnimation =!autoCamAnimation;
			});
			
			//handler for city select
			$(".dropdown-city > ul > li > a").on('click', function(e){

				//do nothing if same city is selected again
				if(chosenCityId!==null & chosenCityId===this.id){
					return;
				}
				resetCamera();

				//reset the data sources
				if(chosenCityId!==null){
					//only reset if it is not first run
					resetDatasources();	
				}
				

				//make sure that ppl are not confused when data is laoding
				handleButtonActivation(false);
				chosenCityId = this.id;

				//show the relevant buttons for a city
				//if no data sources are available for a city, 0 is returned, which is used in handleButtonActivation function
				numberOfElementsInDataList = showRelevantButtons(chosenCityId);

				
				showSpinner(true);
				//show 'Loading Text'
				$("#loading").css('opacity','1.0');

				//set name on button
				cityName = this.name;
				$("#cityChooser").val(cityName);

				//clear scene if previously populated
				if(renderAnimationId!=null){
					cancelAnimationFrame(renderAnimationId);
				}


				for(var i = scene.children.length-1; i>=0; i--){
					var name = scene.children[i].name;
					if(!name.startsWith("sky") && !name.startsWith("spotlight") && !name.startsWith("hemilight") && !name.startsWith("weather") && !name.startsWith("SUN") && !name.startsWith("cam")){
						scene.remove(scene.children[i]);	
					}
				}
				
				//remove any animation tweens in memory
				TWEEN.removeAll();
				//reset plane size to acommodate new models
				resetPlaneSize();

				e.preventDefault();
				mapData.populateMap(this.id);
				weatherClient.setup(this.id,weatherVisualiser.weatherHandler, timeOfDayVisualiser.timeHandler); 
				document.title = this.name;
				//show GUI to handle test paramters
				if(addGUI){
					//playground.addGUI();
					$("#guiHolder").show();
				}

			});



			//handler for data source select
			$(".dropdown-data > ul > div > li > input").on('click',function(e){
				console.log("data source chosen")
				updateDatasources(this.value, wgsMinX, wgsMinY, wgsMaxX, wgsMaxY);
			});
		},

		addKeyboardHandling:function(){
			let toggleWeather = true;
			//add key handler to reset camera view
			$(document).keydown(function(e) {
				console.log(e.keyCode);
				if(e.keyCode===82){//'r' pressed
					resetCamera();
				}else if(e.keyCode==67){
					if(spotLight){
						spotLight.position.x=initSpotLightPosition.x;
						spotLight.position.y=initSpotLightPosition.y;
						spotLight.position.z=initSpotLightPosition.z;
						spotLightRadius = Math.sqrt(Math.pow(spotLight.position.x,2)+Math.pow(spotLight.position.y,2)+Math.pow(spotLight.position.z,2));

					}
				}else if(e.keyCode===65){//'a' pressed{
					autoCamAnimation=!autoCamAnimation;
				}else if(e.keyCode===66){//'b' pressed
					console.log("reset buildings");
					playground.resetAllBuildings();
				}else if(e.keyCode===86){//'v' pressed
					let buildingId = Math.floor(Math.random()*10);
					//buildingId = 8;
					playground.visualiseBuildingChanges(1, buildingId,false);
				}else if(e.keyCode===81){// 'q' pressed
					playground.resetAllBuildings();
				}else if(e.keyCode===87){// 'w' pressed
					if(toggleWeather){
						weatherVisualiser.weatherHandler("rain","heavy");	
						toggleWeather = !toggleWeather;
					}else{
						weatherVisualiser.weatherHandler("clear","middle");	
						toggleWeather = !toggleWeather;
					}
					
				}
				
			});
		},


		///////////////////////////////////////////////////////////////
		// Mouse interaction with scene
		///////////////////////////////////////////////////////////////

		addMouseHandling: function(){

			$(document).mousemove(function(event) {
				mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		     	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;		
			});
			
			$(document).dblclick(function(event) {

				
				if($("#infoBox").is(':visible')){
					//$("#infoBox").css('display', 'none');
					$("#infoBox").fadeOut(function(){
						$("#serverityType").text("");
						$("#severityLevel").text("");
					});
				}
				//dataVisualisation.removeEventTexts();

				
				raycaster.setFromCamera( mouse, camera );

				// calculate objects intersecting the picking ray
		    	var intersects = raycaster.intersectObjects( scene.children );
				for ( var i = 0; i < intersects.length; i++ ) 
				{
					if(intersects[i].object.name.startsWith("buildings") && intersects[i].face.readingId !== selectedObject){
						selectedObject = intersects[i].face.readingId; // Assign new selected object
						//console.log(intersects[i]);
						//dataVisualisation.changeBuild(3,selectedObject);
						break;
					}else if(intersects[i].object.name.startsWith("event")){
						
		        		var eventId = intersects[i].object.eventId;
		        		var serverity = Math.floor(Math.random() * 3);
		        		//updateEvent(eventId, serverity);
		        		dataVisualisation.showEventText(eventId);
		        		//removeEvent(eventId);
		        		//demoEventHack();
		        		break;
					}else if(intersects[i].object.name.startsWith("text")){
						dataVisualisation.removeEventTexts();
					}
					
					selectedObject = null;
		        }

			});
			
		},
		///////////////////////////////////////////////////////////////
		// Activate buttons when loading is done
		///////////////////////////////////////////////////////////////
		activateButtons: function(){
			handleButtonActivation(true);
		},

		///////////////////////////////////////////////////////////////
		// add WS controls 
		///////////////////////////////////////////////////////////////
		addWebSocketCameraControls: function(){
			//listener to be used for controlling camera over WS
			let lookAt = null;
    		let position = new THREE.Vector3();
			controls.addEventListener('change',function(e){
				
				if(connectedToCameraControlServer){
					//let matrix = e.target.object.matrix;
					/*
					position = e.target.object.position;
					e.target.object.getWorldDirection(lookAt);
					lookAt = new THREE.Vector3(0,0, -1);
					lookAt.applyMatrix4( camera.matrixWorld );
					controlClient.sendControls(position, lookAt);
					*/
				}
		    });
 
			controlClient.setup(false, function(position, lookAt){

				if(!connectedToCameraControlServer){

			        connectedToCameraControlServer=true;
				}

				if(position && lookAt && camera){
					camera.matrixWorldNeedsUpdate = true;
					camera.position.x = position.x;
					camera.position.y = position.y;
					camera.position.z = position.z;
					camera.lookAt(lookAt);
				}

		    });
		}

	}

})();




