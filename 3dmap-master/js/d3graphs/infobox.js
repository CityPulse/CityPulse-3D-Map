///////////////////////////////////////////////////////////////
			//setup of D3.js for showing a graph of historical data
		    var svg = null;
			function setupInfoBox(data) {
				var margin = {top: 20, right: 20, bottom: 30, left: 20},
				    width = 220 - margin.left - margin.right,
				    height = 300 - margin.top - margin.bottom;

				var x = d3.scale.ordinal()
				    .rangeRoundBands([0, width], .1);

				var y = d3.scale.linear()
				    .range([height, 0]);

				var xAxis = d3.svg.axis()
				    .scale(x)
				    .orient("bottom");

				var yAxis = d3.svg.axis()
				    .scale(y)
				    .orient("left");

				svg = d3.select("#infoBox").append("svg")
				    .attr("width", width + margin.left + margin.right)
				    .attr("height", height + margin.top + margin.bottom)
				  .append("g")
				    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				x.domain(data.map(function(d) { return d.index; }));
				y.domain([0, d3.max(data, function(d) { return d.value; })]);

				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);

				svg.append("g")
					.attr("class", "y axis")
					.call(yAxis)
					.append("text")
					.attr("transform", "rotate(-90)")
					.attr("y", 6)
					.attr("dy", ".71em")
					.style("text-anchor", "end")
					.text("Energy");

				svg.selectAll(".bar")
					.data(data)
					.enter().append("rect")
					.attr("class", "bar")
					.attr("x", function(d) { return x(d.index); })
					.attr("width", x.rangeBand())
					.attr("y", function(d) { return y(d.value); })
					.attr("height", function(d) { return height - y(d.value); });
			}

			function updateInfoBox(data) {
				
			}