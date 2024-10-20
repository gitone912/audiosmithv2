// Chakra imports
import React, { useEffect, useState, Suspense } from 'react';
import { Flex, Spinner, Text } from '@chakra-ui/react';
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
      <Flex
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!accessToken) {
    return (
      <Flex
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Text>Error: Unable to fetch access token</Text>
      </Flex>
    );
  }

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Suspense fallback={<Spinner size="xl" />}>
        <Chat accessToken={accessToken} />
      </Suspense>
    </Flex>
  );
}
