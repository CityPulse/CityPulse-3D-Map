var tests = (function(){
	var id = 0;


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
		showEvent(planePos, undefined ,id, type, serverity);
		

		// type: PublicParking(0), TrafficJam(1), AarhusPollution(2), AarhusNoise(3)
		// serverity: {0,1,2}
		if(id==Number.MAX_VALUE-1){
			id=0;
		}
		id++;
	}


	return {
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



