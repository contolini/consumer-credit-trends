'use strict';

var d3 = require( './d3/d3.js' );
var formatDates = require( './formatDates.js' );
var DATE_FILE_URL = 'https://raw.githubusercontent.com/cfpb/consumer-credit-trends/master/data/vol_data_AUT.csv';
var margin = {top: 0, right: 20, bottom: 20, left: 70};
var width = 770 - margin.left - margin.right;
var height = 300 - margin.top - margin.bottom;

// set the ranges
// @todo: update bottom range to equal the floor of the data set
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

var parseTime = d3.timeParse("%B %Y");

var valueline = d3.line()
      .x(function(d) { return x(d.month); })
      .y(function(d) { return y(d.num); });

// append the svg obgect to the #graph element
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("#line")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .classed("chart chart__line", true)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv(DATE_FILE_URL, function(error, data) {
  if (error) throw error;

  // format the data
  data.forEach(function(d) {
      var monthIndex = +d.month;
      d.month = +d.month;
      d.num = +d.num / Math.pow(10, 9);
      if (d.group == 'Seasonally Adjusted') {
        d.group = true;
      } else {
        d.group = false;
      }
      var humanDate = formatDates(monthIndex); // January 2000
      var parsedDate = parseTime(humanDate); // timestamp
      d.month = parsedDate;
  });

  // Set the projected date as 6 months from the last month in the data set
  var lastMonth = d3.max(data, function(d) {
    return d.month;
  });
  console.log('the last month in the data is from ' + lastMonth);
  var projectedDate = d3.timeMonth.offset(lastMonth, -5);  

  // Filter the data to get 2 sets for each line: Seasonally Adjusted and Unadjusted
  var adjustedData = data.filter(function(d) { return d.group == true && d.month <= projectedDate; });

  var unadjustedData = data.filter(function(d) { return d.group == false && d.month <= projectedDate; });

  // @todo: filter data to create 2 lines for the projected last 6 months, and style them dotted.
  // var today = new Date(); // change to last month of data
  // console.log(today);
  // console.log(projectedDate);

  console.log('the last 6 months of data starts with ' + projectedDate);
  var projectedAdjustedData = data.filter(function(d) { 
    return d.group == true && d.month >= projectedDate; // last 6 months; 
  });

  var projectedUnadjustedData = data.filter(function(d) { 
    return d.group == false && d.month >= projectedDate; // last 6 months;
  });

  var minY = d3.min(data, function(d) {
    return d.num
  });
  // @todo display on Y axis! 
  console.log(minY)

  // Scale the range of the data
  x.domain(d3.extent(data, function(d) {    
    return d.month;
  }));

  y.domain(d3.extent(data, function(d) {    
    return d.num; 
  }));

  // Add the valueline path for Seasonally adjusted data
  svg.append("path")
      .data([adjustedData])
      .classed("line line__adjusted", true)
      .attr("d", valueline);

  // Add Unadjusted line
  svg.append("path")
      .data([unadjustedData])
      .classed("line line__unadjusted", true)
      .attr("d", valueline);

  // Add Seasonally adjusted and Projected line
  svg.append("path")
    .data([projectedAdjustedData])
    .classed("line line__adjusted line__projected", true)
    .attr("d", valueline);

// Add Unadjusted and Projected line
  svg.append("path")
    .data([projectedUnadjustedData])
    .classed("line line__unadjusted line__projected", true)
    .attr("d", valueline);

  // Add the X Axis
  svg.append("g")
    .classed("axis axis__x", true)
    .attr("transform", "translate(0," + height + ")")
    .call( d3.axisBottom(x)
       .tickFormat(d3.timeFormat("%b %Y"))
    );

  // @todo: Add the projected data axis + tick
  // var projectedAxis = d3.svg.axis().scale(x)
  svg.append("g")
    .classed("axis axis__x axis__projected", true)
    // .attr("transform", "translate(0," + height + ")")
    .call( d3.axisBottom(x)
      // .tickFormat(d3.timeFormat("%b %Y"))
      .tickValues([projectedDate])
      .ticks(1).tickSize(height)
    );

  // Add the Y Axis
  svg.append("g")
    .classed("axis axis__y", true)
    .attr("transform", "translate(" + width + ",0)")
    .call(d3.axisLeft(y)
      .tickSize(width)
      .ticks(6)
    );

  // text label for the y axis
  svg.append("text")             
    .classed("axis-label", true)
    .attr( 'transform', 'rotate(-90)' )
    .attr( 'text-anchor', 'end' )
    .attr( 'x', -20 )
    .attr( 'y', -60 )
    .text( 'Loan volume (in billions of dollars)' );

});