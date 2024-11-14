import { useState, useEffect } from 'react';
import { Box, Button, Flex, Grid, Icon, Text, useToast } from '@chakra-ui/react';
import { db } from '../../../firebase'; // Adjust path as needed for your Firebase setup
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from './nabar';
import { IoChevronBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

export default function LanguageSet() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  // List of available languages
  const languages = ['English', 'German', 'Hindi','Thai','Korean','Tagalog'];

  // Fetch user ID and saved language preference based on email stored in localStorage
  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || '{}');
    if (userDetails && userDetails.email) {
      fetchUserIdAndLanguage(userDetails.email);
    }
  }, []);

  const fetchUserIdAndLanguage = async (email: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        setUserId(doc.id);
        const userData = doc.data();
        if (userData.language) {
          setSelectedLanguage(userData.language); // Set the saved language as selected
        }
      });
    }
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleSaveLanguage = async () => {
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
      await updateDoc(userDocRef, { language: selectedLanguage });

      toast({
        title: 'Language Saved',
        description: `Your preferred language has been set to ${selectedLanguage}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating language:", error);
      toast({
        title: 'Error',
        description: 'Failed to save language selection.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
      <Text fontSize="2xl" fontWeight="bold" mb="6" textAlign="center">Language Settings</Text>
     
      <Navbar />

      {/* Language Options in a Grid */}
      <Grid templateColumns="repeat(3, 1fr)" gap="4" mb="6" mt="20">
        {languages.map((language) => (
          <Box
            key={language}
            border="1px solid rgba(255, 255, 255, 0.2)"
            borderRadius="16px"
            px="20px"
            py="12px"
            cursor="pointer"
            textAlign="center"
            fontWeight="bold"
            bg={selectedLanguage === language ? 'rgb(80, 84, 72)' : 'transparent'}
            color='white'
            onClick={() => handleLanguageSelect(language)}
          >
            {language}
          </Box>
        ))}
      </Grid>

      {/* Save Button */}
      <Flex justify="center">
        <Button onClick={handleSaveLanguage} bg="rgb(80, 84, 72)" color="white" borderRadius="16px" px="6">
          Save
        </Button>
      </Flex>
    </Box>
  );
}
