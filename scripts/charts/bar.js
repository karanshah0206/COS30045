/*********************************
   BAR CHART EVENTS & FUNCTIONS
 *********************************/

// Render Bar Chart On SVG Element
function drawBarChart(region) {
  // Update Chart Heading
  if (region == "Total World") chartShareHeading.innerHTML = "World Energy Consumption By Source (Exajoules)";
  else if (region.length > 16) chartShareHeading.innerHTML = region.slice(0, 13) + "... Energy Consumption By Source (Exajoules)";
  else chartShareHeading.innerHTML = region + " Energy Consumption By Source (Exajoules)";

  // Clear Out Any Existing Charts
  d3.select("#"+chartShare.id).selectAll("svg").remove();

  // Initialise Dimensions
  let w = chartShare.offsetWidth, h = chartHeight, padding = 35;

  // Render SVG On DOM
  let svg = d3.select("#"+chartShare.id).append("svg").attr("height", h).attr("width", w);

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
    if (region == "Total World") chartShareHeading.innerHTML = "World Energy Consumption By Source (Exajoules)";
    else if (region.length > 16) chartShareHeading.innerHTML = region.slice(0, 13) + "... Energy Consumption By Source (Exajoules)";
    else chartShareHeading.innerHTML = region + " Energy Consumption By Source (Exajoules)";

    // Initialise Dimensions
    let w = chartShare.offsetWidth, h = chartHeight, padding = 35;

    // Render SVG On DOM
    let svg = d3.select("#"+chartShare.id).select("svg");

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

            for (let i = 0; i < keys.length*2; i++) {
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
