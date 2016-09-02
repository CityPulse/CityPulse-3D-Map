
var interaction = (function(){

	var selectedObject=null;

	return{
		addMenuHandler: function(){

			$("#eventAdd").on('click',function(e){
				addTestEvent();
			});

			$("#toggleAutoCam").on('click',function(e){
				autoCamAnimation =!autoCamAnimation;
			});
			
			//handler for city select
			$(".dropdown-city > ul > li > a").on('click', function(e){

				//do nothing if same city is selected again
				if(chosenCityId!==null & chosenCityId===this.id){
					return;
				}

				chosenCityId = this.id;
				showSpinner(true);

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
					$("#guiHolder").show();
				}

			});



			//handler for data source select
			$(".dropdown-data > ul > li > input").on('click',function(e){
				updateDatasources(this.value, wgsMinX, wgsMinY, wgsMaxX, wgsMaxY);
			});
		},

		addKeyboardHandling:function(){
			//add key handler to reset camera view
			$(document).keydown(function(e) {
				if(e.keyCode===82){//'r' pressed
					if(camera){
						camera.position.x=initCameraPosition.x;
						camera.position.y=initCameraPosition.y;
						camera.position.z=initCameraPosition.z;
						camera.lookAt(new THREE.Vector3(0,0,0));
					}
				}else if(e.keyCode==67){
					if(spotLight){
						spotLight.position.x=initSpotLightPosition.x;
						spotLight.position.y=initSpotLightPosition.y;
						spotLight.position.z=initSpotLightPosition.z;
						guiParams.xPos=initSpotLightPosition.x;
						guiParams.yPos = initSpotLightPosition.y;
						guiParams.zPos = initSpotLightPosition.z;
						spotLightRadius = Math.sqrt(Math.pow(spotLight.position.x,2)+Math.pow(spotLight.position.y,2)+Math.pow(spotLight.position.z,2));

					}
				}else if(e.keyCode===65){//'a' pressed{
					autoCamAnimation=!autoCamAnimation;
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
					$("#infoBox").css('visibility', 'hidden');
				}
				removeEventTexts();

				
				raycaster.setFromCamera( mouse, camera );

				// calculate objects intersecting the picking ray
		    	var intersects = raycaster.intersectObjects( scene.children );
				for ( var i = 0; i < intersects.length; i++ ) 
				{
					//console.log(intersects[i].object);
					if(intersects[i].object.name.startsWith("buildings") && intersects[i].face.readingId !== selectedObject){
						selectedObject = intersects[i].face.readingId; // Assign new selected object							
						break;
					}else if(intersects[i].object.name.startsWith("event")){
		        		var eventId = intersects[i].object.eventId;
		        		var serverity = Math.floor(Math.random() * 3);
		        		//updateEvent(eventId, serverity);
		        		showEventText(eventId);
		        		//removeEvent(eventId);
		        		//demoEventHack();
		        		break;
					}else if(intersects[i].object.name.startsWith("text")){
						removeEventTexts();
					}
					
					selectedObject = null;
		        }

				
		        if(selectedObject !== null && connection!==null) {
		        	//waitingForResponse = true;
					buildingEnergyConnection.send(JSON.stringify({type: "HISTORYREQ", data: {value : selectedObject}}));
					$('#infoBox').html("Now showing data for building: " + selectedObject + "\n");
		        	$("#infoBox").css('visibility', 'visible');
		        }
					
			});
			
		}

	}

})();




