// Initialise Line Chart On DOM
export function line(domElementId, region, year) {
  // Dimensions For SVG Element
  let w = 500, h = 300;
  let xPadding = 20, yPadding = 55;

  // Clearing Out Any Other Charts
  d3.select(domElementId).selectAll("svg").remove();

  // Chart Heading & Choropleth Country Selection Management
  if (region == "Total World") {
    d3.select(domElementId).select("h2").text("Global Annual CO2 Emissions (Mil. Tonnes)");
  }
  // Unselect A Country
  else if (region == d3.select(domElementId).select("h2").text().split(" ").reverse().splice(5).reverse().join(" ")) {
    d3.select("#choropleth").select("svg").selectAll(".country").attr("id", "");
    line(domElementId, "Total World", year);
    return;
  }
  // Selected Different Country
  else {
    d3.select("#choropleth").select("svg").selectAll(".country").attr("id", "");
    d3.select("#choropleth").select("svg").selectAll(".country").attr("id", d => { if(d.properties.name == region) return "selected"; });
    d3.select(domElementId).select("h2").text(region + " Annual CO2 Emissions (Mil. Tonnes)");
  }

  // Rendering SVG Element On DOM
  let svg = d3.select(domElementId).append("svg").attr("height", h).attr("width", w);

  // Read CSV Data
  d3.csv("./datasets/annual-emissions-co2.csv").then((data) => {
    // Get Data Specific To Selected Region
    let lineData = data.filter((d) => { return d.country == region; })[0];
    let dataset = [], years = [];

    // No Data For Selected Region
    if (lineData == undefined) svg.append("text").attr("x", w / 2 - 10).attr("y", h / 2).text("No Data For '" + region + "'!");
    else {
      for (let i = 1966; i <= 2020; i++)
        if (lineData[i] != "n/a")
        {
          dataset.push(lineData[i]); // Store Data Points For Each Year In Array
          years.push(i); // Store All Years In Ordered Array
        }
  
      // Get Min & Max Values From Parsed Data
      let max = d3.max(dataset, (d) => { return +d; });
      let minYear = d3.min(years, (d) => { return +d; });
      let maxYear = d3.max(years, (d) => { return +d; });
  
      // Initialising Axes
      let xScale = d3.scaleLinear().domain([minYear, maxYear]).range([yPadding, w - xPadding]);
      let yScale = d3.scaleLinear().domain([0, max]).range([h - xPadding, 0]);
      let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")), yAxis = d3.axisLeft(yScale);
  
      // Draw Line
      let baseLine = d3.line().x((d) => { return xScale(d); }).y((d) => { return yScale(0); });
      svg.append("path").datum(years).attr("d", baseLine).attr("class", "line").attr("id", "dataLine");
      let line = d3.line().x((d) => { return xScale(d); }).y((d) => { return yScale(lineData[d]); });
      d3.select("#dataLine").transition().duration(500).ease(d3.easeCubicInOut).attr("d", line);

      // Draw Axes
      svg.append("g").attr("transform", "translate(0, " + (h - xPadding) + ")").call(xAxis);
      svg.append("g").attr("transform", "translate(" + yPadding + ", 0)").call(yAxis);

      // Draw Year Marker
      svg.append("circle").attr("cx", xScale(year)).attr("cy", yScale(0)).attr("r", 4).attr("class", "marker");
      svg.select("circle").transition().duration(490).ease(d3.easeCubicInOut).attr("cy", yScale(lineData[year]));
      svg.append("text").text(lineData[year]).attr("id", "markerText").attr("x", xScale(year) - 25).attr("y", yScale(lineData[year]) + 15).style("opacity", "0");
      d3.select("#markerText").transition().duration(500).ease(d3.easeCubicInOut).style("opacity", "1");

      // Update Year Marker On Year Change
      document.getElementById("year").addEventListener("change", (e) => {
        let newYear = parseInt(e.target.value);
        svg.select("circle").transition().duration(500).ease(d3.easeCubicInOut).attr("cx", xScale(newYear)).attr("cy", yScale(lineData[newYear]));
        svg.select("#markerText").transition().duration(500).ease(d3.easeCubicInOut).text(lineData[newYear]).attr("x", xScale(newYear) - 25).attr("y", yScale(lineData[newYear]) + 15).style("opacity", "1");
      });
    }
  });
}
