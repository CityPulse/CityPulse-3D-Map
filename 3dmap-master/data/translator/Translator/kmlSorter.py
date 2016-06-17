### IMPORTS ###
## KML ##
from copy import deepcopy
from math import floor
import sys, argparse
from time import time

from lxml import etree
from pykml import parser as kml_parser 
from pykml.factory import KML_ElementMaker as KML

import numpy as np



def locate_centroid(coords):
    #points must be in clockwise (or counterclockwise) order on the boundary for this to work
    #coords = coords[ind]
    ##create shifted array so that it starts with the second point
    #coords_loop = np.zeros(coords.shape)
    #coords_loop[:-1,:] = coords[1:,:]
    #coords_loop[-1,:] = coords[1,:]
    ##compute area
    #area = 0.5 * np.sum(coords[:,0]*coords_loop[:,1] - coords[:,1]*coords_loop[:,0])
    ##compute centroid
    #cx = 1./(6*area) * np.sum((coords[:,0]+coords_loop[:,0])*(coords[:,0]*coords_loop[:,1] - coords[:,1]*coords_loop[:,0]))
    #cy = 1./(6*area) * np.sum((coords[:,1]+coords_loop[:,1])*(coords[:,0]*coords_loop[:,1] - coords[:,1]*coords_loop[:,0]))
    
    #take mean of points instead as approximation
    
    cx, cy = np.mean(coords[:,0]), np.mean(coords[:,1])
    return cx,cy



def get_grid_numbers(coords,n):
    
    
    max_x, min_x = np.max(coords[:,0]), np.min(coords[:,0])
    max_y, min_y = np.max(coords[:,1]), np.min(coords[:,1])    
    grid_size_x = (max_x - min_x) / float(n)
    grid_size_y = (max_y - min_y) / float(n)
    
    grid_numbers = np.zeros(coords.shape[0])
    
    for i,coord in enumerate(coords):
        x,y = coord[0], coord[1]
        y_ind = floor((y - min_y) / grid_size_y)
        x_ind = floor((x - min_x) / grid_size_x)
        
        #make sure that for those coords which are the maximum lie in a valid grid number
        if y_ind == n : y_ind = n-1
        if x_ind == n : x_ind = n-1
        grid_numbers[i] = y_ind * n + x_ind
        
    
    return grid_numbers
    
    
    
def main():

    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter,
                                        description='Given a KML file containing placemarks represented as polygons,\n\
                                                     this scripts sorts the placemarks based on their centroid coordinates\n\
                                                     and writes them into a new KML file.')
            
    parser.add_argument('-i','--input', required=True, metavar='<input_file>',
                            help='Path to the inputfile.')
    parser.add_argument('-o','--output', required=True, metavar='<output_file>',
                            help='Specifies the output file.')
    parser.add_argument('-n', type=int, default=10, required=False, metavar='<grid_size>',
                            help='Specifies the grid size nxn. (default: n=10')
    
    
    
    
    #parse arguments
    args = parser.parse_args()
    kml_file = args.input
    
    sys.stdout.write('Reading file %s\n' % kml_file)
    sys.stdout.flush()
    
    
    
    name = None;
    with open(kml_file) as f:
        #first retrieving any header for use when creating new file
        header = f.readline().encode('utf-8')
        #parsing the kml document 
        doc = kml_parser.parse(f).getroot().Document.Folder
        name = doc.name
        f.close()
    
    
    sys.stdout.write('Sorting placemarks based on coordinates.\n')
    sys.stdout.flush()
    
    start = time()
    building_coordinates = []
    
    
    #iterate through all children of folder which are a placemark
    for pm in doc.Placemark:
        #get to the coordinates
        coordinates_string = pm.Polygon.outerBoundaryIs.LinearRing.coordinates.text
        coordinates = coordinates_string.split()
        xy_coords = []
        for c in coordinates:
            coord = list(map(float,c.split(',')[:2]))
            
            xy_coords.append(coord)
        
        cx,cy = locate_centroid(np.array(xy_coords))
        building_coordinates.append([cx,cy])
        
    building_coordinates = np.array(building_coordinates)
    
    #calculate the number of the grid quadrant a polygon lies in
    if args.n > 1: grid_numbers = get_grid_numbers(building_coordinates,args.n)
    
    #sort indeces first based on x than y
    sort_indeces = np.lexsort((building_coordinates[:,1],building_coordinates[:,0]))
    
    
    
    #create the new KML document structure for adding the placemarks
    new_doc = KML.Kml(
            KML.Document(
                KML.Folder(
                           name
                           )
                        )
                  )
    
    children = doc.Placemark
    
    #iterate through all children of folder which are a placemark
    for i in sort_indeces:
        placemark = children[i]
        
        
        if args.n > 1:
            cur_grid_number = grid_numbers[i]
            #create description tag
            descrp = KML.description('grid_n=%i' % int(cur_grid_number))

            placemark.append(descrp)
        
        pm = deepcopy(placemark)
        new_doc.Document.Folder.append(pm)
        
        i += 1
        
        
    sys.stdout.write('%i buildings sorted in %.2f sec.\n' % (len(sort_indeces),time()-start))
    sys.stdout.write('Writing new kml file.\n')
    sys.stdout.flush()
    
    
    new_file = open(args.output,'wb')
    new_file.write(header)
    new_kml = etree.tostring(new_doc, pretty_print=True)
    #print(new_kml)
    new_file.write(new_kml)
    new_file.close()

if __name__ == "__main__":
    main()
