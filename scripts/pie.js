// Initialise Pie Chart On DOM
export function pie(domElementId, region) {
  // Dimensions For SVG Element
  let w = 300, h = 300;

  // Clearing Out Any Other Charts
  d3.select(domElementId).selectAll("svg").remove();

  // Chart Heading Based On Choropleth Country Selection
  if (region == "Total World")
    d3.select(domElementId).select("h2").text("Global Energy Consumption By Source 2020 (EJ)");
  // Unselect A Country
  else if (region == d3.select(domElementId).select("h2").text().split(" ").reverse().splice(6).reverse().join(" ")) {
    pie(domElementId, "Total World", year);
    return;
  }
  // Selected Different Country
  else d3.select(domElementId).select("h2").text(region + " Energy Consumption By Source 2020 (EJ)");

  // Rendering SVG Element On DOM
  let svg = d3.select(domElementId).append("svg").attr("height", h).attr("width", w);

  // Read CSV Data
  d3.csv("./datasets/energy-consumption-by-source.csv").then((data) => {
    // Get Data Specific To Selected Region
    let pieData = data.filter((d) => { return d.country == region; })[0];

    // No Data For Selected Region
    if (pieData == undefined) svg.append("text").attr("x", w / 2 - 10).attr("y", h / 2).text("No Data For '" + region + "'!");
    else {
      // Setting Up Dataset
      let dataset = initialiseDataset(pieData);

      // Creating D3 Pie Generator
      let outerRadius = w / 2, innerRadius = 100;
      let pieGenerator = d3.pie();
      let color = d3.scaleOrdinal(d3.schemeCategory10);

      // Setting Up Arcs
      let arc = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius);
      let arcs = svg.selectAll("g.arc").data(pieGenerator(dataset)).enter().append("g")
        .attr("class", "arc")
        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

      // Drawing Arcs On DOM
      arcs.append("path")
        .attr("fill", (d, i) => { return color(i); })
        .attr("d", (d, i) => { return arc(d, i); })
        .append("title").text((d, i) => { return "Source: " + indexToSource(i) + "\nConsumption: " + d.data + " EJ"; });
    }
  });
}

// Adapter Between CSV Data & Pie Chart
function initialiseDataset(data) {
  let dataset = [];
  if (data.oil != "n/a") dataset.push(data.oil); else dataset.push("0");
  if (data.gas != "n/a") dataset.push(data.gas); else dataset.push("0");
  if (data.coal != "n/a") dataset.push(data.coal); else dataset.push("0");
  if (data.nuclear != "n/a") dataset.push(data.nuclear); else dataset.push("0");
  if (data.hydroelectric != "n/a") dataset.push(data.hydroelectric); else dataset.push("0");
  if (data.renewables != "n/a") dataset.push(data.renewables); else dataset.push("0");
  return dataset;
}

function indexToSource(index) {
  switch (index) {
    case 0: return "Oil";
    case 1: return "Natural Gas";
    case 2: return "Coal";
    case 3: return "Nuclear";
    case 4: return "Hydroelectric";
    case 5: return "Other Renewables";
    default: return "Other";
  }
}
