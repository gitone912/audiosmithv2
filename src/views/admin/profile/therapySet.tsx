import { useState, useEffect } from 'react';
import { Box, Text, Grid, Button, useToast, Flex, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase'; // Adjust the path as necessary
import Navbar from './nabar';
import { IoChevronBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const therapyDetails: { [key: string]: string } = {
  "Cognitive-Behavioral": "If you’re struggling with negative thoughts and habits, CBT can help you recognize and reshape them. This therapy teaches practical skills so you can manage challenging situations better, giving you control over your thoughts and behaviors for a more balanced life.",
  "Cognitive": "If you often find yourself caught in distressing thought patterns, cognitive therapy helps you reframe these thoughts. By learning to recognize distorted thinking, you can reduce emotional distress, making it easier to handle life’s ups and downs.",
  "Behavioral": "If specific behaviors are holding you back, behavioral therapy offers tools to change them directly. Whether it’s overcoming a phobia or breaking a bad habit, this approach focuses on practical actions you can take to create positive changes in your daily life.",
  "Mindfulness-Based": "If stress or anxiety often disrupts your peace of mind, mindfulness-based therapy can help you stay grounded. By focusing on the present moment, you can gain a sense of calm, reduce anxiety, and respond to challenges with clarity and composure.",
  "Dialectical": "For those who experience intense emotions or struggle with relationships, DBT provides skills to manage these feelings effectively. DBT emphasizes acceptance, helping you feel more balanced and in control, especially in tough situations.",
  "Psychodynamic": "If you’re interested in understanding how your past influences your present, psychodynamic therapy can offer deep insights. Exploring unconscious feelings and early experiences helps you gain self-awareness, allowing you to make conscious changes for a healthier, more fulfilling life.",
  "Psychoanalytic": "If you want a deeper exploration of your inner self, psychoanalytic therapy can reveal hidden motivations and conflicts. This long-term approach can be transformative, helping you gain profound insights into your behavior and leading to lasting emotional growth.",
  "Solution-focused": "If you prefer a more direct, goal-oriented approach, solution-focused therapy keeps you moving forward. It helps you focus on your strengths and what’s working in your life, guiding you toward practical solutions and a preferred future without dwelling on past problems.",
  "Interpersonal": "If your relationships are a source of stress, IPT focuses on improving your social connections and communication skills. This can lead to more fulfilling relationships, better support systems, and reduced symptoms of depression or anxiety related to social issues.",
  "Humanistic": "If you’re on a journey of self-discovery, humanistic therapy offers a non-judgmental space to explore who you truly are. It encourages personal growth, helping you achieve greater self-acceptance and reach your full potential, so you can live a life that feels authentic and meaningful."
};

const TherapySet = () => {
  const [selectedTherapy, setSelectedTherapy] = useState<string | null>('Cognitive-Behavioral');
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const toast = useToast();
  const navigate = useNavigate();

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
    setSelectedTherapy(therapy);
    setModalContent(therapyDetails[therapy]);
    setIsModalOpen(true);
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
          onClick={() => navigate("../admin")}
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
        <Button onClick={handleSaveTherapy} bg="rgb(80, 84, 72)" color="white" borderRadius="16px" px="6">
          Save
        </Button>
      </Flex>

      {/* Modal for Therapy Details */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isCentered>
  <ModalOverlay />
  <ModalContent bg="#fcf9f0" borderRadius="lg" p={4} mt="320px">
    <ModalHeader color='black'>{selectedTherapy} Therapy</ModalHeader>
    <ModalCloseButton />
    <ModalBody>
      <Text color='black'>{modalContent}</Text>
    </ModalBody>
  </ModalContent>
</Modal>

    </Box>
  );
};

export default TherapySet;
