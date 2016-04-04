"use strict";

var converter = new UtmConverter();

function calculatePlaneBounds(data){
    
    $.each(data,function(i, item)
    {   
        if(item.geometry.type==='GeometryCollection'){
            $.each(item.geometry.geometries, function(k, geometry){
                _calculateConcretePlaneBounds(geometry.coordinates[0]);
            });
        }else{
            _calculateConcretePlaneBounds(item.geometry.coordinates[0]);
        }
        
    });

    planeX = maxX-minX+750;
    planeY = maxY-minY+750;
    
      
}

function _calculateConcretePlaneBounds(data){
    //$.each(item.geometry.coordinates[0], function(j, itemTwo)
    $.each(data, function(j, itemTwo)
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
}


// get the building data
function createBuildingModels(data)
{
    var combinedMesh = [];
    
    

    var geometryList = [];

    var maxLen = Math.round(data.length/noOfBuildingGeoSlice);
    if(maxLen===0){
        maxLen=1;
    }

    $.each(data,function(i, item)
    {   
        
        var geoKey = Math.floor(i/maxLen);
        if(geometryList[geoKey]==undefined){
            geometryList[geoKey] = new THREE.Geometry();
        }

        var building = null;
        if(item.geometry.type==='GeometryCollection'){
            
            $.each(item.geometry.geometries, function(k, geometry){
                building = _createConcreteBuildingModels(geometry.coordinates[0],i);
                buildingObjects[i] = building;
                geometryList[geoKey].merge(building.geometry, building.matrix);
                
            });
        }else{
            
            building = _createConcreteBuildingModels(item.geometry.coordinates[0],i);
            buildingObjects[i] = building;
            geometryList[geoKey].merge(building.geometry, building.matrix);
            
        } 
        
    });


    var faceColorMaterial = new THREE.MeshLambertMaterial( { color: originalBuildingColor, vertexColors: THREE.VertexColors } );

    for(var o =0; o<geometryList.length; o++){
        combinedMesh.push(new THREE.Mesh(geometryList[o], faceColorMaterial));
    }


    addMeshes(combinedMesh, "buildings");
  
    
}




function _createConcreteBuildingModels(data, buildingId){

    var rectShape = new THREE.Shape();
    var height=0;

    $.each(data, function(j, itemTwo)
    {
        
        var utmResult= converter.toUtm({coord: [itemTwo[0], itemTwo[1]]});
                    
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
        building.geometry.faces[k].readingId = buildingId;
    }

    building.geometry.computeFaceNormals();


    building.rotation.x += -3.1415*0.5;
    building.updateMatrix();

    return building;
}




function createRoadModels(data){
    console.log("create roads len:"+data.length);
    var roadMeshes = [];


    var material = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth:2});
    

    var fCenterX = minX + (maxX-minX)*0.5;
    var fCenterY = minY + (maxY-minY)*0.5;

    $.each(data,function(i, item)
    {

        var roadGeometry = new THREE.Geometry();
        roadGeometry.dynamic = false;
        
        $.each(item.geometry.coordinates, function(k, coordinate){

            
            var utmResult= converter.toUtm({coord: [coordinate[0], coordinate[1]]});

            var vertex = new THREE.Vector3(utmResult.coord.x,utmResult.coord.y,0);
            vertex.x -= fCenterX;
            vertex.y = vertex.y-fCenterY;
            if(vertex.z<0.2)
                vertex.z = 0.2;
            //to make sure that roads do not go outside the plane.
            //the plane is calculated on the basis of building position
            var boundaryX = planeX/2;
            var boundaryY = planeY/2;
            if(Math.abs(vertex.x)<boundaryX && Math.abs(vertex.y)<boundaryY){
                roadGeometry.vertices.push(vertex);    
            }
            

        });
        var col = '#'+Math.floor(Math.random()*16777215).toString(16);
        //var material = new THREE.LineBasicMaterial({color: col, linewidth:2});

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
    console.log("no roads: "+roadMeshes.length);
    addMeshes(roadMeshes, "roads");

    
}






function createWaterModels(data){
    console.log("create water");
    var waterMeshes = [];


    //var material = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth:2});
    var material = new THREE.MeshLambertMaterial( {color: "rgb(128,128,250)" });

    var fCenterX = minX + (maxX-minX)*0.5;
    var fCenterY = minY + (maxY-minY)*0.5;

    var geometries = new THREE.Geometry();
    var outerGeometry = new THREE.Geometry();
    var innerGeometry = new THREE.Geometry();
    

    $.each(data,function(i, item)
    {
        if(i<3){
            //console.log(item);
        }
        
        var water = null;

        if(item.geometry.type==='GeometryCollection'){
            
            $.each(item.geometry.geometries, function(k, geometry){
                water = _createConcreteWaterModels(geometry.coordinates[0]);
                water = _placeWaterMesh(water);
                //console.log(geometry);
                if(geometry.boundaryType==="innerBoundaryIs"){
                   
                    innerGeometry.merge(water.geometry, water.matrix);
                }else{
                    outerGeometry.merge(water.geometry, water.matrix);
                } 

            });
        }else{
            
            water = _createConcreteWaterModels(item.geometry.coordinates[0]);
            water = _placeWaterMesh(water);
            
            if(item.geometry.boundaryType==="innerBoundaryIs"){
             
                innerGeometry.merge(water.geometry, water.matrix);
            }else{
                outerGeometry.merge(water.geometry, water.matrix);
            }
        }        
    });
    
    var outerMesh = new THREE.Mesh(outerGeometry);
    var outer_bsp = new ThreeBSP(outerMesh);

    var innerMesh = new THREE.Mesh(innerGeometry);
    var inner_bsp = new ThreeBSP(innerMesh);

    var subtract_bsp = outer_bsp.subtract(inner_bsp);
    
    var waterMesh = subtract_bsp.toMesh(material);
    
    waterMeshes.push(waterMesh);    
    addMeshes(waterMeshes, "water");
    
}




function _placeWaterMesh(mesh){
    //TOOD: move this in _createConcreteWaterModels
    mesh.geometry.computeFaceNormals();
    mesh.rotation.x += -3.1415*0.5;
    mesh.updateMatrix();
    return mesh;
}


function _createConcreteWaterModels(data){

    var rectShape = new THREE.Shape();
    var height=0.1;
    
    $.each(data, function(k, coordinate){

        var utmResult= converter.toUtm({coord: [coordinate[0], coordinate[1]]});
        
        if (k==0)
        {
            rectShape.moveTo(utmResult.coord.x, utmResult.coord.y);
        }
        else
        {
            rectShape.lineTo(utmResult.coord.x, utmResult.coord.y); 
        }

    });
    
    
    var geometry = new THREE.ExtrudeGeometry(rectShape, { amount: height, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.1, bevelThickness: 0.1 });
    
    var water = new THREE.Mesh(geometry) ;     
    

    var fCenterX = minX + (maxX-minX)*0.5;
    var fCenterY = minY + (maxY-minY)*0.5;


    //Converting the 2D mapping to 3D mapping (shifting z and y coordinates)         
    for( var k = 0; k < water.geometry.vertices.length; k++ ) 
    {
        
        water.geometry.vertices[k].x -= fCenterX;
        water.geometry.vertices[k].y = water.geometry.vertices[k].y-fCenterY;

        if(water.geometry.vertices[k].z<0)
            water.geometry.vertices[k].z=0;

   }
   return water;
}






function createTreesModels(data){

    var combinedGeo = new THREE.Geometry();
    
    var material = new THREE.MeshBasicMaterial({color:0x006400});

    var fCenterX = minX + (maxX-minX)*0.5;
    var fCenterY = minY + (maxY-minY)*0.5;
    var meshes = [];

    $.each(data, function(k, item){
        
        var coordinate = item.geometry.coordinates;
        var utmResult= converter.toUtm({coord: [coordinate[0], coordinate[1]]});
        var height = coordinate[2];
        
        var geometry = new THREE.CylinderGeometry(2,2,2*height,8);
        
        var m = new THREE.Matrix4();
        
        m.makeTranslation(utmResult.coord.x, 0, utmResult.coord.y);
        
        geometry.applyMatrix(m);
        
        var cylinder = new THREE.Mesh(geometry, material);
            
        //make sure trees are placed on the plane, not below it    
        geometry.computeBoundingBox();
        if(geometry.boundingBox.max.y>0){
            var translate = geometry.boundingBox.max.y;
            var m = new THREE.Matrix4();
            m.makeTranslation(0, -translate, 0);
            geometry.applyMatrix(m);
        }

        var fCenterX = minX + (maxX-minX)*0.5;
        var fCenterY = minY + (maxY-minY)*0.5;


        //Converting the 2D mapping to 3D mapping (shifting z and y coordinates)         
        for( var k = 0; k < cylinder.geometry.vertices.length; k++ ) 
        {
            
            cylinder.geometry.vertices[k].x -= fCenterX;
            cylinder.geometry.vertices[k].z = cylinder.geometry.vertices[k].z-fCenterY;

       }
        
        combinedGeo.merge(cylinder.geometry, cylinder.matrix);

    });
    
    combinedGeo.dynamic=false;
    var treeMesh = new THREE.Mesh(combinedGeo,material);
    treeMesh.rotation.x += 3.1415;
    treeMesh.updateMatrix();
    meshes.push(treeMesh);
    addMeshes(meshes,"trees");
}
