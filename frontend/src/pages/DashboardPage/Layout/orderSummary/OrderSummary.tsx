import React from 'react';
import Chart from "react-apexcharts";
import './orderSummary.css';

export const OrderSummary: React.FC = () => {

    const chartOptions = {
        series: [75], // % đơn hàng đã giao
        chart: {
            height: 200, // 👈 Đặt chiều cao
            width: 200,
            type: "radialBar" as const,
            offsetY: -10,
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                dataLabels: {
                    name: {
                        fontSize: "16px",
                        offsetY: 120,
                    },
                    value: {
                        offsetY: -15,
                        fontSize: "22px",
                        formatter: (val: number) => `${val}%`,
                    },
                },
            },
        },
        fill: {
            type: "gradient",
            gradient: {
                shade: "dark",
                shadeIntensity: 0.15,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 50, 65, 91],
            },
        },
        stroke: {
            dashArray: 3,
        },
        labels: [""],
    };

  return (
    <div className="orderSummary_container">
        <div className="orderSummary_header">
            <h3>Order Summary</h3>
            <div className='orderSummary_header_date'>
                <button>Monthly</button>
                <button>Weekly</button>
                <button>Today</button>
            </div>
        </div>
        <div className="orderSummary_body">
            {/* Biểu đồ */}
            <div className="orderSummary_chart">
                <Chart options={chartOptions} series={chartOptions.series} type="radialBar"/>
            </div>

            {/* Thống kê */}
            <div className="orderSummary_parameter">
                <h3>$ 456,005.99</h3>
                <button>More details</button>
                <div className="orderSummary_parameter_statistic">
                    <div className='item_statistic'>
                        <h4>25</h4>
                        <p>On delivery</p>
                    </div>
                    <div className='item_statistic'>
                        <h4>60</h4>
                        <p>Delivered</p>
                    </div>
                    <div className='item_statistic'>
                        <h4>7</h4>
                        <p>Cancelled</p>
                    </div>
                </div>
            </div>
        </div>
        
    </div>
  )
}
