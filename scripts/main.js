// Initialise Global Variables
const year = document.getElementById("year");
const yearLabel = document.getElementById("yearLabel");
const playButton = document.getElementById("plause");
const buttons = document.getElementById("buttons").children;
const regionSelector = document.getElementById("countrySelector");
const chart1 = document.getElementById("primaryChart");
const chart2 = document.getElementById("secondaryChart");
const chart2Heading = document.getElementById("secondaryChartTitle");
const chartShare = document.getElementById("shareChart");
const chartShareHeading = document.getElementById("shareChartHeading");
const chartConsumption = document.getElementById("consumptionChart");
const legendConsumption = document.getElementById("consumptionLegend")
const chartHeight = 500;
let activeRegion = "World";

// Initialise All Visualisations
function main() {
    drawChoropleth("2020");
    drawLineChart(activeRegion, "2020");
    initialiseRegionsSelector();
    drawPieChart(regionSelector.value, "2019");
    drawAreaChart();
}

window.onload = main;
