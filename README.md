#3DMap

This application has been developed with the core goal to provide a 3D visualisation and experience to the users. By using it the users can “fly” around this 3D model of a city and visualise the effect of real-time data in the model. 
When starting the application the user can select on the top-left corner from different cities to be visualised (currently Danish cities of Aarhus, Copenhagen, Odense and Ry). After loading the model the user can on the top-right corner select the different data sources to be visualised in the map. The current version of the map is supporting visualisation of events of type parking, traffic, noise and pollution for the city of Aarhus. These events are detected by the CityPulse middleware in the background and then further displayed in the map in form of geo-localised pins. 
The map is also supporting visualisation of energy consumption in buildings in the city, where buildings’ heights’ are changing according to the current energy consumption levels. However this visualisation is currently only a demo, since we do not have yet access to the real consumption data in buildings for the city of Aarhus. 
This application has been conceptualised and developed to be modular, meaning that the user can add new cities and/or new data sources in a very simple way. 
The current elements the map renders are buildings, roads, waterfronts and trees. When initialising the visualisation of a city, the application takes a KML file for each of the map elements as input for visualisation. This means that if the user wants to add new models of cities, he/she needs to provide those data in form of KML file (you can browse under the folder “data/kml/” for the existing models).

#Integration with CityPulse
In order to have access to the real-time events information for the city of Aarhus the 3D map is connecting to the CityPulse Message Bus, to which it subscribes to messages of type “event”. This is done in the amqpclientcallback.js file under the “CityPulseIntegration” folder. After subscribing to this type of events the message bus client will be listening to incoming messages from the message bus. 
Moreover, and in order to be modular this component is providing a websocket connection to where the 3D map is connecting to in order to receive the updated information and render it. 

#System requirements

    Web server container e.g. Apache, JBoss, etc
    Nodejs installed with the following APIs:
        Websocket: https://www.npmjs.com/package/websocket
        amqplib: https://www.npmjs.com/package/amqplib 
        n3: https://www.npmjs.com/package/n3   


#Running the application

    deploy the 3D map into a web server container
    Open a terminal and browse the folder “CityPulseIntegration”. Run the amqpclientcallback.js by using the command
        node amqpclientcallback.js
    Open your browser and browse e.g. http://localhost/3dmap-master/3dmap-master/index.html


