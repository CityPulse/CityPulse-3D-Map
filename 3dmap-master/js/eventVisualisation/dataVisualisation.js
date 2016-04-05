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




///////////////////////////////////////////////////////////////
// Show a sphere to denote an event at a given coordinate with explanation
// coordinate should be {lat:54.21,12.35} form
///////////////////////////////////////////////////////////////

function showEvent(coordinates, text){
	var geometry = new THREE.SphereGeometry( 50, 10, 10 );
	var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
	var sphere = new THREE.Mesh( geometry, material );
	sphere.oldLevel=0;
	sphere.name = "event-";
	scene.add(sphere);
	//add the text to the sphere object for reference on click
	sphere.text = text;
	//move sphere to position
	var fCenterX = minX + (maxX-minX)*0.5;
    var fCenterY = minY + (maxY-minY)*0.5;
	console.log(coordinates);
	var utmResult= converter.toUtm({coord: [coordinates.lat, coordinates.lng]});

    var coordX = utmResult.coord.x-=fCenterX;
    var coordZ = utmResult.coord.y -=fCenterY; 
	sphere.translateX(coordX);
	sphere.translateZ(coordZ);

	//setup the tweens
	var easing = TWEEN.Easing.Quartic.InOut;
	var top = 400;
	var movement = 2;
	var lowerTarget = {y:-(movement/2)};
	var topTarget = {y:movement/2};
	

	console.log("top: "+topTarget+"  "+lowerTarget);
	console.log(sphere.position);

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
		.to(lowerTarget, 3000)
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

}