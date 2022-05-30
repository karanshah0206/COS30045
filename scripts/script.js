// Initialise Contants & References To DOM Elements
const year = document.getElementById("year");
const yearLabel = document.getElementById("yearLabel");
const playButton = document.getElementById("plause");
const buttons = document.getElementById("buttons").children;
const chart1 = document.getElementById("primaryChart");
const chart2 = document.getElementById("secondaryChart");
const chart2Heading = document.getElementById("secondaryChartTitle");
const chartHeight = 500;
let activeRegion = "World";

// Initialising Visualisations
drawChoropleth("2020");
drawLineChart(activeRegion, "2020");

/*********************************
      CHART UPDATE FUNCTIONS
 *********************************/

// Render Primary Chart Based On Year
function primaryChartUpdate() {
  yearLabel.innerText = year.value;
  updateChoropleth(year.value);
  if (buttons[0].classList.contains("active")) updateLineMarker(year.value);
}

// Render Secondary Chart Based On Type
function secondaryChartRedraw(type) {
  // Ensure Type Not Already Active
  if (!buttons[type].classList.contains("active")) {
    for (let i = 0; i < buttons.length; i++)
      if (i == type) buttons[i].classList.add("active");
      else buttons[i].classList.remove("active");
    
    if (type == 0) drawLineChart(activeRegion, year.value);
    else if (type == 1) drawPieChart(activeRegion, "2020");
  }
}

// Update Currently Active Region & Render Charts Accordingly
function regionUpdate(region) {
  if (activeRegion == region) activeRegion = "World";
  else activeRegion = region;

  // Update Appropriate Secondary Chart
  if (buttons[0].classList.contains("active")) drawLineChart(activeRegion, year.value);
}

/*********************************
    TIMELINE EVENTS & FUNCTIONS
 *********************************/

// Update Timeline Label Based On Timeline Value
function timelineUpdate() {
  yearLabel.innerText = year.value;
  pauseTimeline();
}

// Pause A Running Timeline
function pauseTimeline() {
  playButton.firstElementChild.classList.remove("bi-pause-fill");
  playButton.firstElementChild.classList.add("bi-play-fill");
  // Clear All Playing Channels
  let timeoutIDs = setTimeout(function() {}, 0);
  while (timeoutIDs--) clearTimeout(timeoutIDs);
}

// Update Play/Pause State Of Timeline
function timelineButtonUpdate() {
  // If Currently Paused
  if (playButton.firstElementChild.classList.contains("bi-play-fill")) {
    playButton.firstElementChild.classList.remove("bi-play-fill");
    playButton.firstElementChild.classList.add("bi-pause-fill");
    // If At End Of Timeline, Reset To Beginning
    if (year.value == 2020)
    {
      year.value = 1966;
      yearLabel.innerText = year.value;
    }
    // Loop Through Timeline
    let loopTimeout = function(i, max, interval, func) {
      if (i > max) { // End Of Timeline
        playButton.firstElementChild.classList.remove("bi-pause-fill");
        playButton.firstElementChild.classList.add("bi-play-fill");
        return;
      }
      func(i); // Call Update Function
      i++; // Increment Control Variable
      setTimeout(function() { loopTimeout(i, max, interval, func) }, interval);
    };
    loopTimeout(parseInt(year.value), 2020, 700, (yearVal) => {
      year.value = yearVal;
      primaryChartUpdate();
    });
  }
  // If Currently Playing
  else pauseTimeline();
}

/*********************************
   CHOROPLETH EVENTS & FUNCTIONS
 *********************************/

