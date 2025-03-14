import * as d3 from "d3";
import { Extent } from "./build-scene";

// SVG dimensions
const margin = { top: 20, right: 250, bottom: 20, left: 20 };

interface Data {
  depthStart: number;
  depthEnd: number;
  name: string;
  color: string;
}

export function createSVG(
  data: Data[],
  width: number = 400,
  height: number = 800,
  extent: Extent
) {
  console.log(data);
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Scales: Invert Y-axis so depth increases downward
  const zmax = d3.max(data, (d) => d.depthStart) ?? extent.zmax;
  const zmin = d3.max(data, (d) => d.depthEnd) ?? extent.zmin;
  const zScale = d3
    .scaleLinear()
    .domain([zmax, zmin])
    .range([margin.top, height - margin.bottom]);

  // Draw bars (formations)
  svg
    .append("g")
    .selectAll()
    .data(data)
    .join("rect")
    .attr("x", margin.left)
    .attr("y", (d) => zScale(d.depthStart))
    .attr("height", (d) => zScale(d.depthEnd) - zScale(d.depthStart))
    .attr("width", width - margin.left - margin.right)
    .attr("fill", (d) => d.color);

  // Add labels (formation names)
  svg
    .selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", width - margin.right + 5) // Place text slightly outside the bar
    .attr("y", (d) => (zScale(d.depthStart) + zScale(d.depthEnd)) / 2) // Center in the bar
    .text((d) => d.name);

  return svg.node();
}
