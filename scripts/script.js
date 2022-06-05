// Initialise Contants & References To DOM Elements
const year = document.getElementById("year");
const yearLabel = document.getElementById("yearLabel");
const playButton = document.getElementById("plause");
const buttons = document.getElementById("buttons").children;
const regionSelector = document.getElementById("countrySelector");
const chart1 = document.getElementById("primaryChart");
const chart2 = document.getElementById("secondaryChart");
const chart2Heading = document.getElementById("secondaryChartTitle");
const chartEmissions = document.getElementById("emissionsChart");
const chartEmissionsHeading = document.getElementById("emissionsChartHeading");
const chartConsumption = document.getElementById("consumptionChart");
const legendConsumption = document.getElementById("consumptionLegend")
const chartHeight = 500;
let activeRegion = "World";

// Initialising Visualisations & Selectors
drawChoropleth("2020");
drawLineChart(activeRegion, "2020");
initialiseRegionsSelector();
drawPieChart(regionSelector.value, "2019");
drawAreaChart();

/*********************************
      CHART UPDATE FUNCTIONS
 *********************************/

// Render Primary Chart Based On Year
function primaryChartUpdate() {
  yearLabel.innerText = year.value;
  updateChoropleth(year.value);
  updateLineMarker(year.value);
}

// Render Secondary Chart Based On Type
function emissionsChartRedraw(type) {
  // Ensure Type Not Already Active
  if (!buttons[type].classList.contains("active")) {
    for (let i = 0; i < buttons.length; i++)
      if (i == type) buttons[i].classList.add("active");
      else buttons[i].classList.remove("active");
    
    if (type == 0) updatePieChart(regionSelector.value, "2019");
    else if (type == 1) updatePieChart(regionSelector.value, "2020");
    else if (type == 2) updateBarChart(regionSelector.value);
  }
}

// Update Currently Active Region & Render Charts Accordingly
function choroplethRegionUpdate(region) {
  if (activeRegion == region) activeRegion = "World";
  else activeRegion = region;

  // Update Secondary Chart
  drawLineChart(activeRegion, year.value);
}

function regionSelectorUpdate() {
  let type = 0;
  for (let i = 0; i < buttons.length; i++)
    if (buttons[i].classList.contains("active")) { type = i; break; }

  // Update Region On Appropriate Chart
  if (type == 0) updatePieChart(regionSelector.value, "2019");
  else if (type == 1) updatePieChart(regionSelector.value, "2020");
  else if (type == 2) updateBarChart(regionSelector.value);
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
  REGION SELECT EVENTS & FUNCTIONS
 *********************************/
function initialiseRegionsSelector() {
  d3.csv("./datasets/energy_consumption_by_source_2019.csv").then((data) => {
    data.forEach(datum => {
      if (!datum.country.includes("Total") && !datum.country.includes("Other"))
        regionSelector.innerHTML += "<option value='" + datum.country + "'>" + datum.country + "</option>";
    });
  });
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
          choroplethRegionUpdate(i.properties.name);
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

/*********************************
   PIE CHART EVENTS & FUNCTIONS
 *********************************/

// Render Pie Chart On Secondary Chart
function drawPieChart(region, selectedYear) {
  // Update Chart Heading
  if (region == "Total World") chartEmissionsHeading.innerHTML = "World Energy Consumption By Source " + selectedYear + " (Exajoules)";
  else if (region.length > 16) chartEmissionsHeading.innerHTML = region.slice(0, 13) + "... Energy Consumption By Source " + selectedYear + " (Exajoules)";
  else chartEmissionsHeading.innerHTML = region + " Energy Consumption By Source " + selectedYear + " (Exajoules)";

  // Clear Out Any Existing Charts
  d3.select("#"+chartEmissions.id).selectAll("svg").remove();

  // Initialise Dimensions
  let w = chartEmissions.offsetWidth, h = chartHeight;

  // Render SVG On DOM
  let svg = d3.select("#"+chartEmissions.id).append("svg").attr("height", h).attr("width", w);

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
      let baseArcGenerator = d3.arc().outerRadius(1).innerRadius(0.5);
      let arcGenerator = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius);
      let color = d3.scaleOrdinal(d3.schemeCategory10);

      // Draw Arcs On SVG Element & Add Transition
      let arcs = svg.selectAll("g.arc").data(pieGenerator(dataset)).enter().append("g").attr("class", "arc")
      .attr("transform", "translate(" + w/2 + "," + h/2 + ")");
      arcs.append("path")
      .attr("fill", (d, i) => { return color(i); })
      .attr("d", (d, i) => { return baseArcGenerator(d, i); })
      .attr("class", "pieArc")
      .append("title").text((d, i) => { return "Source: " + indexToSource(i) + "\nConsumption: " + d.data + " Exajoules\nShare: " + (d.data/pieData.total * 100).toFixed(2) + "%"; });
      arcs.selectAll("path").transition().duration(500).ease(d3.easeCubicInOut).attr("d", (d, i) => { return arcGenerator(d, i); });

      // Draw Legend & Add Transition
      for (let i = 0; i < dataset.length; i++) {
        let x = w / 2.5, y = h / 2.7 + i * 20;
        svg.append("rect").attr("x", x).attr("y", y).attr("width", 10).attr("height", 10).style("fill", color(i)).style("opacity", "0");
        svg.append("text").text(indexToSource(i)).attr("x", x + 20).attr("y", y + 10).style("opacity", "0");
      }
      svg.selectAll("rect").transition().duration(1000).style("opacity", "1");
      svg.selectAll("text").transition().duration(1000).style("opacity", "1");
    }
  });
}

