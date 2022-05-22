// Initialise Line Chart On DOM
export function line(domElementId, region, year) {
  // Dimensions For SVG Element
  let w = 500, h = 300;
  let xPadding = 20, yPadding = 55;

  // Rendering SVG Element On DOM
  let svg = d3.select(domElementId).append("svg").attr("height", h).attr("width", w);

  // Read CSV Data
  d3.csv("./datasets/annual-emissions-co2.csv").then((data) => {
    let lineData = data.filter((d) => { return d.country == region; })[0];
    let dataset = [], years = [];

    if (lineData == undefined) svg.append("text").attr("x", w/2).attr("y", h/2).text("No Data For Region '" + region + "'!");
    else {
      for (let i = 1966; i <= 2020; i++)
        if (lineData[i] != "n/a")
        {
          dataset.push(lineData[i]); // Store Data Points For Each Year In Array
          years.push(i); // Store All Years In Ordered Array
        }
  
      // Get Min & Max Values From Parsed Data
      let min = d3.min(dataset, (d) => { return +d; });
      let max = d3.max(dataset, (d) => { return +d; });
      let minYear = d3.min(years, (d) => { return +d; });
      let maxYear = d3.max(years, (d) => { return +d; });
  
      // Initialising Axes
      let xScale = d3.scaleLinear().domain([minYear, maxYear]).range([yPadding, w - xPadding]);
      let yScale = d3.scaleLinear().domain([0, max]).range([h - xPadding, 0]);
      let xAxis = d3.axisBottom(xScale), yAxis = d3.axisLeft(yScale);
  
      // Draw Line
      let line = d3.line().x((d) => { return xScale(d); }).y((d) => { return yScale(lineData[d]); });
      svg.append("path").datum(years).attr("d", line).attr("class", "line");
  
      // Draw Axes
      svg.append("g").attr("transform", "translate(0, " + (h - xPadding) + ")").call(xAxis);
      svg.append("g").attr("transform", "translate(" + yPadding + ", 0)").call(yAxis);

      // Draw Year Market
      svg.append("circle").attr("cx", xScale(year)).attr("cy", yScale(lineData[year])).attr("r", 4).attr("class", "marker");
      svg.append("text").text(lineData[year]).attr("id", "markerText").attr("x", xScale(year) - 25).attr("y", yScale(lineData[year]) + 15);

      // Update Year Marker On Year Change
      document.getElementById("year").addEventListener("change", (e) => {
        let newYear = parseInt(e.target.value);
        svg.select("circle").transition().duration(500).ease(d3.easeCubicInOut).attr("cx", xScale(newYear)).attr("cy", yScale(lineData[newYear]));
        svg.select("#markerText").transition().duration(500).ease(d3.easeCubicInOut).text(lineData[newYear]).attr("x", xScale(newYear) - 25).attr("y", yScale(lineData[newYear]) + 15);
      });
    }
  });
}
