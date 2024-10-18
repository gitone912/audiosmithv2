import React, { useEffect, useState } from 'react';
import { Box, Text, Spinner, useColorModeValue } from '@chakra-ui/react';
import { TagCloud } from 'react-tagcloud';

export default function WordChart(props: any) {
  const [wordData, setWordData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const textColor = useColorModeValue('gray.700', 'gray.200');
  const spinnerTextColor = useColorModeValue('gray.600', 'gray.400');

  const fetchWordData = async (retryCount = 3) => {
    try {
      const response = await fetch('http://localhost:5000/api/word-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: JSON.parse(localStorage.getItem('userDetails') || '{}').email,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch word data');

      const data = await response.json();
      setWordData(data);
      setLoading(false);
      setError(false);
    } catch (err) {
      console.error('Error fetching word data:', err);
      if (retryCount > 0) {
        setTimeout(() => fetchWordData(retryCount - 1), 1000); // Retry after 1 second
      } else {
        setError(true);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchWordData();
  }, []);

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
        <Spinner size="xl" color="blue.500" />
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
    <Box display="flex" flexDirection="column" alignItems="center" w="100%" {...props}>
      <Text
        fontSize="lg"
        fontWeight="bold"
        mb="4"
        color={textColor}
        textAlign="center"
      >
        {wordData.conclusion}
      </Text>
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center"
        w="400px" 
        h="200px"
      >
        <TagCloud
          minSize={12}
          maxSize={35}
          tags={wordData.data}
          colorOptions={{
            luminosity: 'light',
            hue: 'blue',
          }}
        />
      </Box>
    </Box>
  );
}
