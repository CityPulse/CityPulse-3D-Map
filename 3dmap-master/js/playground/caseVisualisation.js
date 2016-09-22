var playground = (function(){

	var changedBuildingIds = {};
	var activeVisualisers = {};
	var maxEnergyLevel = 2;
	var minEnergyLevel = 0;
	
	var maxScale = 6;
	var minScale = 1;

	var gui = new dat.GUI({
	    height : 3 * 32 - 1,
	    autoPlace: false
	});

	var guiParams = {

		colorActive:true,
		color: 0xffffff,

		heightActive:true,
		heightScalar:1,

		widthActive:false,
		widthScalar:1,
		
	};


	function _populateActiveVisualisers(){
		//always hold a list of the active visualisers for data from server
		activeVisualisers = {};
		for(let param in guiParams){
			if(param.indexOf("Active")!==-1 && guiParams[param]){
				switch(param){
					case "colorActive":
						 activeVisualisers["colorActive"] = visualiseColors;
						break;
					case "heightActive":
						activeVisualisers["heightActive"] = visualiseHeight;
						
						break;
					case "widthActive":
						activeVisualisers["widthActive"] = visualiseWidth;
						
						break;
				}
			}
			
		}
	}

	function activationChanged(){
		
		let newValue = !this.__prev;
		let property = this.property;

		_populateActiveVisualisers();

		let newVisualiser = {};

		switch(property){
			case "colorActive":
				newVisualiser["colorActive"] = visualiseColors;
				break;
			case "heightActive":
				newVisualiser["heightActive"] = visualiseHeight;
				break;
			case "widthActive":
				newVisualiser["widthActive"] = visualiseWidth;
				break;
		}

		for(let buildingId in changedBuildingIds){
			let buildingMesh = buildingObjects[buildingId];
			if(buildingMesh==undefined || buildingMesh.geoKey==undefined)
				return;

			updateBuildings(buildingMesh,changedBuildingIds[buildingId],!newValue,newVisualiser);
		}

	}


	function attributeChanged(){
		let property = this.property;
		if(property.indexOf("color")!==-1){
			property +="Active";
		}else{
			let sIndex = property.indexOf("Scalar");
			property = property.substring(0,sIndex)+"Active";
		}
		

		
		if(activeVisualisers[property]===undefined)
			return;


		let changedVisualiser = {};
		changedVisualiser[property] = activeVisualisers[property];

		for(let buildingId in changedBuildingIds){
			let buildingMesh = buildingObjects[buildingId];
			if(buildingMesh==undefined || buildingMesh.geoKey==undefined)
				return;
			updateBuildings(buildingMesh,changedBuildingIds[buildingId],false,changedVisualiser);
		}
	}



	function visualiseColors(buildingMesh, level, reset, child){
		var maxHex = 16777215;
		var meshFaces = buildingMesh.geometry.faces;

		var buidlingColor = 0xffffff;
		if(!reset){
			let color = guiParams.color;
			buidlingColor = Math.round((level.map(minEnergyLevel,maxEnergyLevel,maxHex,0)+color)%maxHex);
			//console.log(buidlingColor);
			buidlingColor = "0x"+buidlingColor.toString(16);
		}
		console.log(buidlingColor);
		
		for(var j = 0; j<meshFaces.length;j++){
			meshFaces[j].color.setHex(buidlingColor);
		}
		
		
		console.log(buildingMesh);
		child.geometry.colorsNeedUpdate = true;
	}



	function visualiseHeight(buildingMesh,level,reset,child){
		
		let scalar = guiParams.heightScalar;
		let energyLevel = level.map(minEnergyLevel, maxEnergyLevel, minScale, maxScale)*scalar;
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
				//scene.add(bbox);

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
				
				

			})
			.onComplete(function(){
				
				TWEEN.remove(tween);
				
			})
			.start();
			
	}


	function updateBuildings(buildingMesh,level,reset,functions){
		let name = "buildings-"+buildingMesh.geoKey;
		
		for(var i=0; i<scene.children.length;i++){

			if(scene.children[i].name.indexOf(name) !=-1){

				var child = scene.children[i];
				for(let key in functions){
					let visualiser = functions[key];
					
					visualiser(buildingMesh,level,reset,child);
				}

				//found a match. Don't care about the rest
				break;

			}
		}
	}




	return{
		addGUI:function(){
			
			let heightFolder = gui.addFolder("Height");
			heightFolder.add(guiParams, 'heightActive').onChange(activationChanged);
			heightFolder.add(guiParams,'heightScalar',0.01,10).onChange(attributeChanged);

			let widthFolder = gui.addFolder("Width");
			widthFolder.add(guiParams, 'widthActive').onChange(activationChanged);
			widthFolder.add(guiParams,'widthScalar',0.01,2).onChange(attributeChanged);

			let colorFolder = gui.addFolder("Color");
			colorFolder.add(guiParams, 'colorActive').onChange(activationChanged);
			colorFolder.addColor(guiParams,'color').onChange(attributeChanged);

			$("#guiHolder").append(gui.domElement);
			
		},

		resetAllBuildings:function(){
			
			for(let key in changedBuildingIds){
				console.log('info');
				playground.resetABuilding(key);
				console.log("af ino");
				delete changedBuildingIds[key];
			}

			
		},

		resetABuilding:function(buildingId){
			
			
			let buildingMesh = buildingObjects[buildingId];
			if(buildingMesh==undefined || buildingMesh.geoKey==undefined)
				return;
			updateBuildings(buildingMesh,1,true,activeVisualisers);
			
			
		},

		visualiseBuildingChanges:function(serverityLevel, buildingId,reset){

			//just to make sure that we have a updated list, the first time it is started
			_populateActiveVisualisers();
			
			let buildingMesh = buildingObjects[buildingId];
			if(buildingMesh==undefined || buildingMesh.geoKey==undefined)
				return;

			
			if($.inArray(buildingId, changedBuildingIds)== -1 && !reset){
				changedBuildingIds[buildingId] = serverityLevel;

			}
			updateBuildings(buildingMesh,serverityLevel,reset,activeVisualisers);
		}
	}

})();