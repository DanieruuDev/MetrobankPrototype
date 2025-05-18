import React, { useEffect, useRef } from 'react';
import { Chart, ArcElement, BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, RadialLinearScale, Title, Tooltip } from 'chart.js';

// Register chart components
Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  RadialLinearScale,
  Filler
);

interface SalesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
    fill?: boolean;
  }[];
}

const LineChart = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Mock data
  const salesData: SalesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: '2023 Sales',
        data: [6500, 5900, 8000, 8100, 5600, 5500, 4000, 6200, 7800, 8200, 9100, 9500],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: '2022 Sales',
        data: [5200, 5400, 6200, 6500, 5000, 4800, 3500, 5100, 6800, 7200, 8300, 8900],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'line',
          data: salesData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Monthly Sales Comparison (2022 vs 2023)',
                font: {
                  size: 16
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: {
                  callback: function(value) {
                    if (typeof value === 'number') {
                      return '$' + value.toLocaleString();
                    }
                    return value;
                  }
                }
              }
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            }
          }
        });

        return () => {
          chart.destroy();
        };
      }
    }
  }, []);

  return (
    <div style={{ height: '250px', width: '100%' }}>
      <canvas ref={chartRef} height="400" />
    </div>
  );
};

const LineGraph = () => {
  return (
    <div style={{
        maxWidth: 'calc(100% - 250px)',
        marginLeft: '250px',
        padding: '20px',
        borderRadius: '8px',
        minHeight: '100vh'
        }}>

      <h2 style={{ color: '#333', marginBottom: '20px' }}>Sales Analytics Dashboard</h2>
      <div style={{ marginBottom: '30px' }}>
        <LineChart />
      </div>
      <div style={{ color: '#666', fontSize: '14px' }}>
        <p>Note: This chart compares monthly sales performance between 2022 and 2023.</p>
      </div>
    </div>
  );
};

export default LineGraph;