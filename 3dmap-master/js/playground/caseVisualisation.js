var playground = (function(){

	var changedBuildingIds = [];
	var maxEnergyLevel = 2;
	var minEnergyLevel = 0;
	
	var maxScale = 6;
	var minScale = 1;

	var gui = new dat.GUI({
	    height : 3 * 32 - 1,
	    autoPlace: false
	});

	var guiParams = {

		colorActive:false,
		color: 0xffffff,

		heightActive:false,
		heightScalar:1,

		widthActive:false,
		widthScalar:1,

		neighborsActive:true,
		neighborsRadius:250

		
	};

	function activationChanged(){
		playground.resetAllBuildings();
	}

	function heightChanged(){
		console.log("heightChanged");
	}

	function widthChanged(){
		console.log("widthChanged");
	}

	function colorChanged(){
		console.log("colorChanged");
	}

	function neighborsChanged(){
		console.log("neighborsChanged");
	}


	function visualiseColors(buildingMesh, level, reset){
		var meshFaces = buildingMesh.geometry.faces;

		var buidlingColor = 0xffffff;
		if(!reset){
			//todo: Still needs some work to get correct color scheme
			let color = guiParams.color;
			console.log(color);
			buidlingColor = level.map(minEnergyLevel,maxEnergyLevel,color,0).toString(16);
		}
		console.log(buidlingColor);
		//console.log(newColor.toString(16));
		for(var j = 0; j<meshFaces.length;j++){
			meshFaces[j].color.setHex(buidlingColor);
		}
	}



	function visualiseHeight(buildingMesh,level,reset,child){
		
		let scalar = guiParams.heightScalar;
		let energyLevel = level.map(minEnergyLevel, maxEnergyLevel, minScale, maxScale)*scalar;
		console.log(energyLevel);
		buildingMesh.rotation.set(0,0,0);
		buildingMesh.updateMatrix();
		
		//to be able to reset to original height
		if(reset && buildingMesh.oldLevelY!==undefined)
			energyLevel = 1;
		
		if(buildingMesh.oldLevelY == undefined){							
			buildingMesh.oldLevelY = 1;
		}

		let start = 1/buildingMesh.oldLevelY;
		
		let timeout = 1500;
		//smooth the transistion between heights
		var tween = new TWEEN.Tween({scale:start} )
			.to( { scale: energyLevel }, timeout )
			.easing( TWEEN.Easing.Quadratic.InOut )
			.onUpdate( function () {
				
				buildingMesh.updateMatrix();
				buildingMesh.geometry.applyMatrix(buildingMesh.matrix);
				buildingMesh.matrix.identity();
				
				buildingMesh.scale.y = buildingMesh.oldLevelY*this.scale; 

				buildingMesh.oldLevelY = 1/this.scale;
				child.geometry.verticesNeedUpdate = true;

				

			})
			.onComplete(function(){
				
				TWEEN.remove(tween);
				buildingMesh.geometry.computeBoundingBox();
				buildingMesh.geometry.computeBoundingSphere();
				
				
				var bbox = new THREE.BoxHelper(buildingMesh);
				scene.add(bbox);

			})
			.start();

	}


	function visualiseWidth(buildingMesh,level,reset,child){
		let scalar = guiParams.widthScalar;
		let energyLevel = level.map(minEnergyLevel, maxEnergyLevel, minScale, maxScale)*scalar;

		buildingMesh.rotation.set(0,0,0);
		buildingMesh.updateMatrix();
		
		//to be able to reset to original height
		if(reset && buildingMesh.oldLevelX!==undefined)
			energyLevel = 1;
		
		if(buildingMesh.oldLevelX == undefined){							
			buildingMesh.oldLevelX = 1;
		}

		let start = 1/buildingMesh.oldLevelX;
		
		let timeout = 1500;
		//smooth the transistion between widths
		buildingMesh.geometry.computeBoundingSphere();
		var vecToCenter = buildingMesh.geometry.boundingSphere.center.clone();

		var tween = new TWEEN.Tween({scale:start} )
			.to( { scale: energyLevel }, timeout )
			.easing( TWEEN.Easing.Quadratic.InOut )
			.onUpdate( function () {

				var geometry = buildingMesh.geometry;
				//move to origon
				geometry.translate(-vecToCenter.x,-vecToCenter.y,-vecToCenter.z);
				//scale
				let val = buildingMesh.oldLevelX*this.scale;
				geometry.scale(val,1,val);
				buildingMesh.oldLevelX = 1/this.scale;
				//move back
				geometry.translate(vecToCenter.x,vecToCenter.y,vecToCenter.z);
				//show changes
				child.geometry.verticesNeedUpdate = true;
				console.log(geometry.boundingSphere);
				

			})
			.onComplete(function(){
				
				TWEEN.remove(tween);
				
				buildingMesh.geometry.computeBoundingBox();
				buildingMesh.geometry.computeBoundingSphere();
				console.log(buildingMesh);
				
			})
			.start();
			
	}


	function _getDistance(mesh1, mesh2) {
		
		mesh2.geometry.computeBoundingSphere();
		let center1 = mesh1.geometry.boundingSphere.center;
		let center2 = mesh2.geometry.boundingSphere.center;

		var dx = center1.x - center2.x;
		var dy = center1.y - center2.y;
	  	var dz = center1.z - center2.z;
	  	
	  	return Math.sqrt(dx*dx+dy*dy+dz*dz);
	}



	return{
		addGUI:function(){
			
			let heightFolder = gui.addFolder("Height");
			heightFolder.add(guiParams, 'heightActive').onChange(activationChanged);
			heightFolder.add(guiParams,'heightScalar',0,10).onChange(heightChanged);

			let widthFolder = gui.addFolder("Width");
			widthFolder.add(guiParams, 'widthActive').onChange(activationChanged);
			widthFolder.add(guiParams,'widthScalar',0,2).onChange(widthChanged);

			let colorFolder = gui.addFolder("Color");
			colorFolder.add(guiParams, 'colorActive').onChange(activationChanged);
			colorFolder.addColor(guiParams,'color').onChange(colorChanged);

			//didn't have time for this
			//let neighborsFolder = gui.addFolder("Neighbors");
			//neighborsFolder.add(guiParams, 'neighborsActive').onChange(activationChanged);
			//neighborsFolder.add(guiParams,'neighborsRadius',0,250).onChange(neighborsChanged);


			$("#guiHolder").append(gui.domElement);
			$("#guiHolder").show();
		},

		resetAllBuildings:function(){
			/*
			changedBuildingIds.forEach(function(id){
				console.log(id);
				playground.resetABuilding(id);
			});
			*/
			while(changedBuildingIds.length>0){
				let id = changedBuildingIds.pop();
				playground.resetABuilding(id);
			}
		},

		resetABuilding:function(buildingId){
			playground.visualiseBuildingChanges(1,buildingId,true);
			//remove id from list
			if($.inArray(name, subscriptions) !== -1) {
				changedBuildingIds.splice($.inArray(buildingId, changedBuildingIds), 1);
			}
			
			
		},

		visualiseBuildingChanges:function(serverityLevel, buildingId,reset){
			



			let buildingMesh = buildingObjects[buildingId];
			if(buildingMesh==undefined || buildingMesh.geoKey==undefined)
				return;

			
			if($.inArray(buildingId, changedBuildingIds)== -1 && !reset){
				changedBuildingIds.push(buildingId);
				//console.log(changedBuildingIds);
			}

			let name = "buildings-"+buildingMesh.geoKey;
			for(var i=0; i<scene.children.length;i++){

				if(scene.children[i].name.indexOf(name) !=-1){

					var child = scene.children[i];

					if(guiParams.colorActive || reset){
						//visualiseColors(buildingMesh, serverityLevel,reset);
						child.geometry.colorsNeedUpdate = true;
					}

					if(guiParams.heightActive || reset){
						visualiseHeight(buildingMesh,serverityLevel,reset,child);

					}

					if(guiParams.widthActive || reset){
						visualiseWidth(buildingMesh,serverityLevel,reset,child);
					}

					/*
					*didn't have time for this
					if(guiParams.neighborsActive){
						buildingMesh.geometry.computeBoundingSphere();

						var keyStart = buildingId-200;
						if(keyStart<0)
							keyStart=0;
						
						let targets = [];

						for(var k=keyStart; k<Object.keys(buildingObjects).length; k++){

							let distance = _getDistance(buildingMesh,buildingObjects[k]);
							if(distance>guiParams.neighborsRadius)
								continue;

							var level = distance.map(0, guiParams.neighborsRadius, 2, 0);
							var building = buildingObjects[k];
							building.kLevel = level;
							targets.push(building);
							//visualiseHeight(building,level,false,child);
							
							if(k>buildingId+200)
								break;
						}
						while(targets.length>0){
							target = targets.pop();
							setTimeout(function(){
								visualiseHeight(target,target.kLevel,false,child);
							},100);
							
						}
						
					}
					*/
					//found a match. Don't care about the rest
					break;

				}
			}
		}
	}

})();