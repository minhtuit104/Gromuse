import React from 'react';
import Chart from "react-apexcharts";
import './revenue.css';

export const Revenue: React.FC = () => {

    const todayIndex = new Date().getDay();
    const categories = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = [50, 250, 200, 400, 300, 200, 350]; // Dữ liệu doanh thu

    const chartOptions = {
        chart: {
            height: 340, // 👈 Đặt chiều cao
            width: 215,
            type: "line" as const,
            toolbar: {
                show: false,
            },
        },
        stroke: {
          curve: "smooth" as const, 
        },
        xaxis: {
          categories,
          labels: {
            style: {
              colors: categories.map((_, i) => (i === todayIndex ? "#085D4A" : "#525252")),
              fontWeight: 400 // giá trị mặc định cho tất cả
            },
            formatter: function(value: string, opts?: any) {
                return opts?.dataPointIndex === todayIndex ? `<b>${value}</b>` : value;
            }
          },
        },
        yaxis: {
          labels: {
            formatter: (value: number) => `$${value}`,
          },
        },
        markers: {
            size: 0, // kích thước mặc định
            strokeWidth: 0,
            hover: {
                size: 8
            },
            discrete: [{
                seriesIndex: 0,
                dataPointIndex: todayIndex,
                fillColor: '#07795F',
                strokeColor: '#fff',
                size: 6
            }]
        },
        tooltip: {
          y: {
            formatter: (val: number) => `$${val}`, // Hiển thị tooltip với đơn vị tiền
          },
        },
      };
    
      const series = [
        {
          name: "Revenue",
          data,
          color: "#14B589", // Màu của đường biểu đồ
        },
      ];

  return (
    <div className="revenue_container">
        <h3>Revenue</h3>
        <div className="revenue_content">
            <Chart options={chartOptions} series={series} type="line" width={330} />
        </div>
    </div>
  );
}