// Render Choropleth On Primary Chart
function drawChoropleth(initialYear) {
  // Initialise Dimensions
  let w = chart1.offsetWidth, h = chartHeight;

  // Render SVG On DOM
  let svg = d3.select("#"+chart1.id).append("svg").attr("height", h).attr("width", w);

  // Map & Projection
  let projection = d3.geoMercator().scale(115).center([0, 41]).translate([w/2, h/2]);
  let path = d3.geoPath().projection(projection);

  // Get Data From CSV File
  d3.csv("./datasets/annual-change-renewables.csv").then((data) => {
    // Generate Hue Scheme Based On Data
    let color = d3.scaleLinear()
    .domain([d3.min(data, (d) => { if (d.year == initialYear && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); }), 0, d3.max(data, (d) => { if (d.year == initialYear && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); })])
    .range(["red", "lightgreen", "green"]);

    let globalChangeValue = 0; // Worldwide Aggregate Change in TWh

    // Bind Data From CSV To GeoJSON Properties
    d3.json("./datasets/world.geojson").then((json) => {
      data.forEach(datum => {
        if (datum.year == initialYear)
          for (let i = 0; i < json.features.length; i++) {
            let properties = json.features[i].properties;
            if (properties.name == datum.entity) { properties.value = datum.renewables; break; }
            else if (datum.entity == "World") { globalChangeValue = datum.renewables; break; }
          }
      });

      // Draw Choropleth Using Paths On SVG Element
      svg.selectAll("path").data(json.features).enter().append("path").attr("d", path)
      .style("fill", (d) => { return (d.properties.value) ? color(d.properties.value) : "#CCCCCC"; })
      .classed("country", true)
      // Mouse Hover Events Work Only If Region Contains Data
      .on("mouseenter", function() { if (!d3.select(this).attr("style").includes("fill: rgb(204, 204, 204);")) d3.select(this).classed("countryHovered", true); })
      .on("mouseout", function() { if (!d3.select(this).attr("style").includes("fill: rgb(204, 204, 204);")) d3.select(this).classed("countryHovered", false); })
      // Update Active Region On Click Event
      .on("click", function (d, i) {
        if (i.properties.value) {
          regionUpdate(i.properties.name);
          d3.select("#countrySelected").attr("id", "");
          if (activeRegion == i.properties.name) d3.select(this).attr("id", "countrySelected");
        }
      })
      // Show Tooltips When Hovering Over Country
      .append("title").text((d) => {
        if (d.properties.value) return "Annual Change Renewables: " + d.properties.value + " TWh\nCountry: " + d.properties.name + "\nYear: " + initialYear;
        return "No Data\nCountry: " + d.properties.name + "\nYear: " + initialYear;
      });

      // Draw Global Change Text Indicator
      svg.append("text").attr("id", "globalChange").text("Global Change: " + globalChangeValue + " TWh").attr("x", w - 210).attr("y", h - 10);

      // Draw Color Gradient Scale Rectangle
      svg.append("rect").attr("id", "colorScale").attr("x", 20).attr("y", h - 50).attr("width", 120).attr("height", 20);
      // Get Linear Color Gradient
      const defs = svg.append("defs"), linearGradient = defs.append("linearGradient").attr("id", "linear-gradient");
      linearGradient.selectAll(".stop").data(color.range()).enter().append("stop").attr("offset", (d, i) => i / (color.range().length - 1)).attr("stop-color", d => d);
      // Append Gradient To Rectangle
      svg.select("#colorScale").style("fill", "url(#linear-gradient)").style("opacity", "0.7");
      // Draw Color Gradient Scale
      svg.append("text").text("0").attr("x", 78).attr("y", h - 55);
      svg.append("text").text("TWh").attr("x", 160).attr("y", h - 55);
      svg.append("text").text(Math.ceil(color.domain()[0])).attr("x", 10).attr("y", h - 55).attr("id", "minMarker");
      svg.append("text").text(Math.ceil(color.domain()[2])).attr("x", 130).attr("y", h - 55).attr("id", "maxMarker");
      // Draw No Data Hue Indicator
      svg.append("rect").attr("x", 20).attr("y", h - 20).attr("width", 30).attr("height", 20).attr("fill", "#ccc");
      svg.append("text").text("No Data").attr("x", 55).attr("y", h - 5);
    });
  });
}

