// Chakra imports
import React, { useEffect, useState } from 'react';
import { Box, SimpleGrid, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
// Firebase imports
import { db } from '../../../firebase'; // Adjust the import based on your file structure
import { collection, getDocs, query, where } from 'firebase/firestore';
// Custom components
import WeeklyRevenue from './WeeklyRevenue';
import PieCard from './PieCard';
import WordChart from './WordChart';
import LifeSat from './LifeSat';

export default function ActionRec() {
    const [hasEntries, setHasEntries] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    // Chakra Color Mode
    const brandColor = useColorModeValue('brand.500', 'white');
    const overlayColor = useColorModeValue('rgba(255, 255, 255, 0.5)', 'rgba(0, 0, 0, 0.5)'); // Blur effect overlay color
    const textColor = useColorModeValue('gray.700', 'gray.200'); // Text color for no journals message

    // Function to check if user has entries in chats or chat_monologue
    const checkUserEntries = async () => {
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const userEmail = userDetails.email; // Get user email from local storage

        // Fetch chats and chat_monologue collections
        const chatsRef = collection(db, 'chats');
        const chatMonologueRef = collection(db, 'chat_monologue');

        try {
            // Query for chats with the user's email
            const chatsQuery = query(chatsRef, where('user', '==', userEmail));
            const chatMonologueQuery = query(chatMonologueRef, where('user', '==', userEmail));

            // Check if the user has any entries in either collection
            const chatsSnapshot = await getDocs(chatsQuery);
            const chatMonologueSnapshot = await getDocs(chatMonologueQuery);

            // Set hasEntries state based on whether any documents exist
            const userHasChats = !chatsSnapshot.empty; // If chats exist
            const userHasMonologues = !chatMonologueSnapshot.empty; // If monologues exist

            setHasEntries(userHasChats || userHasMonologues); // Set to true if either collection has entries
        } catch (error) {
            console.error("Error fetching user entries:", error);
            setHasEntries(false); // Assume no entries if there's an error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserEntries();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <Spinner size="xl" color={brandColor} />
                <Text ml={2}>Loading...</Text>
            </Box>
        );
    }

    if (hasEntries === false) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" position="relative">
                <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    bg={overlayColor} // Use the overlay color based on the color mode
                    backdropFilter="blur(5px)"
                    zIndex="1"
                />
                <Text fontSize="xl" zIndex="2" color={textColor}>
                    No journals to provide action recommendations.
                </Text>
            </Box>
        );
    }

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='20px' mb='20px'>
                <WeeklyRevenue />
                <PieCard />
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap='100px' mb='100px'>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap='20px' mb='20px'>
                <WordChart />
                <LifeSat />
            </SimpleGrid>
        </Box>
    );
}
