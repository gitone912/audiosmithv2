// Import
import React from 'react';
import { Box, useColorModeValue, Text, Flex, Button } from '@chakra-ui/react';
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
const getlineChartData = (line: string) => ({
  labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  datasets: [
    {
      data: [3, 2, 5, 6, 4, 3.5, 4.5], // Smoothed values to match sample curve
      borderColor: line, // White line
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // Transparent fill under curve
      borderWidth: 2,
      pointBackgroundColor: 'white',
      pointBorderColor: 'transparent',
      tension: 0.4, // Smooth curve tension
      fill: true,
    },
  ],
});

// Chart options with Y-axis on the left and minimalist padding/margins
const getLineChartOptions = (tickColor: string, gridColor: string) => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { top: 10, bottom: 10 },
  },
  scales: {
    x: {
      ticks: {
        color: tickColor, // Dynamic color from useColorModeValue
        padding: 5,
        font: { size: 12 },
      },
      grid: { display: false },
    },
    y: {
      ticks: {
        color: tickColor, // Dynamic color from useColorModeValue
        stepSize: 1,
        padding: 10,
        font: { size: 12 },
      },
      grid: {
        color: gridColor, // Dynamic grid color from useColorModeValue
        drawBorder: false,
      },
    },
  },
  plugins: {
    legend: { display: false }, // Hide legend
  },
});

export default function ActionCompletionRate() {
  // Moved useColorModeValue calls inside the function to comply with React hook rules
  const bgColor = useColorModeValue('gray.100', 'rgb(82,87,76)');
  const textColor = useColorModeValue('black', 'whiteAlpha.900');
  const tickColor = useColorModeValue('black', 'rgba(255, 255, 255, 0.7)');
  const gridColor = useColorModeValue('black', 'rgba(255, 255, 255, 0.2)');
  const line = useColorModeValue('black', 'rgba(255, 255, 255, 0.8)');

  const lineChartOptions = getLineChartOptions(tickColor, gridColor); // Pass dynamic colors
  const lineChartData = getlineChartData(line)

  return (
    <Box
      w="100%"
      maxW="800px"
      p="20px"
      borderRadius="16px"
      bg={bgColor}
      boxShadow="lg"
    >
      {/* Title and Button */}
      <Flex justify="space-between" align="center" mb="20px">
        <Text color={textColor} fontSize="lg" fontWeight="bold">
          Action Completion Rate
        </Text>
        <Button
          size="sm"
          bg="gray.600"
          color="whiteAlpha.900"
          borderRadius="full"
          _hover={{ bg: 'gray.500' }}
        >
          Weekly
        </Button>
      </Flex>

      {/* Chart Container */}
      <Box w="100%" h="300px">
        <Line data={lineChartData} options={lineChartOptions} />
      </Box>
    </Box>
  );
}
