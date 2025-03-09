//import React from 'react';
import HeaderDashboard from './Header/HeaderDashboard';
import IconShop from '../../assets/images/icons/Icon_Order.svg';
import IconDeliverred from '../../assets/images/icons/icon_Delivered.svg';
import IconCanceled from '../../assets/images/icons/Icon_Canceled.svg';
import IconRevenue from '../../assets/images/icons/Icon_Revenue.svg';
import './dashboardPage.css';
import { StatCard } from './Layout/statCard/StatCard';
import { OrderSummary } from './Layout/orderSummary/OrderSummary';
import { Revenue } from './Layout/revenue/Revenue';
import BestSelling from './Layout/bestSelling/BestSelling';
import OrderHistory from './Layout/orderHistory/OrderHistory';

const DashboardPage: React.FC = () => {
  const stats = [
    {
      icon: IconShop,
      title: "Total Orders",
      value: "75",
      trend: { value: 4.5, label: "(30 days)" }
    },
    {
      icon: IconDeliverred,
      title: "Total Delivered",
      value: "357",
      trend: { value: 4.0, label: "(30 days)" }
    },
    {
      icon: IconCanceled,
      title: "Total Cancelled",
      value: "65",
      trend: { value: -2.8, label: "(30 days)" }
    },
    {
      icon: IconRevenue,
      title: "Total Revenue",
      value: "$128",
      trend: { value: -8.2, label: "(30 days)" }
    }
  ];

  return (
    <div className='dashboard_container'>
        <HeaderDashboard />
        <div className='top_dash'>
          <h1>Dashboard</h1>
          <p>Hi, Lay's Việt Nam. Welcome back  to Gromuse Admin!</p>
        </div>
        <div className='catagory_dash'>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
        <div className='dash_content'>
          <div className="dash_content_left">
            <OrderSummary />
            <div className='dash_content_left_bottom'>
              <Revenue/>
              <BestSelling/>
            </div>
          </div>
          <div className='dash_content_right'>
            <OrderHistory/>
          </div>
        </div>
    </div>
  )
};

export default DashboardPage;
