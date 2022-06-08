/*********************************
        STACKED AREA CHART
 *********************************/

// Render Area Chart On SVG
function drawAreaChart() {
  // Specifying Chart Dimensions
  let w = chartConsumption.offsetWidth, h = chartHeight, padding = 35;

  // Render SVG Element On  DOM
  let svg = d3.select("#"+chartConsumption.id).append("svg").attr("height", h).attr("width", w);

  // Load CSV Dataset
  d3.csv("./datasets/energy_consumption_by_source_1965_2020.csv").then((data) => {
    let keys = data.columns.slice(1); // Get Keys From Dataset
    let colour = d3.scaleOrdinal().domain(keys).range(d3.schemeSet2); // Generate Colour Scheme
    let stackedData = d3.stack().keys(keys)(data); // Initialise D3 Stack Generator

    // Initialise Axes & Scales
    let xScale = d3.scaleLinear().domain(d3.extent(data, (d) => { return d.year; })).range([padding, w - padding]);
    let yScale = d3.scaleLinear().domain([0,600]).range([h - padding, padding]);
    let xAxis = d3.axisBottom(xScale).ticks(7).tickFormat(d3.format("d"));;
    let yAxis = d3.axisLeft(yScale);

    // Initialise Area Chart & Area Generator
    let areaChart = svg.append("g").attr("clip-path", "url(#clip)");
    let area = d3.area().x((d) => { return xScale(d.data.year); }).y0((d) => { return yScale(d[0]); }).y1((d) => { return yScale(d[1]); });

    // Draw Areas On SVG
    areaChart.selectAll("mylayers").data(stackedData).enter()
    .append("path").style("fill", (d) => { return colour(d.key); }).attr("d", area);

    // Draw Axes
    svg.append("g").attr("transform", "translate(0, " + (h - padding) + ")").call(xAxis);
    svg.append("g").attr("transform", "translate(" + padding + ",0)").call(yAxis);

    // Draw Axis Labels
    svg.append("text").text("Year").attr("x", w/2).attr("y", h - 7).classed("chartLabel", true);
    svg.append("text").text("Energy Consumption (EJ)").attr("x", 5).attr("y", 23).classed("chartLabel", true);

    // Veretical Indicator
    svg.append("rect").attr("id", "verticalIndicator").classed("hidden", true)
    .attr("y", padding).attr("x", 0).attr("height", h - padding*2).attr("width", 2);

    // Year Indicator
    svg.append("text").attr("id", "valueIndicator").classed("hidden", true)
    .attr("y", padding + 10).attr("x", 50).text("2020");

    // Energy Value Indicator
    svg.append("rect").attr("id", "sourcesIndicator").classed("hidden", true)
    .attr("y", padding + 30).attr("x", 50).attr("height", 130).attr("width", 200);
    for (let i = 0; i < keys.length; i++)
      svg.append("text").attr("id", "sourcesIndicator"+i).classed("hidden", true)
      .attr("y", padding + 50 + i*20).attr("x", 55).text(indexToSource(i) + ":");

    // Mouse Entered & Moved
    svg.on("mousemove", function(d) {
      let cursorX = d.offsetX; // Get Cursor Position

      // Render Vertical Indicator If Inside Chart Area
      if (cursorX > padding && cursorX < w - padding) {
        svg.select("#verticalIndicator").classed("hidden", false).attr("x", cursorX);
        let hoveredYear = Math.floor(xScale.invert(cursorX).toFixed(0));

        // Draw Year Label & Data Values
        if (cursorX > w/2) {
          svg.select("#valueIndicator").classed("hidden", false).attr("x", cursorX - 40).text(hoveredYear);
          svg.select("#sourcesIndicator").classed("hidden", false).attr("x", cursorX - 201);
          for (let i = 0; i < keys.length; i++) d3.select("#sourcesIndicator"+i).classed("hidden", false).attr("x", cursorX - 201).text(indexToSource(i) + ": " + getValueFromData(data[hoveredYear-1965], i));
        }
        else {
          svg.select("#valueIndicator").classed("hidden", false).attr("x", cursorX + 8).text(hoveredYear);
          svg.select("#sourcesIndicator").classed("hidden", false).attr("x", cursorX + 3);
          for (let i = 0; i < keys.length; i++) d3.select("#sourcesIndicator"+i).classed("hidden", false).attr("x", cursorX + 10).text(indexToSource(i) + ": " + getValueFromData(data[hoveredYear-1965], i));
        }
      }
    });

    // Mouse Out
    svg.on("mouseout", () => {
      svg.select("#verticalIndicator").classed("hidden", true);
      svg.select("#valueIndicator").classed("hidden", true);
      svg.select("#sourcesIndicator").classed("hidden", true);
      for (let i = 0; i < keys.length; i++) d3.select("#sourcesIndicator"+i).classed("hidden", true);
    });

    // Draw Legend
    let i = 0, legendSVG = d3.select("#"+legendConsumption.id).append("svg").attr("width", 160).attr("height", 130);
    keys.forEach(key => {
      legendSVG.append("rect").attr("width", 10).attr("height", 10).attr("x", 0).attr("y", 4 + i*20).attr("fill", colour(key));
      legendSVG.append("text").attr("x", 20).attr("y", 14 + i*20).text(indexToSource(i));
      i++;
    });
  });
}

// Get Energy Consumption Of Source From Data
function getValueFromData(data, index) {
  switch (index) {
    case 0: return parseFloat(data.oil).toFixed(2) + " EJ";
    case 1: return parseFloat(data.gas).toFixed(2) + " EJ";
    case 2: return parseFloat(data.coal).toFixed(2) + " EJ";
    case 3: return parseFloat(data.nuclear).toFixed(2) + " EJ";
    case 4: return parseFloat(data.hydro).toFixed(2) + " EJ";
    case 5: return parseFloat(data.renewables).toFixed(2) + " EJ";
  }
}
