import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LineChart = ({ labels = [], datasets = [], height = 260, fill = true }) => {
  const coloredDatasets = datasets.map((ds, i) => {
    const colors = [
      { border: "rgba(15, 118, 110, 1)", bg: "rgba(15, 118, 110, 0.10)" },
      { border: "rgba(217, 119, 6, 1)", bg: "rgba(217, 119, 6, 0.10)" },
      { border: "rgba(225, 29, 72, 1)", bg: "rgba(225, 29, 72, 0.10)" },
      { border: "rgba(79, 70, 229, 1)", bg: "rgba(79, 70, 229, 0.10)" },
    ];
    const c = colors[i % colors.length];

    return {
      borderColor: ds.borderColor || c.border,
      backgroundColor: fill ? (ds.backgroundColor || c.bg) : "transparent",
      tension: 0.4,
      fill: fill,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: ds.borderColor || c.border,
      borderWidth: 2.5,
      ...ds,
    };
  });

  const data = { labels, datasets: coloredDatasets };

  const options = {
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
        grid: { display: false },
        ticks: { font: { size: 11, family: "'IBM Plex Sans', sans-serif" }, color: "#94a3b8" },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11, family: "'IBM Plex Sans', sans-serif" }, color: "#94a3b8" },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default LineChart;
