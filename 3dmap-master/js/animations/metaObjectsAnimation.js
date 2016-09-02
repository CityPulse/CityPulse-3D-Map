var objectAnimations = (function(){

	return{
		moveSun:function(time, isDay){
			let intensity = 1;
			if(!isDay){
				intensity = 0.2;
				let nightMaterial = new THREE.MeshBasicMaterial( {color: 0xE1E1D6} );
				sun.material = nightMaterial;
			}else{
				let dayMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
				sun.material = dayMaterial;
			}

			spotLight.intensity = intensity;

			let zPos = spotLight.position.z;
			let xPos = spotLightRadius*Math.cos(time);
			let yPos = spotLightRadius*Math.sin(time);
			spotLight.position.set(xPos,yPos,zPos);
			//visualize sun/moon on sky
			raycaster.set(new THREE.Vector3(0,0,0),spotLight.position);
			var intersects = raycaster.intersectObjects(scene.children);
			for(var i =0; i < intersects.length; i++){
				if(intersects[i].object.name==='sky'){
					let point = intersects[i].point;
					sun.position.set(point.x,point.y,point.z);
					break;	
				}
				
			}

		},

		addCameraPath:function(){
			console.log(camera.position);
			
			let x = camera.position.x;
			let y = camera.position.y;
			let z = camera.position.z;


			//test spline path
			pathCamera = new THREE.ClosedSplineCurve3( [

					initCameraPosition,
					new THREE.Vector3( -x, y, z),
					new THREE.Vector3( -x, y, -z),
					new THREE.Vector3( x, y, -z),
					new THREE.Vector3( 400, 200, 400 ),
					new THREE.Vector3( -400, 200, 400 ),
					new THREE.Vector3( -400, 200, -400 ),
					new THREE.Vector3( 400, 200, -400 ),
					//new THREE.Vector3( x-50, y-20, z-50),		
					//initCameraPosition
			] );

			console.log(pathCamera);

			let tubeGeo = new THREE.TubeGeometry(pathCamera);
			let tubeMat = new THREE.MeshBasicMaterial({
				color: 0x000000,
				opacity: 0.3,
				wireframe: true,
				transparent: false
			});
			let tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
			tubeMesh.name="cam";
			//scene.add(tubeMesh);
		}
	}

})();

