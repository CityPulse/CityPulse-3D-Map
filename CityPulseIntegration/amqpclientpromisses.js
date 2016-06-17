//VARIABLES
var queueName = '3dmapqueue'; 
var exchange = 'events';
var routingKey = '#';
var N3 = require('n3');
var amqpEndpoint = 'amqp://xpto:xpto@127.0.0.1:8007';
//END VARIABLES
 

    var openConn = require('amqplib').connect(amqpEndpoint); 

    var toSendToMap = false;
    var triples = [];
//    var parser = N3.Parser();
    openConn.then(function(conn) { 
    	
	var ok = conn.createChannel(); 

   	ok = ok.then(function(channel) { 

        	channel.assertQueue(queueName); 
 	
		channel.bindQueue(queueName, exchange, routingKey);
		
    		channel.consume(queueName, function(msg) { 
 			
			var parser = N3.Parser();	
			var rdfMessage = msg.content.toString();			
			//console.log("------BEGIN------");
	
			console.log("will parse new message, nTriples : ", triples.length);
			parser.parse(rdfMessage, 
             			function (error, triple, prefixes) {
               				if (triple) {
						triples.push(triple);
						//console.log("push: ", triples.length);
						if(triple.object.toString() == "http://purl.oclc.org/NET/UNIS/sao/ec#TrafficJam"){
							toSendToMap = true;
							//console.log("------------BEGIN RDF-------------");
                                			//console.log(rdfMessage);
                                			//console.log("-------------END RDF--------------");	
						}
					}
					//console.log("rdf: ", rdfMessage);	
					//console.log("subject: ",triple.subject, "predicate: ",triple.predicate, "object: ", triple.object, '.');
             			}
			);
			//console.log("rdf: ", rdfMessage);
			console.log("message parsed, nTriples: ", triples.length);
			if(toSendToMap) {
				//console.log("----------BEGIN TRIPLE------------");
				//for(var i = 0; i < triples.length; i++) {
				//	console.log("subject: ", triples[i].subject, "predicate: ", triples[i].predicate, "object: ", triples[i].object);					
				//}
				//console.log("-----------END TRIPLE-------------");
				toSendToMap = false;
			}
			triples = [];
		
    		//channel.ack(msg); 
		}
		); 
 
    	}); 
	return ok;
 
    }).then(null, console.warn);

    
