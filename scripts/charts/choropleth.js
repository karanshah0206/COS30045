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
      // Mouse Events Work Only If Data Exists For Region
      .on("mouseenter", function() { if (!d3.select(this).attr("style").includes("fill: rgb(204, 204, 204);")) d3.select(this).classed("countryHovered", true); })
      .on("mouseout", function() { if (!d3.select(this).attr("style").includes("fill: rgb(204, 204, 204);")) d3.select(this).classed("countryHovered", false); })
      .on("click", function (d, i) {
        if (i.properties.value) {
          choroplethRegionUpdate(i.properties.name);
          d3.select("#countrySelected").attr("id", "");
          if (activeRegion == i.properties.name) d3.select(this).attr("id", "countrySelected");
        }
      })
      // Tooltip Content
      .append("title").text((d) => {
        if (d.properties.value) return "Annual Change Renewables: " + d.properties.value + " TWh\nCountry: " + d.properties.name + "\nYear: " + initialYear;
        return "No Data\nCountry: " + d.properties.name + "\nYear: " + initialYear;
      });

      // Draw Global Change Text Indicator
      svg.append("text").attr("id", "globalChange").text("Global Change: " + globalChangeValue + " TWh").attr("x", w - 210).attr("y", h - 10);

      // Draw Color Gradient Scale
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
