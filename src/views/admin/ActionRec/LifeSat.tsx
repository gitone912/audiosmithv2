import React from 'react';
import { Box, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

// Register necessary ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// Radar chart data
const data = {
  labels: [
    'Health',
    'Social Life',
    'Spirituality',
    'Relationships',
    'Emotional Well-Being',
    'Leisure',
    'Career',
  ],
  datasets: [
    {
      label: 'Satisfaction Level',
      data: [70, 60, 50, 80, 65, 55, 75], // Sample values
      backgroundColor: 'rgba(255, 255, 255, 0.3)', // Transparent light green fill
      borderColor: '#a1adb7', // Green border
      borderWidth: 2,
      pointBackgroundColor: 'rgba(102, 187, 106, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(102, 187, 106, 1)',
    },
  ],
};

export default function LifeSat(props: any) {
  // Color mode values
  const gridColor = useColorModeValue('#ccc', '#a1adb7');
  const angleLineColor = useColorModeValue('#ccc', '#a1adb7');
  const labelColor = useColorModeValue('black', 'white')

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        ticks: {
          display: false, // Hide tick values
        },
        grid: {
          color: gridColor, // Grid color
        },
        angleLines: {
          color: angleLineColor, // Angle line color
        },
        pointLabels: {
          color: labelColor, // Set label color to white
          font: {
            size: 12, // Adjust font size if needed
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide the legend
      },
    },
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="start" // Start from the top
      w="100%"
      h="100vh"
      pt="10" // Small padding from top
      bg="transparent" // Transparent background
      {...props}
    >
      <Text
        fontSize="lg"
        fontWeight="bold"
        mb="1" // Reduced margin
        color={useColorModeValue('gray.700', 'gray.200')}
      >
        Life Satisfaction Score
      </Text>
      <Badge
        fontSize="md"
        colorScheme="green"
        borderRadius="md"
        px="3"
        py="1"
        mb="2" // Reduced margin below badge
      >
        64
      </Badge>
      <Box w="300px" h="300px"> {/* Reduced size */}
        <Radar data={data} options={options} />
      </Box>
    </Box>
  );
}
