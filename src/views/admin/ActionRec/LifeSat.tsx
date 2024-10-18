import React, { useEffect, useState } from 'react';
import { Box, Text, Badge, Spinner, useColorModeValue } from '@chakra-ui/react';
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

export default function LifeSat(props: any) {
  const [chartData, setChartData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Move useColorModeValue calls outside of any conditional
  const gridColor = useColorModeValue('#ccc', '#a1adb7');
  const angleLineColor = useColorModeValue('#ccc', '#a1adb7');
  const labelColor = useColorModeValue('black', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const spinnerTextColor = useColorModeValue('gray.600', 'gray.400');

  const fetchChartData = async (retryCount = 3) => {
    try {
      const response = await fetch('http://localhost:5000/api/life-satisfaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: JSON.parse(localStorage.getItem('userDetails') || '{}').email,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch chart data');

      const data = await response.json();
      console.log('Fetched data:', data); // Log the fetched data

      // Check if the response has the required properties
      if (!data.analysis || !data.analysis.labels || !data.analysis.datasets || !data.analysis.datasets.length) {
        throw new Error('Invalid response structure');
      }

      // Map the received data to the required format for charting
      const chartFormattedData = {
        labels: data.analysis.labels,
        datasets: [
          {
            label: data.analysis.datasets[0].label,
            data: data.analysis.datasets[0].data,
            backgroundColor: data.analysis.datasets[0].backgroundColor,
            borderColor: data.analysis.datasets[0].borderColor,
            borderWidth: data.analysis.datasets[0].borderWidth,
            pointBackgroundColor: data.analysis.datasets[0].pointBackgroundColor,
            pointBorderColor: data.analysis.datasets[0].pointBorderColor,
            pointHoverBackgroundColor: data.analysis.datasets[0].pointHoverBackgroundColor,
            pointHoverBorderColor: data.analysis.datasets[0].pointHoverBorderColor,
          },
        ],
      };

      setChartData(chartFormattedData);
      setLoading(false);
      setError(false);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      if (retryCount > 0) {
        setTimeout(() => fetchChartData(retryCount - 1), 1000); // Retry after 1 second
      } else {
        setError(true);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        ticks: { display: false },
        grid: { color: gridColor },
        angleLines: { color: angleLineColor },
        pointLabels: {
          color: labelColor,
          font: { size: 12 },
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  // Conditional rendering for loading, error, and data states
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        h="100vh"
        w="100%"
        bg="transparent"
      >
        <Spinner size="xl" color="green.500" />
        <Text mt="2" fontSize="sm" color={spinnerTextColor}>
          Data is processing...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        h="100vh"
        w="100%"
        bg="transparent"
      >
        <Text fontSize="lg" color="red.500">
          Error loading data. Please try again later.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="start"
      w="100%"
      h="100vh"
      pt="10"
      bg="transparent"
      {...props}
    >
      <Text fontSize="lg" fontWeight="bold" mb="1" color={textColor}>
  Life Satisfaction Score
</Text>
<Badge fontSize="md" colorScheme="green" borderRadius="md" px="3" py="1" mb="2">
  {Math.round(
    chartData.datasets[0].data.reduce((a: any, b: any) => a + b, 0) / 
    chartData.datasets[0].data.length
  )}
</Badge>

      <Box w="300px" h="300px">
        <Radar data={chartData} options={options} />
      </Box>
    </Box>
  );
}
