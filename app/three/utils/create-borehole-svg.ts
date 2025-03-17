import * as d3 from "d3";
import { Extent } from "./build-scene";

// SVG dimensions
const margin = { top: 20, right: 20, bottom: 20, left: 80 };
const barWidth = 30;

export interface Data {
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
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Scales: Invert Y-axis so depth increases downward
  const zmax = d3.max(data, (d) => d.depthStart) ?? extent.zmax;
  const zmin = d3.min(data, (d) => d.depthEnd) ?? extent.zmin;
  const zScale = d3
    .scaleLinear()
    .domain([zmax, zmin])
    .range([margin.top, height - margin.bottom]);

  // Create logical group
  const barGroup = svg.append("g");

  // Draw bars (formations)
  barGroup
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", margin.left)
    .attr("y", (d) => zScale(d.depthStart))
    .attr("height", (d) => zScale(d.depthEnd) - zScale(d.depthStart))
    .attr("width", barWidth)
    .attr("fill", (d) => d.color);

  // Add labels (formation names)
  barGroup
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", margin.left + barWidth + 5)
    .attr("y", (d) => (zScale(d.depthStart) + zScale(d.depthEnd)) / 2)
    .attr("text-anchor", "start")
    .attr("fill", "black")
    .style("font-size", "12px")
    .each(function (d) {
      const textElement = d3.select(this);
      textElement.selectAll("tspan").remove(); // Clear previous tspans

      const groups = groupWordsByFour(d.name);
      let dy = 0;

      for (const group of groups) {
        textElement
          .append("tspan")
          .attr("x", margin.left + barWidth + 5)
          .attr("dy", dy)
          .text(group.join(" "));

        dy = 14;
      }
    });

  // Add depth labels
  svg
    .append("g")
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", margin.left - 5)
    .attr("y", (d) =>
      d.depthStart - d.depthEnd < 100
        ? zScale(d.depthStart) - 10
        : zScale(d.depthStart)
    )
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .style("font-size", "12px")
    .text((d) => `${d.depthStart.toFixed(0)}m`);

  // Add label for last depth
  svg
    .append("g")
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", margin.left - 5)
    .attr("y", (d, i) => (i === data.length - 1 ? zScale(d.depthEnd) : null))
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .style("font-size", "12px")
    .text((d, i) => (i === data.length - 1 ? `${d.depthEnd.toFixed(0)}m` : ""));

  return svg.node();
}

// Group words to split lines if necessary
function groupWordsByFour(inputString: string) {
  const words = inputString.split(" ");

  // Use reduce to group the words into chunks of four
  const groups = words.reduce(
    (result: string[][], word: string, index: number) => {
      const groupIndex = Math.floor(index / 4);

      // If the group doesn't exist yet, create an empty array for it
      if (!result[groupIndex]) {
        result[groupIndex] = [];
      }

      // Add the current word to the correct group
      result[groupIndex].push(word);

      return result;
    },
    []
  );

  return groups;
}
