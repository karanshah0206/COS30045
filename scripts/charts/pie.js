/*********************************
   PIE CHART EVENTS & FUNCTIONS
 *********************************/

// Render Pie Chart On Secondary Chart
function drawPieChart(region, selectedYear) {
  // Update Chart Heading
  if (region == "Total World") chartShareHeading.innerHTML = "World Energy Consumption By Source " + selectedYear + " (Exajoules)";
  else if (region.length > 16) chartShareHeading.innerHTML = region.slice(0, 13) + "... Energy Consumption By Source " + selectedYear + " (Exajoules)";
  else chartShareHeading.innerHTML = region + " Energy Consumption By Source " + selectedYear + " (Exajoules)";

  // Clear Out Any Existing Charts
  d3.select("#"+chartShare.id).selectAll("svg").remove();

  // Initialise Dimensions
  let w = chartShare.offsetWidth, h = chartHeight;

  // Render SVG On DOM
  let svg = d3.select("#"+chartShare.id).append("svg").attr("height", h).attr("width", w);

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
      let radius = (w > h*1.5) ? h*1.5 : w;
      let outerRadius = radius/3, innerRadius = radius/4;
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
    if (region == "Total World") chartShareHeading.innerHTML = "World Energy Consumption By Source " + selectedYear + " (Exajoules)";
    else if (region.length > 16) chartShareHeading.innerHTML = region.slice(0, 13) + "... Energy Consumption By Source " + selectedYear + " (Exajoules)";
    else chartShareHeading.innerHTML = region + " Energy Consumption By Source " + selectedYear + " (Exajoules)";

    // Initialise Dimensions
    let w = chartShare.offsetWidth, h = chartHeight;

    // Get Reference To SVG Element On DOM
    let svg = d3.select("#"+chartShare.id).select("svg");

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
        let radius = (w > h*1.5) ? h*1.5 : w;
        let outerRadius = radius/3, innerRadius = radius/4;
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
