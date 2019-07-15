
var gTopic_label = { 0: "Automobile / Phones",
                1: "Government",
                2: "Education / Courses",
                3: "Celebrities / Individuals / Interviews",
                4: "Employment / Skills / Training",
                5: "Needs / Issues",
                6: "Degree / Education / Exams",
                7: "Investments / Insurance",
                8: "Economics / Budget / Finance / Loans",
                9: "English / Non-Telugu article",
                10: "Cooking / Recipes",
                11: "Unknown 1",
                12: "Unknown 2",
                13: "Sports / Cricket",
                14: "Health / Exercise / Nutrition / Weight"
                }


var gSvg;

//set default dimensions
var canvasH = 600, canvasW = 750, plotW = 600;

function onhover() {
	hoverNode = d3.select(this);
	hoverNode.attr("fill", "#00c2f6");
};

function onmouseout() {
	hoverNode = d3.select(this)

	hoverNode.attr("fill", "#aba7a2");

	d3.selectAll("#smallgraph").remove();
};

// Sort comparison function
compare = function (a,b) {

  if (a.cupop > b.cupop)
    return -1;
  if (a.cupop < b.cupop)
    return 1;

  return 0;
};

processData = function(res) {

	var dataset = [];
	var total_topics = 15

	for (let i = 0; i < total_topics; i++) {
		var dataItem = {};
		dataItem.topic_num = i;
		dataItem.topic_name = gTopic_label[i];

		if(res.topic_distribution[i] == null) {
			dataItem.weight = 0;
		}
		else {
			dataItem.weight = res.topic_distribution[i] * 100;
		}

		dataset.push(dataItem);
	}

	return dataset.sort(compare);
};

renderBarChart = function(svg, res) {

  // Set the global SVG variable first
  gSvg = svg;

  var data = processData(res);

  var itemSize = 40,
      cellSize = itemSize - 20,
      margin = {top: 0, right: 30, bottom: 30, left: 250};
      
   var y_elements = d3.set(data.map(function( item ) { return item.topic_name; } )).values();
   var y_weights = d3.set(data.map(function( item ) { return item.weight; } )).values();

    var yScale = d3.scaleBand()
        .domain(y_elements)
        .range([0, y_elements.length * itemSize]);

    var yAxis = d3.axisLeft(yScale)
        .tickFormat(function (d) {
            return d;
        });
 
    // ... is spread operator it spreads an array into the item list required for min, max operations
   var max = Math.max(...y_weights), min = Math.min(...y_weights);

    var shScale = d3.scaleLinear()
	.domain([min,max])
	.range([0,plotW-250]);
    
    // Translate SVG a bit further into the screen.
    svg = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var cells = svg.selectAll('rect')
        .data(data)
        .enter().append('g')
	.attr("class","cellparent")
	.attr('transform',function(d){ return 'translate(0,'+yScale(d.topic_name)+')';})
	.append('rect')
        .attr('class', 'cell')
        .attr('width', function(d){ return shScale(d.weight); })
        .attr('height', cellSize)
	.attr('fill','#aba7a2')
	.attr("id", function(d) { return d.topic_num; })
        .on('mouseover',onhover)
        .on('mouseout',onmouseout);


    // Element d is already with the node. Hence we can directly call like this
    svg.selectAll('.cellparent')
	.append('text')
	.attr("fill", "#000")
	.attr("x",function(d) {return shScale(d.weight)})
	.attr("y",cellSize/2)
	.attr("dy","0.30em")
	.attr("dx", "1em")
	.text(function(d) {return d.weight.toLocaleString() + "%";});

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .selectAll('text')
	.attr('fill','#000')
	.attr("dy","-0.5em")
        .attr('font-weight', 'normal');
};

plotGraph = function (svg, data, graphTitle, axesNames, scaling){

    var cStartX = plotW + 100 + 50, cStartY = 50, cPadding = 30;
    var pWidth = canvasW - cStartX - cPadding, pHeight = canvasH - 200;
    var itemSize = pWidth/5;

// Go for the ordinal scale
    var x_elements = d3.set(data.map(function( item ) { return item.year; } )).values(),
        y_elements = d3.set(data.map(function( item ) { return (item.grpct).toFixed(2); } )).values();

    var xScale = d3.scaleLinear()
        .domain([Math.min(...x_elements), Math.max(...x_elements)])
        .range([0, pWidth-cPadding]);

    var yScale = d3.scaleLinear()
        .domain([Math.min(...y_elements), Math.max(...y_elements)])
        .range([cStartY+pHeight-cPadding, cStartY]);

// Generate the X and Y axis in SVG
    //var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(d3.format("d")).ticks(5);
    //var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(5);
    var xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(5);
    var yAxis = d3.axisLeft(yScale).ticks(5);

//Create X axis

	svg = svg.append("g")
		 .attr("id", "smallgraph");

	svg.append("g")
		.attr("class", "smalline")
		.attr("transform", "translate(" + cStartX + "," + (cStartY + pHeight - cPadding) + ")")
		.call(xAxis);

	//Create Y axis
	svg.append("g")
		.attr("class", "smalline")
		.attr("transform", "translate(" + cStartX + ",0)")
		.call(yAxis);

	// Add labels
	svg.append("g")
		.attr("class", "axislabel")
		.attr("transform", "translate(" + cStartX + ","+ (cStartY - 5) +")")
		.append("text")
		.attr("dx","-3em")
		.text("Pct %");

	svg.append("g")
		.attr("class", "axislabel")
		.attr("transform", "translate(" + (cStartX + pWidth - cPadding) + ","+ (cStartY + pHeight - cPadding) +")")
		.append("text")
		.attr("dy","3em")
		.text("Year");

	var line = d3.line()
		     .x(function(d) {return xScale(d.year);})
		     .y(function(d) {return yScale(d.grpct);});

	svg.append("path")	
		.attr("class", "graphline")
		.attr("transform", "translate(" + cStartX + ",0)")
		.attr("d", line(data))
		.attr("fill","none")
		.attr("stroke","steelblue");

};
