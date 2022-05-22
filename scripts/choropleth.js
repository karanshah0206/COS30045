// Initialise Choropleth On DOM
export function choropleth(domElementId, initialYear) {
  // Dimensions For SVG Element
  let w = 800, h = 500;

  // Rendering SVG Element On DOM
  let svg = d3.select(domElementId).append("svg").attr("height", h).attr("width", w);

  // Map and Projection
  let projection = d3.geoMercator().scale(115).center([0, 41]).translate([w/2, h/2]);
  let path = d3.geoPath().projection(projection);

  // Get Data Frorm CSV File
  d3.csv("./datasets/annual-change-renewables.csv").then((data) => {
    // Generate Color Scheme Based On Data
    let color = d3.scaleQuantize().range(["rgb(255,0,0)", "rgb(254,68,0)", "rgb(248,102,0)", "rgb(238,130,0)", "rgb(223,155,0)", "rgb(205,178,0)", "rgb(182,199,0)", "rgb(152,219,0)", "rgb(111,237,0)", "rgb(0,255,0)"]);
    color.domain([d3.min(data, (d) => { if (d.year == initialYear && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); }), 0, d3.max(data, (d) => { if (d.year == initialYear && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); })]);

    // Bind CSV Data To GeoJSON Properties
    d3.json("./datasets/world.geojson").then((json) => {
      data.forEach(datum => {
        if (datum.year == initialYear)
          for (let i = 0; i < json.features.length; i++) {
            let properties = json.features[i].properties;
            if (properties.name == datum.entity) { properties.value = datum.renewables; break; }
          }
      });

      // Draw Choropleth Using Paths On SVG Element
      svg.selectAll("path").data(json.features).enter().append("path").attr("d", path)
      .style("fill", (d) => { return (d.properties.value) ? color(d.properties.value) : "#ccc"; })
      .classed("country", true)
      // Show Tooltips On Hover Over Country
      .append("title").text((d) => { 
        if (d.properties.value) return "Adoption of Renewables: " + d.properties.value + "%\nCountry: " + d.properties.name + "\nYear: " + initialYear;
        else return "No Data.\nCountry: " + d.properties.name + "\nYear: " + initialYear;
      });
    });
  });

  document.getElementById("year").addEventListener("change", (e) => {
    let year = parseInt(e.target.value);
    document.getElementById("yearLabel").innerText = year;
    transitionChoropleth(svg, path, year);
  });
}

// Update Data On Existing Choropleth With Transition
function transitionChoropleth(svg, path, year) {
  // Get Data From CSV File
  d3.csv("./datasets/annual-change-renewables.csv").then((data) => {
    // Generate Color Scheme Based On Data
    let color = d3.scaleQuantize().range(["rgb(255,0,0)", "rgb(254,68,0)", "rgb(248,102,0)", "rgb(238,130,0)", "rgb(223,155,0)", "rgb(205,178,0)", "rgb(182,199,0)", "rgb(152,219,0)", "rgb(111,237,0)", "rgb(0,255,0)"]);
    color.domain([d3.min(data, (d) => { if (d.year == year && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); }), 0, d3.max(data, (d) => { if (d.year == year && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); })]);

    // Bind CSV Data To GeoJSON Properties
    d3.json("./datasets/world.geojson").then((json) => {
      data.forEach(datum => {
        if (datum.year == year)
          for (let i = 0; i < json.features.length; i++) {
            let properties = json.features[i].properties;
            if (properties.name == datum.entity) { properties.value = datum.renewables; break; }
          }
      });

      // Update Choropleth Paths And Add Transition
      svg.selectAll("path").data(json.features)
        .transition().duration(500).ease(d3.easeCubicInOut).attr("d", path)
        .style("fill", (d) => { return (d.properties.value) ? color(d.properties.value) : "#ccc"; })
        .select("title").text((d) => {
          if (d.properties.value) return "Adoption of Renewables: " + d.properties.value + "%\nCountry: " + d.properties.name + "\nYear: " + year;
          else return "No Data.\nCountry: " + d.properties.name + "\nYear: " + year;
        });
    });
  });
}
