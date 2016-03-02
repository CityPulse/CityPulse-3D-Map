"use strict";

function calculatePlaneBounds(data){
    var converter = new UtmConverter();

    $.each(data,function(i, item)
    {
        $.each(item.geometry.coordinates[0], function(j, itemTwo)
        {

            var utmResult= converter.toUtm({coord: [itemTwo[0], itemTwo[1]]});
            
            //Calculate bounding box
            if(utmResult.coord.x<minX)
            {
                minX=utmResult.coord.x;
            }
            if(utmResult.coord.y<minY)
            {
                minY=utmResult.coord.y;
            }

            if(utmResult.coord.x > maxX)
            {
                maxX=utmResult.coord.x;
            }
            if(utmResult.coord.y > maxY)
            {
                maxY=utmResult.coord.y;
            }
        });
        
    });

    planeX = maxX-minX+500;
    planeY = maxY-minY+500;
}


// get the building data
function createBuildingModels(data)
{
    var combinedMesh = [];
    
    var converter = new UtmConverter();


    var geometryList = [];
    var maxLen = data.length;
    //var maxLen = Math.round(data.length/noOfBuildingGeoSlice);
    

    $.each(data,function(i, item)
    {
        var rectShape = new THREE.Shape();
        var height=0;

        $.each(item.geometry.coordinates[0], function(j, itemTwo)
        {

            var utmResult= converter.toUtm({coord: [itemTwo[0], itemTwo[1]]});
            
            //Calculate bounding box
            if(utmResult.coord.x<minX)
            {
                minX=utmResult.coord.x;
            }
            if(utmResult.coord.y<minY)
            {
                minY=utmResult.coord.y;
            }

            if(utmResult.coord.x > maxX)
            {
                maxX=utmResult.coord.x;
            }
            if(utmResult.coord.y > maxY)
            {
                maxY=utmResult.coord.y;
            }
            
            if (j==0)
            {
                height=itemTwo[2];
                rectShape.moveTo(utmResult.coord.x, utmResult.coord.y);
            }
            else
            {
                rectShape.lineTo(utmResult.coord.x, utmResult.coord.y); 
            }

        });

        var geometry = new THREE.ExtrudeGeometry(rectShape, { amount: height, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.1, bevelThickness: 0.1 });
        var material = new THREE.MeshLambertMaterial( {color: "rgb(128,128,250)" });
        var building = new THREE.Mesh(geometry, material) ;     
        buildingObjects[i] = building;

        var fCenterX = minX + (maxX-minX)*0.5;
        var fCenterY = minY + (maxY-minY)*0.5;


        //Converting the 2D mapping to 3D mapping (shifting z and y coordinates)         
        for( var k = 0; k < building.geometry.vertices.length; k++ ) 
        {
            
            building.geometry.vertices[k].x -= fCenterX;
            building.geometry.vertices[k].y = building.geometry.vertices[k].y-fCenterY;

            if(building.geometry.vertices[k].z<0)
                building.geometry.vertices[k].z=0;

       }
       
       for( var k = 0; k < building.geometry.faces.length; k++ ) 
        {
            building.geometry.faces[k].readingId = i;
        }

        building.geometry.computeFaceNormals();


        building.rotation.x += -3.1415*0.5;
        building.updateMatrix();

        
        var geoKey = Math.floor(i/maxLen);
        if(geometryList[geoKey]==undefined){
            geometryList[geoKey] = new THREE.Geometry();
        }

        geometryList[geoKey].merge(building.geometry, building.matrix);
        
    });

    /*
    console.log("after each "+new Date());
    for(var i=0; i<Object.keys(buildingObjects).length;i++){
        var building = buildingObjects[i];

        
        
    }
    */
    var faceColorMaterial = new THREE.MeshLambertMaterial( { color: originalBuildingColor, vertexColors: THREE.VertexColors } );

    for(var o =0; o<geometryList.length; o++){
        combinedMesh.push(new THREE.Mesh(geometryList[o], faceColorMaterial));
    }

    buildRdy=true;
    //if(roadRdy)

    addMeshes(combinedMesh, true);
  
}


