export { coordinatePlane, type CoordinatePlaneSpec } from "./coordinate-plane";
export { barChart, type BarChartSpec } from "./bar-chart";
export { scatterPlot, type ScatterPlotSpec } from "./scatter-plot";
export { dataTable, type DataTableSpec } from "./data-table";
export { svgToDataUri, CB_SVG_THEME } from "./theme";

import { coordinatePlane, type CoordinatePlaneSpec } from "./coordinate-plane";
import { barChart, type BarChartSpec } from "./bar-chart";
import { scatterPlot, type ScatterPlotSpec } from "./scatter-plot";
import { dataTable, type DataTableSpec } from "./data-table";
import { svgToDataUri } from "./theme";

export type StimulusSpec =
  | { kind: "coordinatePlane"; spec: CoordinatePlaneSpec }
  | { kind: "barChart"; spec: BarChartSpec }
  | { kind: "scatterPlot"; spec: ScatterPlotSpec }
  | { kind: "dataTable"; spec: DataTableSpec };

export function renderStimulus(s: StimulusSpec): { svg: string; dataUri: string } {
  let svg: string;
  switch (s.kind) {
    case "coordinatePlane":
      svg = coordinatePlane(s.spec);
      break;
    case "barChart":
      svg = barChart(s.spec);
      break;
    case "scatterPlot":
      svg = scatterPlot(s.spec);
      break;
    case "dataTable":
      svg = dataTable(s.spec);
      break;
    default: {
      const _exhaustive: never = s;
      throw new Error(`Unknown stimulus kind`);
    }
  }
  return { svg, dataUri: svgToDataUri(svg) };
}
