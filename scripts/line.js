// Initialise Line Chart On DOM
export function line(domElementId, initialRegion) {
  // Dimensions For SVG Element
  let w = 600, h = 300;
  let xPadding = 20, yPadding = 55;

  // Rendering SVG Element On DOM
  let svg = d3.select(domElementId).append("svg").attr("height", h).attr("width", w);

  // Read CSV Data
  d3.csv("./datasets/annual-emissions-co2.csv").then((data) => {
    let lineData = data.filter((d) => { return d.country == initialRegion; })[0];
    let dataset = [], years = [];

    for (let i = 1966; i <= 2020; i++) {
      dataset.push(lineData[i]); // Store Data Points For Each Year In Array
      years.push(i); // Store All Years In Ordered Array
    }

    // Get Min & Max Values From Parsed Data
    let min = d3.min(dataset, (d) => { return +d; });
    let max = d3.max(dataset, (d) => { return +d; });

    // Initialising Axes
    let xScale = d3.scaleLinear().domain([1966, 2020]).range([yPadding, w - xPadding]);
    let yScale = d3.scaleLinear().domain([min, max]).range([h - xPadding, 0]);
    let xAxis = d3.axisBottom(xScale), yAxis = d3.axisLeft(yScale);

    // Draw Line
    let line = d3.line().x((d) => { return xScale(d); }).y((d) => { return yScale(lineData[d]); });
    svg.append("path").datum(years).attr("d", line).attr("class", "line");

    // Draw Axes
    svg.append("g").attr("transform", "translate(0, " + (h - xPadding) + ")").call(xAxis);
    svg.append("g").attr("transform", "translate(" + yPadding + ", 0)").call(yAxis);
  });
}