#3DMap

In this application the user has a 3D overview of the city of Aarhus and can visualise energy consumption in buildings. There are two separate components: the WSServer and the 3Dmap - the first one is a web socket server that randoms buildings and energy consumptions and sends the information to all the connected clients. The reason to have this component is due to the fact that the energy consumption of buildings in the city of Aarhus is not yet available in the Open Dta portal of the city. The second one is a set of javascript files for the visualisation of the map and connection to the web socket server.
#System requirements

    Web server container e.g. Apache, JBoss, etc
    Nodejs installed with the websocket API.

#Running the application

    deploy the 3D map into a web server container
    Run the websocket server from the WSServer directory by using the command "node websocket.js" or "nodejs websocket.js"
    open your browser and browse e.g. http://localhost/3dmap-master/3dmap-master/index.html


