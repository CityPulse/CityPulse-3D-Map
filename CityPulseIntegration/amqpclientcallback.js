//VARIABLES
var queueName = '3dmapqueue-ttl';
var exchange = 'events';
var routingKey = '#';
var N3 = require('n3');
var amqpEndpoint = 'amqp://guest:guest@131.227.92.55:8007';
var debug = true;
//END VARIABLES


// Consumer
function consumer(conn) {
	var ok = conn.createChannel(on_open);
	function on_open(err, ch) {
    		if (err != null) bail(err);    
    		ch.assertQueue(queueName, {"messageTtl": 600000});
                ch.bindQueue(queueName, exchange, routingKey);
		ch.consume(queueName, function(msg) {
      			if (msg !== null) {
				var parser = N3.Parser();
				var triples = [];
				var toSendToMap = false;
				var rdfMessage = msg.content.toString();
				//console.log(rdfMessage);
				parser.parse(rdfMessage,
                                	function (error, triple, prefixes) {
                                        	if (triple) {
                                                	triples.push(triple);
                                                	if(triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#TrafficJam" || 
								triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#PublicParking" ||
									triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#AarhusPollution" ||
										triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#AarhusNoiseLevel" ||
											triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#Twitter.Aarhus") {
                                                        					toSendToMap = true;
                                                	}
                                        	}
						else {
							//FINISHED PARSING THE RDFMESSAGE
							if(toSendToMap){
								var eventId, eventType, severityLevel, lat, long, date;
								
								var eventIdSplit = triples[0].subject.split('#');
								eventId = eventIdSplit[1];
								
								var eventTypeSplit = triples[0].object.split('#');
								eventType = eventTypeSplit[1];
								
								var eventSeveritySplit = triples[2].object.split('^^');
								severityLevel = eventSeveritySplit[0].split('"')[1];
																
								var eventLatSplit = triples[4].object.split('^^');
								lat = eventLatSplit[0].split('"')[1];

								var eventLongSplit = triples[5].object.split('^^');
								long = eventLongSplit[0].split('"')[1];

								var eventDateSplit = triples[8].object.split('^^');
								date = eventDateSplit[0].split('"')[1];

								if(debug) {
									console.log('-------EVENT BEGIN-----------');
									console.log("eventId: ", eventId, "eventType: ", eventType, "severityLevel: ", severityLevel, "lat: ", lat, "long: ", long, "date: ", date);
									console.log('--------EVENT END------------');
								}
								
							}
						}
                                	}
				
                        	);
				//ch.ack(msg);
      			}
    		});
  	}
}

require('amqplib/callback_api')
  .connect(amqpEndpoint, function(err, conn) {
    if (err != null) 
	bail(err);
    consumer(conn);
  });
