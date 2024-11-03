import { useState, useEffect } from 'react';
import { Box, Text, Grid, Button, useToast, Flex, Icon } from '@chakra-ui/react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';// Adjust the path as necessary
import Navbar from './nabar';
import { IoChevronBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const TherapySet = () => {
  const [selectedTherapy, setSelectedTherapy] = useState<string | null>('Cognitive-Behavioral');
  const [userId, setUserId] = useState<string | null>(null);
  const toast = useToast();

  // Therapy options
  const therapies = [
    { name: 'Cognitive-Behavioral', locked: false },
    { name: 'Cognitive', locked: true },
    { name: 'Behavioral', locked: true },
    { name: 'Mindfulness-Based', locked: true },
    { name: 'Dialectical', locked: true },
    { name: 'Psychodynamic', locked: true },
    { name: 'Psychoanalytic', locked: true },
    { name: 'Solution-focused', locked: true },
    { name: 'Interpersonal', locked: true },
    { name: 'Humanistic', locked: true },
  ];

  // Fetch user ID based on email stored in localStorage
  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || '{}');
    if (userDetails && userDetails.email) {
      fetchUserId(userDetails.email);
    }
  }, []);

  const fetchUserId = async (email: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        setUserId(doc.id);
      });
    }
  };

  const handleTherapySelect = (therapy: string, locked: boolean) => {
    if (locked) {
      toast({
        title: 'Locked',
        description: 'This therapy type is locked.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSelectedTherapy(therapy);
  };

  const handleSaveTherapy = async () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User not found',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { therapyType: selectedTherapy });

      toast({
        title: 'Therapy Type Saved',
        description: `Your preferred therapy type has been set to ${selectedTherapy}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating therapy type:", error);
      toast({
        title: 'Error',
        description: 'Failed to save therapy type.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const navigate = useNavigate();

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }} display="flex" flexDirection="column" alignItems="center">
         <Flex
        display={{ sm: 'flex', xl: 'flex' }}
        alignItems="center"
        position="fixed"
        top="20px"
        left="20px"
        zIndex="10"
      >
        <Icon
          as={IoChevronBackOutline}
          color='white'
          w="24px"
          h="24px"
          _hover={{ cursor: 'pointer' }}
          onClick={() => navigate("../admin")} // Navigate to the previous page
        />
      </Flex>
      <Text fontSize="2xl" fontWeight="bold" mb="6" textAlign="center">Therapy Type Settings</Text>
      <Navbar />

      <Grid templateColumns="repeat(2, 1fr)" gap="4" mb="6" mt="20">
        {therapies.map((therapy) => (
          <Box
            key={therapy.name}
            border="1px solid rgba(255, 255, 255, 0.2)"
            borderRadius="16px"
            px="20px"
            py="12px"
            cursor={therapy.locked ? 'not-allowed' : 'pointer'}
            textAlign="center"
            fontWeight="bold"
            bg={selectedTherapy === therapy.name ? 'rgb(80, 84, 72)' : 'transparent'}
            color='white'
            
            onClick={() => handleTherapySelect(therapy.name, therapy.locked)}
          >
            {therapy.name} {therapy.locked && '🔒'}
          </Box>
        ))}
      </Grid>

      {/* Save Button */}
      <Flex justify="center">
        <Button
          onClick={handleSaveTherapy}
          bg="rgb(80, 84, 72)"
          color="white"
          borderRadius="16px"
          px="6"
          _hover={{ bg: 'rgb(70, 74, 62)' }} // Optional: Darker shade on hover
        >
          Save
        </Button>
      </Flex>
    </Box>
  );
};

export default TherapySet;