// Update The Arcs On An Existing Pie Chart Based On Region & Year Selection
function updatePieChart(region, selectedYear) {
  // If There Is No Pie Chart To Update
  if (document.getElementsByClassName("arc").length <= 0) drawPieChart(region, selectedYear);
  else {
    // Update Chart Heading
    if (region == "Total World") chartEmissionsHeading.innerHTML = "World Energy Consumption By Source " + selectedYear + " (Exajoules)";
    else if (region.length > 16) chartEmissionsHeading.innerHTML = region.slice(0, 13) + "... Energy Consumption By Source " + selectedYear + " (Exajoules)";
    else chartEmissionsHeading.innerHTML = region + " Energy Consumption By Source " + selectedYear + " (Exajoules)";

    // Initialise Dimensions
    let w = chartEmissions.offsetWidth, h = chartHeight;

    // Get Reference To SVG Element On DOM
    let svg = d3.select("#"+chartEmissions.id).select("svg");

    // Load Data From CSV File
    d3.csv("./datasets/energy_consumption_by_source_" + selectedYear + ".csv").then((data) => {
      // Get Data Specific To Active Region
      let pieData = data.filter((d) => { return d.country == region; })[0];

      // If No Data Available For Selected Region
      if (pieData == undefined) {
        svg.html("");
        svg.append("text").attr("x", w/2 - 10).attr("y", h/2).text("No Data For '" + region + "'!");
      }
      else {
        // Initialise Dataset From Filtered Data
        let dataset = initialiseDataset(pieData);

        // Setup For Pie Chart
        let outerRadius = w/3, innerRadius = w/4;
        let pieGenerator = d3.pie();
        let arcGenerator = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius);
        let piePathData = pieGenerator(dataset);
        let paths = document.getElementsByClassName("arc");

        // Update Existing Pie Chart
        for (let i = 0; i < piePathData.length; i++) {
          let path = paths[i].firstChild;
          path.setAttribute("style", "transition: 300ms;");
          path.setAttribute("d", arcGenerator(piePathData[i], i));
          path.innerHTML = "<title>Source: " + indexToSource(i) + "\nConsumption: " + piePathData[i].data + " Exajoules\nShare: " + (piePathData[i].data/pieData.total * 100).toFixed(2) + "%</title>";
        }
      }
    });
  }
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

/*********************************
   BAR CHART EVENTS & FUNCTIONS
 *********************************/

