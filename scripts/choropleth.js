import { line } from "./line.js";
import { pie } from "./pie.js";

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
    let color = d3.scaleLinear()
      .domain([d3.min(data, (d) => { if (d.year == initialYear && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); }), 0, d3.max(data, (d) => { if (d.year == initialYear && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); })])
      .range(["red", "lightgreen", "green"]);

    let globalChange = 0; // Global Change TWh
    
    // Bind CSV Data To GeoJSON Properties
    d3.json("./datasets/world.geojson").then((json) => {
      data.forEach(datum => {
        if (datum.year == initialYear)
          for (let i = 0; i < json.features.length; i++) {
            let properties = json.features[i].properties;
            if (properties.name == datum.entity) { properties.value = datum.renewables; break; }
            else if (datum.entity == "World") { globalChange = datum.renewables; break; }
          }
      });

      // Draw Choropleth Using Paths On SVG Element
      svg.selectAll("path").data(json.features).enter().append("path").attr("d", path)
      .style("fill", (d) => { return (d.properties.value) ? color(d.properties.value) : "#ccc"; })
      .classed("country", true)
      .on("click", (d, i) => { if (i.properties.value) {
          line("#line", i.properties.name, document.getElementById("year").value);
          pie("#pie", i.properties.name);
        }
      })
      // Show Tooltips On Hover Over Country
      .append("title").text((d) => { 
        if (d.properties.value) return "Annual Change Renewables: " + d.properties.value + " TWh\nCountry: " + d.properties.name + "\nYear: " + initialYear;
        else return "No Data\nCountry: " + d.properties.name + "\nYear: " + initialYear;
      });

      // Draw Text Showing Annual Change
      svg.append("text").attr("id", "globalChange").text("Global Change: " + globalChange + " TWh").attr("x", "0").attr("y", 15);

      // Draw Color Gradient Scale Rectangle
      svg.append("rect").attr("id", "colorScale").attr("x", 20).attr("y", h - 20).attr("width", 120).attr("height", 20);
      // Get Linear Color Gradient
      const defs = svg.append("defs"), linearGradient = defs.append("linearGradient").attr("id", "linear-gradient");
      linearGradient.selectAll(".stop").data(color.range()).enter().append("stop").attr("offset", (d, i) => i / (color.range().length - 1)).attr("stop-color", d => d);
      // Append Gradient To Rectangle
      svg.select("#colorScale").style("fill", "url(#linear-gradient)").style("opacity", "0.7");
      // Draw Color Gradient Scale
      svg.append("text").text("0").attr("x", 78).attr("y", h - 25);
      svg.append("text").text("TWh").attr("x", 170).attr("y", h - 25);
      svg.append("text").text(Math.ceil(color.domain()[0])).attr("x", 10).attr("y", h - 25).attr("id", "minMarker");
      svg.append("text").text(Math.ceil(color.domain()[2])).attr("x", 130).attr("y", h - 25).attr("id", "maxMarker");
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
    let color = d3.scaleLinear()
      .domain([d3.min(data, (d) => { if (d.year == year && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); }), 0, d3.max(data, (d) => { if (d.year == year && d.code != "" && d.code != "OWID_WRL") return parseFloat(d.renewables); })])
      .range(["red", "lightgreen", "green"]);

    let globalChange = 0; // Global Change TWh
    
    // Bind CSV Data To GeoJSON Properties
    d3.json("./datasets/world.geojson").then((json) => {
      data.forEach(datum => {
        if (datum.year == year)
          for (let i = 0; i < json.features.length; i++) {
            let properties = json.features[i].properties;
            if (properties.name == datum.entity) { properties.value = datum.renewables; break; }
            else if (datum.entity == "World") { globalChange = datum.renewables; break; }
          }
      });

      // Update Choropleth Paths And Add Transition
      svg.selectAll("path").data(json.features)
        .transition().duration(500).ease(d3.easeCubicInOut).attr("d", path)
        .style("fill", (d) => { return (d.properties.value) ? color(d.properties.value) : "#ccc"; })
        .select("title").text((d) => {
          if (d.properties.value) return "Annual Change Renewables: " + d.properties.value + " TWh\nCountry: " + d.properties.name + "\nYear: " + year;
          else return "No Data\nCountry: " + d.properties.name + "\nYear: " + year;
        });

      // Update Global Change Text
      svg.select("#globalChange").text("Global Change: " + globalChange + " TWh");

      // Update Color Scale Text
      d3.select("#minMarker").text(Math.ceil(color.domain()[0]));
      d3.select("#maxMarker").text(Math.ceil(color.domain()[2]));
    });
  });
}
