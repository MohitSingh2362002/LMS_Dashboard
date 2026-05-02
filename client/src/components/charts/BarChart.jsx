import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const palette = {
  teal: "rgba(15, 118, 110, 0.85)",
  tealLight: "rgba(15, 118, 110, 0.15)",
  amber: "rgba(217, 119, 6, 0.85)",
  amberLight: "rgba(217, 119, 6, 0.15)",
  rose: "rgba(225, 29, 72, 0.85)",
  roseLight: "rgba(225, 29, 72, 0.15)",
  slate: "rgba(100, 116, 139, 0.85)",
  slateLight: "rgba(100, 116, 139, 0.15)",
  indigo: "rgba(79, 70, 229, 0.85)",
  indigoLight: "rgba(79, 70, 229, 0.15)",
};

const defaultColors = [palette.teal, palette.amber, palette.rose, palette.indigo, palette.slate];

const BarChart = ({ labels = [], datasets = [], height = 260, horizontal = false, stacked = false }) => {
  const coloredDatasets = datasets.map((ds, i) => ({
    backgroundColor: ds.backgroundColor || defaultColors[i % defaultColors.length],
    borderRadius: 8,
    borderSkipped: false,
    maxBarThickness: 48,
    ...ds,
  }));

  const data = { labels, datasets: coloredDatasets };

  const options = {
    indexAxis: horizontal ? "y" : "x",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: "top",
        labels: { usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 12, family: "'IBM Plex Sans', sans-serif" } },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        cornerRadius: 12,
        padding: 12,
        titleFont: { size: 13, family: "'IBM Plex Sans', sans-serif" },
        bodyFont: { size: 12, family: "'IBM Plex Sans', sans-serif" },
      },
    },
    scales: {
      x: {
        stacked,
        grid: { display: false },
        ticks: { font: { size: 11, family: "'IBM Plex Sans', sans-serif" }, color: "#94a3b8" },
      },
      y: {
        stacked,
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11, family: "'IBM Plex Sans', sans-serif" }, color: "#94a3b8" },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChart;
