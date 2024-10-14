// Imports
import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from 'chart.js';

// Registering ChartJS components
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

// Sample data for the chart
const lineChartData = {
  labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  datasets: [
    {
      data: [3, 2, 5, 6, 4, 9, 5], // Example values
      borderColor: 'rgba(255, 255, 255, 0.8)', // White line
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // Transparent fill
      borderWidth: 2,
      pointBackgroundColor: 'white',
      pointBorderColor: 'transparent',
      tension: 0.4, // Smooth curve
      fill: true,
    },
  ],
};

// Chart options with Y-axis on the left and reduced padding/margin
const lineChartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      left: 0, // Remove padding from the left
      right: 0, // Remove padding from the right
      top: 10, // Minimal padding on top
      bottom: 10, // Minimal padding on bottom
    },
  },
  scales: {
    x: {
      ticks: {
        color: 'white', // X-axis tick color
        padding: 5, // Minimal space between ticks and axis
      },
      grid: {
        display: false, // Hide X-axis grid lines
      },
    },
    y: {
      position: 'left' as const, // Shift Y-axis numbers to the left
      ticks: {
        color: 'white',
        stepSize: 1,
        padding: 5, // Reduce padding between numbers and axis
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.2)', // Light grid lines
      },
    },
  },
  plugins: {
    legend: {
      display: false, // Hide legend
    },
  },
};

export default function TotalSpent() {
  const bgColor = useColorModeValue('gray.800', 'gray.700'); // Background color

  return (
    <Box
      w="70%"
      h="50vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={bgColor}
    >
      <Box w="95%" maxW="1000px" h="350px" px="0" py="0"> {/* Reduced size and padding */}
        <Line data={lineChartData} options={lineChartOptions} />
      </Box>
    </Box>
  );
}
