var weatherSystem;
var weatherAdded = false;
var weatherTypeChanged = false;
var weatherAmountChanged = false;
var sunrise = null;
var sunset = null;
var timeFromServer = null;
var cs=0;

var timeOfDayVisualiser = (function(){

	return{
		timeHandler: function(timeInfo){
			let sunrise = timeInfo['sunrise'];
			let currentTime = timeInfo['currentTime'];
			let sunset = timeInfo['sunset'];

			let isDay = true;
			if(currentTime>sunset || currentTime<sunrise){
				currentTime = currentTime-sunset+sunrise;
				isDay=false;
			}

			let position = currentTime.map(sunrise, sunset, 0, Math.PI);
			objectAnimations.moveSun(position, isDay);
		}
	}
})();

var weatherVisualiser = (function(){

	var renderWeather = true;

	function changeAmount(){
		var particleCount = weatherSystem.geometry.vertices.length;
		var newAmount = weatherSystem.amountCount;
		if(particleCount>newAmount){
			console.log('make it smaller');
			var diff = particleCount-newAmount;
			var newParticles = weatherSystem.geometry.vertices.splice(diff,particleCount-diff);
			weatherSystem.geometry.vertices = newParticles;
		}
		if(particleCount<newAmount){
			console.log("make it BIGGER");
			var diff = newAmount-particleCount;
			for (var i = 0; i < diff; i ++ ) {
				var vertex = new THREE.Vector3();
				vertex.x = Math.random() * planeX-planeX/2;
				vertex.y = Math.random() * 2200+2200;
				vertex.z = Math.random() * planeY-planeY/2;
				vertex.velocity = new THREE.Vector3(
				  0,              // x
				  -Math.random(), // y: random val
				  0				  // z
				);             
				weatherSystem.geometry.vertices.push( vertex );
			}
		}
	}


	return {
		///////////////////////////////////////////////////////////////
		// Method for adding particle system to simulate weather
		// type: type of weather: "snow","rain", "clear"
		// amount: amount of precipitation: 'drizzle','middle','heavy'
		///////////////////////////////////////////////////////////////
		weatherHandler: function(type,amount){
			//console.log("weatherType: "+type);
			console.log("WC: "+type+" "+amount);
			var weatherGeometry;
			var typeString;
			switch(type){
				case "snow":
					typeString = "images/snowflake.png";
					break;
				case "rain":
					typeString = "images/raindrop.png";
					break;
				case "clear":
					typeString = "clear";
					break;
				default:
					typeString = "images/particle.png";
			}
			
			//console.log(typeString);
			var amountCount;
			switch(amount){
				case "light":
					amountCount = 10000;
					break;
				case "middle":
					amountCount = 25000;
					break;
				case "heavy":
					amountCount = 100000;
					break;
				default:
					amountCount = 25000;
					break;
			}

			if(weatherAdded){

				if(type!=="clear"){
					renderWeather=true;
				}

				if(weatherSystem.typeString!==typeString){
					weatherTypeChanged = true;
				}

				if(weatherSystem.amountCount!==amountCount){
					weatherAmountChanged = true;
				}

			}else{
				//if type is clear, dont add particle system
				if(typeString==='clear'){
					return;
				}
				console.log("X "+planeX+"  Y: "+planeY);
				weatherGeometry = new THREE.Geometry();
				for (var i = 0; i < amountCount; i ++ ) {
					var vertex = new THREE.Vector3();
					vertex.x = Math.random() * planeX-planeX/2;
					vertex.y = Math.random() * 9000;
					vertex.z = Math.random() * planeY-planeY/2;
					vertex.velocity = new THREE.Vector3(
					  0,              // x
					  -Math.random(), // y: random val
					  0				  // z
					);             
					weatherGeometry.vertices.push( vertex );
				}

				var color = 0xffffff;
				var size  = 10;


				var material = new THREE.PointsMaterial( { 
					size: size, 
					color:color,
					map: THREE.ImageUtils.loadTexture(
						typeString
						),
					blending: THREE.AdditiveBlending,
					transparent: true
				} );
				weatherSystem = new THREE.Points( weatherGeometry, material );
				
				weatherSystem.name = "weatherSystem";
				console.log("weatherSystem added");

				scene.add( weatherSystem );
				weatherAdded = true;
			}

			weatherSystem.typeString= typeString;
			weatherSystem.amountCount = amountCount;
			weatherSystem.weatherType = type;

			//console.log(weatherSystem);
		},


		renderWeather: function (){
				if(!renderWeather){
					return;
				}
				
				if(cs%500==0){
					console.log(renderWeather);
					cs=0;
				}
				cs++;
				var particleAccerleration = .1;
				if(weatherSystem.weatherType==='snow'){
					particleAccerleration = .05;
				}

				//weather particle system update
				var particleCount = weatherSystem.geometry.vertices.length;
				var numberUnderPlane = 0;
				while(particleCount--){

				    // get the particle
				    var particle = weatherSystem.geometry.vertices[particleCount];

				    // check if we need to reset
				    if (particle.y < 0) {
				    	if(!weatherAmountChanged && !weatherTypeChanged){
				    		particle.y = 2200+Math.random()*2200;
				      		particle.velocity.y = 0;
				      			
				    	}else{
				    		numberUnderPlane++;
				    		if(numberUnderPlane===weatherSystem.geometry.vertices.length){
				    			console.log("all Hidden");
				    			weatherSystem.material.map = THREE.ImageUtils.loadTexture(weatherSystem.typeString);
				    			if(particleCount!==weatherSystem.amountCount){
				    				changeAmount();
				    			}
				    			console.log("type: "+weatherSystem.weatherType);
				    			if(weatherSystem.weatherType!=="clear"){
				    				weatherAmountChanged=weatherTypeChanged=false;	
				    			}else{
				    				renderWeather=false;
				    			}
				    			
				    			return;
				    		}
				    	}
					    
				    }					
				    // update the velocity with
				    // a splat of randomniz
				    particle.velocity.y -= Math.random() * particleAccerleration;
				    // and the position
				    particle.add(particle.velocity);

				}
				// flag to the particle system
			  	// that we've changed its vertices.
			  	weatherSystem.geometry.verticesNeedUpdate = true;
				//end weather
			}
	}

})();