// Update Choropleth Based On New Year Selection
function updateChoropleth(newYear) {
  // Initialise Dimensions
  let w = chart1.offsetWidth, h = chartHeight;

  // Get Reference To SVG Element On DOM
  let svg = d3.select("#" + chart1.id).select("svg");

  // Map & Projection
  let projection = d3.geoMercator().scale(115).center([0, 41]).translate([w/2, h/2]);
  let path = d3.geoPath().projection(projection);

  // Get Data From CSV File
  d3.csv("./datasets/annual-change-renewables.csv").then((data) => {
    // Generate Hue Scheme Based On Data
    let color = d3.scaleLinear()
    .domain([d3.min(data, (d) => { if (d.year == newYear && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); }), 0, d3.max(data, (d) => { if (d.year == newYear && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); })])
    .range(["red", "lightgreen", "green"]);

    let globalChangeValue = 0; // Worldwide Aggregate Change in TWh

    // Bind Data From CSV To GeoJSON Properties
    d3.json("./datasets/world.geojson").then((json) => {
      data.forEach(datum => {
        if (datum.year == newYear)
          for (let i = 0; i < json.features.length; i++) {
            let properties = json.features[i].properties;
            if (properties.name == datum.entity) { properties.value = datum.renewables; break; }
            else if (datum.entity == "World") { globalChangeValue = datum.renewables; break; }
          }
      });

      // Update Choropleth Paths & Add Transition
      svg.selectAll("path").data(json.features).transition().duration(500).ease(d3.easeCubicInOut).attr("d", path)
      .style("fill", (d) => { return (d.properties.value) ? color(d.properties.value) : "#CCCCCC"; })
      .select("title").text((d) => {
        if (d.properties.value) return "Annual Change Renewables: " + d.properties.value + " TWh\nCountry: " + d.properties.name + "\nYear: " + newYear;
        else return "No Data\nCountry: " + d.properties.name + "\nYear: " + newYear;
      });

      // Update Global Change Text
      svg.select("#globalChange").text("Global Change: " + globalChangeValue + " TWh");

      // Update Color Scale Text
      d3.select("#minMarker").text(Math.ceil(color.domain()[0]));
      d3.select("#maxMarker").text(Math.ceil(color.domain()[2]));
    });
  });
}

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
  else chart2Heading.innerHTML = region + " Annual CO<sub>2</sub> Emissions (Million Tonnes)";

  // Clear Out Any Existing Charts
  d3.select("#"+chart2.id).selectAll("svg").remove();

  // Initialise Dimensions
  let w = chart2.offsetWidth, h = chartHeight;
  let xPadding = 20, yPadding = 55;

  // Render SVG On DOM
  let svg = d3.select("#"+chart2.id).append("svg").attr("height", h).attr("width", w);

  // Get Data From CSV File
  d3.csv("./datasets/annual-emissions-co2.csv").then((data) => {
    // Get Data Specific To Active Region
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
  let xPadding = 20, yPadding = 55;

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

/*********************************
   PIE CHART EVENTS & FUNCTIONS
 *********************************/

// Render Pie Chart On Secondary Chart
function drawPieChart(region, selectedYear) {
  // Update Chart Heading
  if (region == "World") {
    chart2Heading.innerHTML = "Global Energy Consumption By Source (Exajoules)";
    region = "Total World";
  }
  else chart2Heading.innerHTML = region + " Energy Consumption By Source (Exajoules)";

  // Clear Out Any Existing Charts
  d3.select("#"+chart2.id).selectAll("svg").remove();

  // Initialise Dimensions
  let w = chart2.offsetWidth, h = chartHeight;

  // Render SVG On DOM
  let svg = d3.select("#"+chart2.id).append("svg").attr("height", h).attr("width", w);

  // Load Data From CSV File
  d3.csv("./datasets/energy_consumption_by_source_" + selectedYear + ".csv").then((data) => {
    // Get Data Specific To Active Region
    let pieData = data.filter((d) => { return d.country == region; })[0];

    // If No Data Available For Selected Region
    if (pieData == undefined) svg.append("text").attr("x", w/2 - 10).attr("y", h/2).text("No Data For '" + region + "'!");
    else {
      // Initialise Dataset From Filtered Data
      let dataset = initialiseDataset(pieData);

      // Setup For Pie Chart
      let outerRadius = w/3, innerRadius = w/4;
      let pieGenerator = d3.pie();
      let color = d3.scaleOrdinal(d3.schemeCategory10);

      // Setup Arcs
      let arc = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius);
      let arcs = svg.selectAll("g.arc").data(pieGenerator(dataset)).enter().append("g").attr("class", "arc")
      .attr("transform", "translate(" + w/2 + "," + h/2 + ")");

      // Draw Arcs On SVG Element
      arcs.append("path")
      .attr("fill", (d, i) => { return color(i); })
      .attr("d", (d, i) => { return arc(d, i); })
      .attr("class", "pieArc")
      .append("title").text((d, i) => { return "Source: " + indexToSource(i) + "\nConsumption: " + d.data + " Exajoules"; });
    }
  });
}

// Adapter Between CSV Data & Pie Chart Dataset
function initialiseDataset(data) {
  let dataset = [];
  (data.oil != "n/a") ? dataset.push(data.oil) : dataset.push("0");
  (data.gas != "n/a") ? dataset.push(data.gas) : dataset.push("0");
  (data.coal != "n/a") ? dataset.push(data.coal) : dataset.push("0");
  (data.nuclear != "n/a") ? dataset.push(data.nuclear) : dataset.push("0");
  (data.hydro != "n/a") ? dataset.push(data.hydro) : dataset.push("0");
  (data.renewables != "n/a") ? dataset.push(data.renewables) : dataset.push("0");
  // (data.total != "n/a") ? dataset.push(data.total) : dataset.push("0");
  return dataset;
}

// Identify Energy Source Based On Index In Array
function indexToSource(index) {
  switch (index) {
    case 0: return "Crude Oil";
    case 1: return "Natural Gas";
    case 2: return "Coal";
    case 3: return "Nuclear";
    case 4: return "Hydroelectricity";
    case 5: return "Other Renewables";
    default: break;
  }
}
