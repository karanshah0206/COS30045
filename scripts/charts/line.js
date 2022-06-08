/*********************************
   LINE CHART EVENTS & FUNCTIONS
 *********************************/

// Render Line Chart On Secondary Chart
function drawLineChart(region, initialYear) {
  // Update Chart Heading
  if (region == "World") {
    chart2Heading.innerHTML = "Global Annual CO<sub>2</sub> Emissions (Million Tonnes)";
    region = "Total World";
  }
  else if (region.length > 16) chart2Heading.innerHTML = region.slice(0, 13) + "... Annual CO<sub>2</sub> Emissions (Million Tonnes)";
  else chart2Heading.innerHTML = region + " Annual CO<sub>2</sub> Emissions (Million Tonnes)";

  // Clear Out Any Existing Charts
  d3.select("#"+chart2.id).selectAll("svg").remove();

  // Initialise Dimensions
  let w = chart2.offsetWidth, h = chartHeight;
  let xPadding = 40, yPadding = 55;

  // Render SVG On DOM
  let svg = d3.select("#"+chart2.id).append("svg").attr("height", h).attr("width", w);

  // Get Data From CSV File
  d3.csv("./datasets/annual-emissions-co2.csv").then((data) => {
    // Filter Data Specific To Active Region
    let lineData = data.filter((d) => { return d.country == region; })[0];
    let dataset = [], years = [];

    // If No Data Available For Selected Region
    if (lineData == undefined) svg.append("text").attr("x", w/2 - 10).attr("y", h/2).text("No Data For '" + region + "'!");
    else {
      // Initialise Data For Line Chart
      for (let i = 1966; i <= 2020; i++)
        if (lineData[i] != "n/a") {
          dataset.push(lineData[i]); // Store Data Points For Each Year In Array
          years.push(i); // Store All Years In Ordered Array
        }

      // Initialise Axes & Scales
      let xScale = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([yPadding, w - xPadding]);
      let yScale = d3.scaleLinear().domain([0, d3.max(dataset, (d) => { return +d; })]).range([h - xPadding, yPadding]);
      let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
      let yAxis = d3.axisLeft(yScale);

      // Draw Line & Add Transition
      let baseLine = d3.line().x((d) => { return xScale(d); }).y((d) => { return yScale(0); });
      svg.append("path").datum(years).attr("d", baseLine).attr("class", baseLine).attr("id", "dataLine");
      let line = d3.line().x((d) => { return xScale(d); }).y((d) => { return yScale(lineData[d]); });
      d3.select("#dataLine").transition().duration(500).ease(d3.easeCubicInOut).attr("d", line);

      // Draw Axes
      svg.append("g").attr("transform", "translate(0, " + (h - xPadding) + ")").call(xAxis);
      svg.append("g").attr("transform", "translate(" + yPadding + ", 0)").call(yAxis);

      // Label Axes
      svg.append("text").text("Year").attr("x", w/2).attr("y", h - 7).classed("chartLabel", true);
      svg.append("text").text("CO2 Emissions (Mil. Tonnes)").attr("x", 2).attr("y", yPadding - 10).classed("chartLabel", true);

      // Draw Year Marker
      svg.append("circle").attr("cx", xScale(initialYear)).attr("cy", yScale(0)).attr("r", 4).attr("class", "marker");
      svg.select("circle").transition().duration(490).ease(d3.easeCubicInOut).attr("cy", yScale(lineData[initialYear]));
      svg.append("text").text(lineData[initialYear]).attr("id", "markerText").attr("x", xScale(initialYear) - 25).attr("y", yScale(lineData[initialYear]) + 15).style("opacity", "0");
      d3.select("#markerText").transition().duration(500).ease(d3.easeCubicInOut).style("opacity", "1");
    }
  });
}

// Update Year/Value Marker Based On New Year Selection
function updateLineMarker(newYearString) {
  let newYear = parseInt(newYearString);
  let region = activeRegion == "World" ? "Total World" : activeRegion;

  // Initialise Dimensions
  let w = chart2.offsetWidth, h = chartHeight;
  let xPadding = 40, yPadding = 55;

  // Get Reference To SVG Element
  let svg = d3.select("#"+chart2.id).select("svg");

  // Load Data From CSV
  d3.csv("./datasets/annual-emissions-co2.csv").then((data) => {
    // Get Data Specific To Active Region
    let lineData = data.filter((d) => { return d.country == region; })[0];
    let dataset = [], years = [];

    // Check If Line Chart Is Drawn (Data Available)
    if (lineData != undefined) {
      // Initialise Data For Line Chart
      for (let i = 1966; i <= 2020; i++)
        if (lineData[i] != "n/a") {
          dataset.push(lineData[i]); // Store Data Points For Each Year In Array
          years.push(i); // Store All Years In Ordered Array
        }

      // Initialise Axes & Scales
      let xScale = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([yPadding, w - xPadding]);
      let yScale = d3.scaleLinear().domain([0, d3.max(dataset, (d) => { return +d; })]).range([h - xPadding, yPadding]);

      // Update Year Marker
      svg.select("circle").transition().duration(500).ease(d3.easeCubicInOut).attr("cx", xScale(newYear)).attr("cy", yScale(lineData[newYear]));
      svg.select("#markerText").transition().duration(500).ease(d3.easeCubicInOut).text(lineData[newYear]).attr("x", xScale(newYear) - 25).attr("y", yScale(lineData[newYear]) + 15).style("opacity", "1");
    }
  });
}
