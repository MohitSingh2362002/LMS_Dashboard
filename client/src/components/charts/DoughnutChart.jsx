import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const defaultColors = [
  "rgba(15, 118, 110, 0.85)",
  "rgba(217, 119, 6, 0.85)",
  "rgba(225, 29, 72, 0.85)",
  "rgba(79, 70, 229, 0.85)",
  "rgba(100, 116, 139, 0.85)",
  "rgba(5, 150, 105, 0.85)",
  "rgba(245, 158, 11, 0.85)",
];

const DoughnutChart = ({ labels = [], data: values = [], colors, height = 240, centerLabel = "" }) => {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors || defaultColors.slice(0, values.length),
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverOffset: 6,
      },
    ],
  };

  const plugins = centerLabel
    ? [
        {
          id: "centerText",
          beforeDraw(chart) {
            const { ctx, width, height: h } = chart;
            ctx.save();
            ctx.font = "600 22px 'IBM Plex Sans', sans-serif";
            ctx.fillStyle = "#0f172a";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(centerLabel, width / 2, h / 2);
            ctx.restore();
          },
        },
      ]
    : [];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
          font: { size: 12, family: "'IBM Plex Sans', sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        cornerRadius: 12,
        padding: 12,
        titleFont: { size: 13, family: "'IBM Plex Sans', sans-serif" },
        bodyFont: { size: 12, family: "'IBM Plex Sans', sans-serif" },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Doughnut data={data} options={options} plugins={plugins} />
    </div>
  );
};

export default DoughnutChart;
