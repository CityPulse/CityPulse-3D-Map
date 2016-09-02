
/*****************************/
/*                           */
/*         Geo data          */	
/*                           */
/*****************************/

var mapData = (function(){

	///////////////////////////////////////////////////////////////
	// Setting plane size based on building positions
	///////////////////////////////////////////////////////////////

	function setPlane(){
    	var planeGeo =  new THREE.PlaneBufferGeometry(planeX, planeY,32, 32 );// new THREE.PlaneGeometry(2000,2000);
        var planeMat = new THREE.MeshLambertMaterial("rgb(128, 128, 128)");
        plane = new THREE.Mesh(planeGeo, planeMat);
			
        // rotate it to correct position
        plane.rotation.x = -Math.PI/2;
		plane.castShadow = false;
		plane.receiveShadow = true;
		plane.name = "ground";

		plane.matrixAutoUpdate = false;
		plane.updateMatrix();

		//calculate bounding box for limiting camera position
		plane.geometry.computeBoundingBox();

        scene.add(plane);
        //toggleWeather("rain","middle",true);
		render();
    }

	///////////////////////////////////////////////////////////////
	// Getting building data from server
	///////////////////////////////////////////////////////////////

	function getBuildings(){

		///////////////////////////////////////////////////////////////
		// Decide if we use local dummy data or try to connect to server via WebSockets
		///////////////////////////////////////////////////////////////
		var usingServer = true;

		
		showText("retrieving building data from server for "+cityName);
		
		$.get(buildingUrl, function(kml)
		{
			showText("Building data loaded from server..");
			
			console.log(new Date()+":got building kml");
			
			var data = toGeoJSON.kml(kml).features;
			
			calculatePlaneBounds(data);
			setPlane();

			noOfBuildings = data.length;
			
			setTimeout(function(){
				showText("Creating building models");
				setTimeout(function(){
					createBuildingModels(data);
					showText("Building models created");
					setTimeout(function(){	
						console.log(new Date()+": buildings loaded");
						//hide spinner as system is ready
						showSpinner(false);
					},50)
					getTrees();
				},50);
				getWater();
			},50);
			getRoads();
			//setting up a websocket to event server
			setupSocket();
			//for testing events - can be removed when done
			//addTestEvent();
			
			/*
			//test for showing building height change;
			if(!usingServer)
				var t=setInterval(setLevels,1000/4);
			else
				setupBuildingEnergySocket(noOfBuildings);
			*/
		});
	}


	///////////////////////////////////////////////////////////////
	// Getting road data from server
	///////////////////////////////////////////////////////////////

	function getRoads(){
		//$.get('data/kml/roadtest.kml', function(kml)
		showText("Loading roads");
		//$.get('data/kml/aarhusByMidteVeje.kml', function(kml)
		$.get(roadUrl, function(kml)
		{
			console.log(new Date()+": got road kml");
			showText("Road data loaded from server");
			var data = toGeoJSON.kml(kml);
			
			createRoadModels(data.features);
			console.log(new Date()+": roads loaded");
		});
	}





	///////////////////////////////////////////////////////////////
	// Getting water data from server
	///////////////////////////////////////////////////////////////

	function getWater(){
		//check to see if tree model is available
		$.ajax({
			url:waterUrl,
			type:"HEAD",
			success:function(){
				showText("Loading water");
				$.get(waterUrl, function(kml)
				{
					console.log(new Date()+": got water kml");
					showText("Water data loaded from server");
					//console.log(kml);
					//debugger;
					var data = toGeoJSON.kml(kml);
					console.log(data);
					//return;
					createWaterModels(data.features);
					console.log(new Date()+": water loaded");
				});
			},
			error: function(){
				console.log("no water models available - continue with just buildings and roads");
			}
		});
	}




	///////////////////////////////////////////////////////////////
	// Getting tree data from server
	///////////////////////////////////////////////////////////////

	function getTrees(){
		//check to see if tree model is available
		$.ajax({
			url:treeUrl,
			type:"HEAD",
			success:function(){
				showText("Loading trees");
				$.get(treeUrl, function(kml)
				{
					console.log(new Date()+": got tree kml");
					showText("Tree data loaded from server");

					var data = toGeoJSON.kml(kml);

					createTreesModels(data.features);
					console.log(new Date()+": trees loaded");
				});
			},
			error: function(){
				console.log("no tree models available - continue with just buildings and roads");
			}
		});
		
		
	}


	///////////////////////////////////////////////////////////////
	// For testing purposes
	///////////////////////////////////////////////////////////////

	var testId = 0;


	function addTestEvents(){
		for(var i=0; i<300;i++){
			addTestEvent();	
		}
	}


	function addTestEvent(){

		//var testPos = {lat:12.566725889453012,lng:55.68321681457061};
		var testPos = {lat:10.21, lng:56.15};
		var x = Math.floor(Math.random() * planeX)-planeX/2;
		var y = Math.floor(Math.random() * planeY)-planeY/2;
		var planePos = {x:x,y:y};
		console.log("planeX: "+planeX+" planeY: "+planeY);
		console.log("planePos.x: "+planePos.x+" planePos.y: "+planePos.y);
		var type = Math.floor(Math.random() * 4);
		var types = [];
		types.push("PublicParking");
		types.push("TrafficJam");
		types.push("AarhusPollution");
		types.push("AarhusNoise");
		var type = types[Math.floor(Math.random() * 4)];

		var serverity = Math.floor(Math.random() * 3);
		showEvent(planePos, undefined ,testId, type, serverity);
		

		// type: PublicParking(0), TrafficJam(1), AarhusPollution(2), AarhusNoise(3)
		// serverity: {0,1,2}
		if(testId==Number.MAX_VALUE-1){
			testId=0;
		}
		testId++;
	}



	return{
		populateMap: function(city){
			console.log(new Date()+": start");
			//sortedbuildings.kml means that the original kml have been sorted according to location by sort.py
			buildingUrl = "data/kml/"+city+"/sortedbuildings.kml";
			roadUrl = "data/kml/"+city+"/roads.kml";
			treeUrl = "data/kml/"+city+"/trees.kml";
			waterUrl = "data/kml/"+city+"/water.kml";

			getBuildings();
			//for testing of all sorts
			//this.testRun();
		},

		//test run method for used when only wanting to show specific models
		testRun: function(){

			$.get(buildingUrl, function(kml)
			{
				
				console.log(new Date()+":got building kml");
				
				var data = toGeoJSON.kml(kml).features;
				
				calculatePlaneBounds(data);
				setPlane();

				
				//showSpinner(false);
				//addTestEvents();
				//return;
				
				//getTrees();
				
				//addTestEvents();
				//return;
				
				//getTrees();
				getWater();
				//getRoads();
				
				
				noOfBuildings = data.length;

				//createBuildingModels(data);
				showSpinner(false);
				
			});
		}
	}

})();
