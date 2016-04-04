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
				var goal = energyLevel*mesh.oldLevel;
				

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




///////////////////////////////////////////////////////////////
// Show a sphere to denote an event at a given coordinate with explanation
// coordinate should be lat/lng 
///////////////////////////////////////////////////////////////

function showEvent(coordinates, text){
	var geometry = new THREE.SphereGeometry( 50, 10, 10 );
	var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
	var sphere = new THREE.Mesh( geometry, material );
	sphere.name = "event-";
	scene.add(sphere);

	var easing = TWEEN.Easing.Quartic.InOut;

	var top = 5;
	var movement = 2;
	var lowerPosition = -(movement/2);
	var topPosition = movement/2;

	console.log("top: "+topPosition+"  "+lowerPosition);
	console.log(sphere.position);

	var update = function(){
		console.log(this.yPos);
		sphere.updateMatrix();
		sphere.geometry.applyMatrix(sphere.matrix);
		sphere.position.y = this.yPos;
		sphere.matrix.identity();
	}

	var startTween = new TWEEN.Tween({yPos:0} )
		.to( { yPos: top }, 10000 )
		.easing( easing )
		.onUpdate(update);


	var d = 0;
	var downTween = new TWEEN.Tween({yPos:0})
		.to({yPos:lowerPosition},3000)
		.easing( easing )
		.onUpdate(function() {
			sphere.updateMatrix();
			sphere.geometry.applyMatrix(sphere.matrix);
			sphere.position.y = this.yPos;
			if(d%100==0){
				console.log(sphere.position);
				d=0;
			}
			d++;
			console.log('ypos; '+this.yPos);
			//sphere.matrix.identity();
		});

	var upTween = new TWEEN.Tween({yPos:0})
		.to({yPos:topPosition},3000)
		.easing( TWEEN.Easing.Quadratic.InOut )
		.onUpdate(function() {
			sphere.updateMatrix();
			sphere.geometry.applyMatrix(sphere.matrix);
			sphere.position.y = this.yPos;
			console.log('ypos; '+this.yPos);
			//sphere.matrix.identity();
		});

	/*
	startTween.chain(downTween);
	downTween.chain(upTween);
	upTween.chain(downTween);
	*/
	startTween.start();

}