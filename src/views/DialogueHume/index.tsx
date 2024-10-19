// Chakra imports
import React, { useEffect, useState, Suspense } from 'react';
import { Box, SimpleGrid, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
// Firebase imports
import { db } from '../../firebase'; // Adjust the import based on your file structure
import { collection, getDocs, query, where } from 'firebase/firestore';
// Hume API import (assuming you have a method to fetch the access token)
import { fetchAccessToken } from 'hume';

// Lazy load the Chat component (React equivalent to Next.js dynamic imports)
const Chat = React.lazy(() => import('./components/Chat'));

export default function DialogueHume() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch access token on component mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await fetchAccessToken({
          apiKey: String(process.env.REACT_APP_HUME_API_KEY),
          secretKey: String(process.env.REACT_APP_HUME_SECRET_KEY),
        });

        if (token) {
          setAccessToken(token);
        } else {
          console.error('Failed to fetch access token');
        }
      } catch (error) {
        console.error('Error fetching access token:', error);
      } finally {
        setLoading(false);
      }
    };

    getToken();
  }, []);

  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!accessToken) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Text>Error: Unable to fetch access token</Text>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Suspense fallback={<Spinner size="xl" />}>
        <Chat accessToken={accessToken} />
      </Suspense>
    </Box>
  );
}
