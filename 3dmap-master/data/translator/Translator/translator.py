from math import sqrt, floor
from os import path

from lxml import etree
from pykml import parser
from pykml.factory import KML_ElementMaker as KML

import numpy as np



class MapObject:

    def __init__(self, placemark, centroid, coords):
        self.placemark = placemark
        self.centroid = centroid
        self.coords = coords


class MapSquare:

    def __init__(self, squareId, br):
        self.squareId = squareId
        self.br = br

def createList(coordsString):
    coordList = []
    subString = coordsString.text.split(" ")
    for cordStr in subString:
        coord = cordStr.split(",")
        coordList.append([float(i) for i in coord[:2]])

    return coordList



def getNorthWestCoordinate(coordList):

    #for coord in coordList:
        #print(coord)
    coordList.sort(key=lambda x: x[0])
    coordList.sort(key=lambda x: x[1], reverse=True)
    #print(coordList)
    #print('\n')
    #print(len(coordList))
    #print('\n')

    return coordList[0]

def getSouthEastCoordinate(coordList):
    coordList.sort(key=lambda x: x[1])
    coordList.sort(key=lambda x: x[0], reverse=True)

    return coordList[0]


def sortPlacemarks(placemarks):
    #for mark in placemarks:
        #print(mark.nwCoord)
        #sys.exit(0)
    res = sorted(placemarks, key=lambda x: x.centroid[0])
    res = sorted(res,key=lambda x: centroid[1], reverse=True)
    anchor = res[0].centroid

    res = sorted(res,key=lambda p: sqrt((p.centroid[0]-anchor[0])**2 + (p.centroid[1]-anchor[1])**2))

    return res


def createSquaresList(tl, br, divider):
        nwCoord = tl.centroid
        brcoordinates =  br.placemark.Polygon.outerBoundaryIs.LinearRing.coordinates
        brCoords = createList(brcoordinates)
        seCoord = getSouthEastCoordinate(brCoords)

        print(nwCoord)
        print(seCoord)
        width = abs(nwCoord[0] - seCoord[0])
        height = abs(nwCoord[1]- seCoord[1])

        length = max(width, height)

        d = length/int(divider)
        c =  [i*d+d/2 for i in range(int(divider))]

        squares = [(x,y) for x in c for y in c]

        x = 0
        movedSquares = []
        for sq in squares:
            newPoint = (sq[0]+nwCoord[0], sq[1]+nwCoord[1])
            movedSquares.append(MapSquare(x,newPoint))
            x=x+1

        return movedSquares

def locate_centroid(coords):
    cx, cy = np.mean(coords[:,0]), np.mean(coords[:,1])
    return cx,cy


def get_grid_numbers(mapObjects,n):
    coords = np.array([o.coords for o in mapObjects][0])
    #coords = coords[0]

    max_x, min_x = np.max(coords[:,0]), np.min(coords[:,0])
    max_y, min_y = np.max(coords[:,1]), np.min(coords[:,1])
    grid_size_x = (max_x - min_x) / float(n)
    grid_size_y = (max_y - min_y) / float(n)

    print(str(max_x)+"  "+str(min_x))
    print(grid_size_y)
    for mapObject in mapObjects:
        x,y = mapObject.centroid[0], mapObject.centroid[1]
        y_ind = floor((y - min_y) / grid_size_y)
        x_ind = floor((x - min_x) / grid_size_x)
        #make sure that for those coords which are the maximum lie in a valid grid number
        if y_ind == n : y_ind = n-1
        if x_ind == n : x_ind = n-1

        grid_no = y_ind * n + x_ind + 1

        mapObject.grid_no = grid_no

    return mapObjects


kml_file = path.join('../../', 'kml/8k/buildings.kml')
name = None;
with open(kml_file) as f:

    doc = parser.parse(f).getroot().Document.Folder
    name = doc.name
    placeMarks = []

    for pm in doc.Placemark:
        coords = pm.Polygon.outerBoundaryIs.LinearRing.coordinates
        coords = createList(coords)
        cx,cy = locate_centroid(np.array(coords))
        centroid = [cx, cy]

        mapObject = MapObject(pm, centroid, coords)

        placeMarks.append(mapObject)



    sortedPlacemarks = sortPlacemarks(placeMarks)
    griddedPlacemarks = get_grid_numbers(placeMarks, 3)
    #squareList = createSquaresList(sortedPlacemarks[0],sortedPlacemarks[len(sortedPlacemarks)-1],3)


    #sortedPlacemarks = sortedPlacemarks[:2000]

    if name == None:
        name = KML.name("No Name")

    doc = KML.Kml(
            KML.Document(
                KML.Folder(
                           name
                           )
                        )
                  )

    #for sor in sortedPlacemarks:
     #   squareId = 0
        #print(sor.nwCoord[1])
      #  for square in squareList:
            #print(str(square.br[0]) +" <  "+str(sor.nwCoord[0])+" AND  "+str(square.br[1])+" <  "+str(sor.nwCoord[1]))
            #print(square.squareId)
       #     if sor.centroid[0] < square.br[0] and sor.centroid[1] < square.br[1]:
        #        squareId = square.squareId
         #       break
        #sor.placemark.append(KML.description("geo-"+str(squareId)))
    for object in griddedPlacemarks:
        object.placemark.append(KML.description("geo-"+str(object.grid_no)))
        doc.Document.Folder.append(object.placemark)

    #print(etree.tostring(doc, pretty_print=True))


    if placeMarks == sortedPlacemarks:
        print("equal")
    else:
        print("changed")

    savePath = path.join('../../', 'kml/8k/sortedbuildings.kml')
    newKmlFile = open(savePath,'wb')
    new_kml = etree.tostring(doc, pretty_print=True)
    newKmlFile.write(new_kml)
    newKmlFile.close()
    print('done')
    #print(doc)