/*
// get the building data
function createBuildingModels(data)
{
	var combinedMesh = [];
	console.log("converted");
	var converter = new UtmConverter();


	var geometryList = [];
    //var maxLen = data.length;
	var maxLen = Math.round(data.length/noOfBuildingGeoSlice);
    

	$.each(data,function(i, item)
	{
		var rectShape = new THREE.Shape();
		var height=0;

		$.each(item.geometry.coordinates[0], function(j, itemTwo)
		{

			var utmResult= converter.toUtm({coord: [itemTwo[0], itemTwo[1]]});
			
            //Calculate bounding box
            if(utmResult.coord.x<minX)
            {
            	minX=utmResult.coord.x;
            }
            if(utmResult.coord.y<minY)
            {
            	minY=utmResult.coord.y;
            }

            if(utmResult.coord.x > maxX)
            {
            	maxX=utmResult.coord.x;
            }
            if(utmResult.coord.y > maxY)
            {
            	maxY=utmResult.coord.y;
            }
            
            if (j==0)
            {
            	height=itemTwo[2];
            	rectShape.moveTo(utmResult.coord.x, utmResult.coord.y);
            }
            else
            {
            	rectShape.lineTo(utmResult.coord.x, utmResult.coord.y); 
            }

        });

		var geometry = new THREE.ExtrudeGeometry(rectShape, { amount: height, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.1, bevelThickness: 0.1 });
		var material = new THREE.MeshLambertMaterial( {color: "rgb(128,128,250)" });
       	var rectMesh = new THREE.Mesh(geometry, material) ;		
       	buildingObjects[i] = rectMesh;

       	
	});
    console.log("after each "+new Date());
	for(var i=0; i<Object.keys(buildingObjects).length;i++){
		var building = buildingObjects[i];

		var fCenterX = minX + (maxX-minX)*0.5;
		var fCenterY = minY + (maxY-minY)*0.5;


        //Converting the 2D mapping to 3D mapping (shifting z and y coordinates)         
        for( var k = 0; k < building.geometry.vertices.length; k++ ) 
        {
        	
        	building.geometry.vertices[k].x -= fCenterX;
        	building.geometry.vertices[k].y = building.geometry.vertices[k].y-fCenterY;

        	if(building.geometry.vertices[k].z<0)
        		building.geometry.vertices[k].z=0;

       }
       
       for( var k = 0; k < building.geometry.faces.length; k++ ) 
        {
        	building.geometry.faces[k].readingId = i;
        }

		building.geometry.computeFaceNormals();


       	building.rotation.x += -3.1415*0.5;
    	building.updateMatrix();

    	
    	var geoKey = Math.floor(i/maxLen);
    	if(geometryList[geoKey]==undefined){
    		geometryList[geoKey] = new THREE.Geometry();
    	}

    	geometryList[geoKey].merge(building.geometry, building.matrix);
		
	}
	
	var faceColorMaterial = new THREE.MeshLambertMaterial( { color: originalBuildingColor, vertexColors: THREE.VertexColors } );

	for(var o =0; o<geometryList.length; o++){
		combinedMesh.push(new THREE.Mesh(geometryList[o], faceColorMaterial));
	}

	buildRdy=true;
	//if(roadRdy)

    addMeshes(combinedMesh, true);
  
}
*/






function createRoadModels(data){
    console.log("create roads");
    var roadMeshes = [];

    var converter = new UtmConverter();

    var material = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth:2});
    
    var singleGeometry = new THREE.Geometry();

    $.each(data,function(i, item)
    {

        var roadGeometry = new THREE.Geometry();
        roadGeometry.dynamic = false;
        
        $.each(item.geometry.coordinates, function(k, coordinate){


            var utmResult= converter.toUtm({coord: [coordinate[0], coordinate[1]]});
            
            roadGeometry.vertices.push(new THREE.Vector3(utmResult.coord.x,utmResult.coord.y,0));


        });
        

        var fCenterX = minX + (maxX-minX)*0.5;
        var fCenterY = minY + (maxY-minY)*0.5;
        for( var k = 0; k < roadGeometry.vertices.length; k++ ) {
                
            roadGeometry.vertices[k].x -= fCenterX;
            roadGeometry.vertices[k].y = roadGeometry.vertices[k].y-fCenterY;

            if(roadGeometry.vertices[k].z<0.2)
                
                roadGeometry.vertices[k].z=0.2;
        }
        
        roadGeometry.computeVertexNormals();
        var roadLine = new THREE.Line(roadGeometry, material);
        
        roadLine.rotation.x += -3.1415*0.5;
        roadLine.updateMatrix();
        var match = false;
        $.each(roadMeshes, function(i, mesh){
            
            var lineStart = roadLine.geometry.vertices[0];
            var lineVerticeLen = roadLine.geometry.vertices.length-1;
            var lineEnd = roadLine.geometry.vertices[lineVerticeLen];

            var meshGeo = mesh.geometry;
            var meshStart = meshGeo.vertices[0];
            
            var meshVerticeLen = meshGeo.vertices.length-1;
            var meshEnd = meshGeo.vertices[meshVerticeLen];
            

            if(lineStart.equals(meshEnd)){
                for(var ii=0;ii<roadLine.geometry.vertices.length; ii++){
                    mesh.geometry.vertices.push(roadLine.geometry.vertices[ii]);
                }

                match=true;
            }else if(lineEnd.equals(meshStart)){
                for(var ii=0;ii<mesh.geometry.vertices.length; ii++){
                    roadLine.geometry.vertices.push(mesh.geometry.vertices[ii]);
                }

                roadMeshes[i] = roadLine;
                match=true;
            }

        });
        if(!match)
            roadMeshes.push(roadLine);

    });

    addMeshes(roadMeshes, false);
    
}