// Chakra imports
import { Box, Flex, Text, Spinner, useColorModeValue } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import Card from 'components/card/Card';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

// API endpoint
const API_URL = 'http://localhost:5000/api/pie-chart';

// Helper to get user email from local storage
const getUserEmail = () => {
  const userDetails = JSON.parse(localStorage.getItem('userDetails'));
  return userDetails?.email || '';
};

export default function Conversion(props: any) {
  const { ...rest } = props;
  const [chartData, setChartData] = useState([]); // State for chart data
  const [loading, setLoading] = useState(true); // Loading state
  const [retryCount, setRetryCount] = useState(0); // Retry tracking

  // Call all hooks at the top level
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const loadingTextColor = useColorModeValue('gray.600', 'gray.400');

  // Fetch chart data from API with retry logic
  useEffect(() => {
    const fetchChartData = async () => {
      const email = getUserEmail();
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const data = await response.json();
          const formattedData = data.labels.map((item:any, index:any) => ({
            label: item.label,
            value: item.value,
            color: getColor(index),
          }));
          setChartData(formattedData);
          setLoading(false); // Stop loading when data is fetched
        } else {
          throw new Error('Failed to fetch chart data');
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1); // Increment retry count
        }, Math.min(1000 * 2 ** retryCount, 30000)); // Exponential backoff with max wait of 30s
      }
    };

    fetchChartData(); // Call fetch function on component mount
  }, [retryCount]);

  // Function to assign colors based on index
  const getColor = (index: number) => {
    const colors = ['#5C5C5C', '#A67A44', '#4B4B39', '#F7DF79', '#B3B3A6'];
    return colors[index % colors.length];
  };

  // Show loading spinner and message if data is still loading
  if (loading) {
    return (
      <Flex
        direction="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        w="100%"
        {...rest}
      >
        <Spinner size="xl" color="teal.500" mb={4} />
        <Text fontSize="sm" color={loadingTextColor}>
          Data is processing...
        </Text>
      </Flex>
    );
  }

  return (
    <Card
      alignItems="center"
      flexDirection="column"
      w="100%"
      bg="transparent"
      boxShadow="none"
      {...rest}
    >
      <Text fontSize="lg" fontWeight="bold" mb="4" color={textColor}>
        With Whom You Spent Most Of Your Time.
      </Text>
      <Box w="200px" h="200px">
        <PieChart width={300} height={300}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            innerRadius={80}
            outerRadius={140}
            paddingAngle={5}
            fill="#8884d8"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </Box>
    </Card>
  );
}