// Render Bar Chart On SVG Element
function drawBarChart(region) {
  // Update Chart Heading
  if (region == "Total World") chartEmissionsHeading.innerHTML = "World Energy Consumption By Source (Exajoules)";
  else if (region.length > 16) chartEmissionsHeading.innerHTML = region.slice(0, 13) + "... Energy Consumption By Source (Exajoules)";
  else chartEmissionsHeading.innerHTML = region + " Energy Consumption By Source (Exajoules)";

  // Clear Out Any Existing Charts
  d3.select("#"+chartEmissions.id).selectAll("svg").remove();

  // Initialise Dimensions
  let w = chartEmissions.offsetWidth, h = chartHeight, padding = 35;

  // Render SVG On DOM
  let svg = d3.select("#"+chartEmissions.id).append("svg").attr("height", h).attr("width", w);

  // Load Data From 2019 CSV File
  d3.csv("./datasets/energy_consumption_by_source_2019.csv").then((data19) => {
    let data2019 = data19.filter((d) => { return d.country == region; })[0];

    // If No Data Available For Selected Region
    if (data2019 == undefined) svg.append("text").attr("x", w/2 - 10).attr("y", h/2).text("No Data For '" + region + "'!");
    else {
      // Load Data From 2020 CSV File
      d3.csv("./datasets/energy_consumption_by_source_2020.csv").then((data20) => {
        let data2020 = data20.filter((d) => { return d.country == region; })[0];

        // If No Data Available For Selected Region
        if (data2020 == undefined) svg.append("text").attr("x", w/2 - 10).attr("y", h/2).text("No Data For '" + region + "'!");
        else {
          // Get Bar Data
          let dataset2019 = initialiseDataset(data2019);
          let dataset2020 = initialiseDataset(data2020);
          let dataset = dataset2019.concat(dataset2020);

          // Get Keys
          let keys = Object.keys(data2020); keys.shift(); keys.pop();
          for (let i = 0; i < keys.length; i++) keys[i] = indexToSource(i);

          // Setup Bar Properties
          let barPadding = 10;
          let barWidth = (w - padding*2) / (keys.length*2) - barPadding;

          // Setup Scales & Axes
          let xScale = d3.scaleBand().domain(keys).range([padding, w - padding]);
          let yScale = d3.scaleLinear().domain([d3.max(dataset, (d) => { return +d; })*1.1, 0]).range([padding, h - padding]);
          let xAxis = d3.axisBottom(xScale);
          let yAxis = d3.axisLeft(yScale);

          // Setup Color
          let color = d3.scaleOrdinal(d3.schemeCategory10);

          // Draw Bars As Rectangles On Chart
          svg.selectAll("rect").data(dataset).enter().append("rect")
          .attr("x", (d, i) => {
            let bw = xScale(indexToSource(i % keys.length));
            if (i < 6) return bw + barPadding;
            else return bw + barWidth + barPadding;
          })
          .attr("y", w/2)
          .attr("width", barWidth)
          .attr("height", 0) // Height Set To Correct Value Later For Transition
          .attr("fill", (d, i) => { return (i < keys.length) ? color(0) : color(1); })
          .attr("id", (d, i) => { return "bar"+i; })
          // Append Tooltip Text
          .append("title").text((d, i) => {return "Source: " + indexToSource(i % keys.length) + "\nConsumption: " + d + " Exajoules\nRegion: " + region + "\nYear: " + ((i < keys.length) ? "2019" : "2020"); });

          // Set Height To Required Value With Transition
          for (let i = 0; i < keys.length*2; i++)
            d3.select("#bar"+i).transition().duration(500).attr("y", yScale(dataset[i])).attr("height", h - padding - yScale(dataset[i]));

          // Draw Axes
          svg.append("g").transition().duration(200).ease(d3.easeCubicInOut).attr("transform", "translate(0, " + (h - padding) + ")").call(xAxis);
          svg.append("g").transition().duration(200).ease(d3.easeCubicInOut).attr("transform", "translate(" + padding + ", 0)").attr("id", "barYAxis").call(yAxis);

          // Label Axes
          svg.append("text").text("Energy Sources").attr("x", w/2 - 30).attr("y", h - 7).classed("chartLabel", true);
          svg.append("text").text("Energy Consumption (EJ)").attr("x", 2).attr("y", padding - 10).classed("chartLabel", true);

          // Show Legend
          svg.append("rect").attr("x", w - 85).attr("y", 20).attr("width", 10).attr("height", 10).attr("fill", color(0));
          svg.append("text").attr("x", w - 70).attr("y", 30).text("2019");
          svg.append("rect").attr("x", w - 85).attr("y", 40).attr("width", 10).attr("height", 10).attr("fill", color(1));
          svg.append("text").attr("x", w - 70).attr("y", 50).text("2020");
        }
      });
    }
  });
}

// Update Bars & Axes On Chart Based On Region Selection
function updateBarChart(region) {
  // If There Is No Pie Chart To Update
  if (!document.getElementById("bar0")) drawBarChart(region);
  else {
    // Update Chart Heading
    if (region == "Total World") chartEmissionsHeading.innerHTML = "World Energy Consumption By Source (Exajoules)";
    else if (region.length > 16) chartEmissionsHeading.innerHTML = region.slice(0, 13) + "... Energy Consumption By Source (Exajoules)";
    else chartEmissionsHeading.innerHTML = region + " Energy Consumption By Source (Exajoules)";

    // Initialise Dimensions
    let w = chartEmissions.offsetWidth, h = chartHeight, padding = 35;

    // Render SVG On DOM
    let svg = d3.select("#"+chartEmissions.id).select("svg");

    // Load Data From 2019 CSV File
    d3.csv("./datasets/energy_consumption_by_source_2019.csv").then((data19) => {
      let data2019 = data19.filter((d) => { return d.country == region; })[0];

      // If No Data Available For Selected Region
      if (data2019 == undefined) {
        svg.html("");
        svg.append("text").attr("x", w/2 - 10).attr("y", h/2).text("No Data For '" + region + "'!");
      }
      else {
        // Load Data From 2020 CSV File
        d3.csv("./datasets/energy_consumption_by_source_2020.csv").then((data20) => {
          let data2020 = data20.filter((d) => { return d.country == region; })[0];

          // If No Data Available For Selected Region
          if (data2020 == undefined) {
            svg.html("");
            svg.append("text").attr("x", w/2 - 10).attr("y", h/2).text("No Data For '" + region + "'!");
          }
          else {
            // Get Bar Data
            let dataset2019 = initialiseDataset(data2019);
            let dataset2020 = initialiseDataset(data2020);
            let dataset = dataset2019.concat(dataset2020);

            // Get Keys
            let keys = Object.keys(data2020); keys.shift(); keys.pop();
            for (let i = 0; i < keys.length; i++) keys[i] = indexToSource(i);

            // Setup Bar Properties
            let barPadding = 10;

            // Setup Scales & Axes
            let yScale = d3.scaleLinear().domain([d3.max(dataset, (d) => { return +d; })*1.1, 0]).range([padding, h - padding]);
            let yAxis = d3.axisLeft(yScale);

            for (let i = 0; i < keys.length*2; i++)
            {
              // Set Height To Required Value With Transition
              d3.select("#bar"+i).transition().duration(500).attr("y", yScale(dataset[i])).attr("height", h - padding - yScale(dataset[i]));
              // Update Tooltip Text
              d3.select("#bar"+i).select("title").text("Source: " + indexToSource(i % keys.length) + "\nConsumption: " + dataset[i] + " Exajoules\nRegion: " + region + "\nYear: " + ((i < keys.length) ? "2019" : "2020"));
            }

            // Draw Axes
            svg.select("#barYAxis").transition().duration(200).ease(d3.easeCubicInOut).call(yAxis);
          }
        });
      }
    });
  }
}

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
    .attr("y", padding).attr("x", 0).attr("height", h - padding*2).attr("width", 2)
    // Year Indicator
    svg.append("text").attr("id", "valueIndicator").classed("hidden", true)
    .attr("y", padding + 10).attr("x", 50).text("2020");
    // Energy Value Indicator
    svg.append("rect").attr("id", "sourcesIndicator").classed("hidden", true)
    .attr("y", padding + 30).attr("x", 50).attr("height", 130).attr("width", 200);
    for (let i = 0; i < keys.length; i++) {
      svg.append("text").attr("id", "sourcesIndicator"+i).classed("hidden", true)
      .attr("y", padding + 50 + i*20).attr("x", 55).text(indexToSource(i) + ":");
    }

    // Mouse Entered & Moved
    svg.on("mousemove", function(d) {
      let cursorX = d.offsetX; // Get Cursor Position
      // Render Vertical Indicator If Inside Chart Area
      if (cursorX > padding && cursorX < w - padding) {
        svg.select("#verticalIndicator").classed("hidden", false).attr("x", cursorX);
        let hoveredYear = Math.floor(xScale.invert(cursorX).toFixed(0));
        // Draw Year Label To Left Of Vertical Indicator If Cursor At Right Of Center Chart
        if (cursorX > w/2) {
          svg.select("#valueIndicator").classed("hidden", false).attr("x", cursorX - 40).text(hoveredYear);
          svg.select("#sourcesIndicator").classed("hidden", false).attr("x", cursorX - 201);
          for (let i = 0; i < keys.length; i++) d3.select("#sourcesIndicator"+i).classed("hidden", false).attr("x", cursorX - 201).text(indexToSource(i) + ": " + getValueFromData(data[hoveredYear-1965], i));
        }
        // Else Draw Year Label To Right Of Vertical Indicator
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
    let i = 0;
    let legendSVG = d3.select("#"+legendConsumption.id).append("svg").attr("width", 160).attr("height", 130);
    keys.forEach(key => {
      legendSVG.append("rect").attr("width", 10).attr("height", 10).attr("x", 0).attr("y", 4 + i*20).attr("fill", colour(key));
      legendSVG.append("text").attr("x", 20).attr("y", 14 + i*20).text(indexToSource(i));
      i++;
    });
  });
}

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
