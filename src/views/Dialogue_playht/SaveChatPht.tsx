import React, { useState, useEffect } from "react";
import { Box, Button, Textarea, VStack, Text, Spinner, useColorModeValue, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase"; // Ensure firebase config is correctly imported
import { collection, query, orderBy, limit, getDocs, updateDoc, doc } from "firebase/firestore";

// Typing effect hook for journal display
const useTypingEffect = (text: string, speed: number) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isFinished, setIsFinished] = useState(false);
  
    useEffect(() => {
      // Prepend a dummy character (space) to ensure the first character appears properly
      const adjustedText = ' ' + text; // Add a dummy space character in front
  
      setDisplayedText('');  // Reset the displayed text
  
      let currentIndex = 0;
  
      const typeCharacter = () => {
          // Continue the typing effect if no "undefined" is found
          if (currentIndex < adjustedText.length) {
            setDisplayedText((prev) => prev + adjustedText[currentIndex]);
            currentIndex++;
          } else {
            setIsFinished(true);
        }
      };
  
      const interval = setInterval(typeCharacter, speed);
  
      return () => clearInterval(interval);
    }, [text, speed]);  // Reset effect when new text comes in
  
    return { displayedText, isFinished };
  };
  
  

const SaveChatPht: React.FC = () => {
  const [compiledJournal, setCompiledJournal] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedJournal, setEditedJournal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [docId, setDocId] = useState<string>(""); // Track document ID for updating
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const navigate = useNavigate();
  const toast = useToast(); // For displaying notifications

  const boxBg = useColorModeValue('secondaryGray.300', 'rgb(55, 60, 49)');
  const buttonBg = '#a1adb7'; // Button color
  const textColor = useColorModeValue('black', 'white');

  // Store the audio instance globally in the component state
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Typing effect for compiled journal text
  const { displayedText, isFinished } = useTypingEffect(compiledJournal, 20);

  // Fetch the latest compiled journal from Firestore
  useEffect(() => {
    const fetchLatestJournal = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "chats"),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const latestDoc = querySnapshot.docs[0];
          const journalData = latestDoc.data().compiledJournal;
          setCompiledJournal(journalData);
          setEditedJournal(journalData);
          setDocId(latestDoc.id); // Store the document ID for updating
        }
      } catch (error) {
        console.error("Error fetching the latest journal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestJournal();
  }, []);

  // Load the audio in the background when the component mounts
  useEffect(() => {
    const loadAudio = async () => {
      const audioInstance = new Audio("https://github.com/gitone912/testaudio/raw/refs/heads/main/deepgram-stella-1727359968635.mp3");
      audioInstance.load();
      setAudio(audioInstance); // Save the audio instance to state after loading
    };

    loadAudio(); // Call the function to load audio
  }, []);

  // Update the edited journal in Firestore
  const handleSave = async () => {
    if (!docId) return;

    setIsSaving(true); // Show saving state

    try {
      const journalRef = doc(db, "chats", docId);
      await updateDoc(journalRef, { compiledJournal: editedJournal });

      // Play the preloaded audio
      if (audio) {
        await audio.play();
      }

      // Show success message after saving
      toast({
        title: "Journal Saved",
        description: "Your journal has been successfully saved.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Navigate after a slight delay to give time for the audio to play
      setTimeout(() => {
        navigate("/admin/journals");
      }, 2000);
    } catch (error) {
      console.error("Error saving the journal:", error);
      toast({
        title: "Error",
        description: "There was an error saving your journal.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false); // Hide saving state
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box
      pt={{ base: '100px', md: '150px' }}
      textAlign="center"
      bg={boxBg}
      minHeight="100vh"
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
    >
      <VStack spacing={6} width={{ base: '90%', md: '80%', lg: '60%' }} maxW="600px" mx="auto">
        {!isEditing ? (
          <>
            <Box
              width="100%"
              padding={4}
              borderRadius="md"
              border="1px solid"
              borderColor={boxBg}
              bg={boxBg}
            >
              <Text
                color={textColor}
                fontSize={{ base: 'md', md: 'lg' }}
                whiteSpace="pre-wrap"
              >
                {displayedText?.replace(/undefined/gi, '')}
              </Text>
            </Box>

            {isFinished && (
              <Box>
                <Button
                  bg={buttonBg}
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  m={3}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  bg={buttonBg}
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  m={3}
                  onClick={handleSave}
                  isLoading={isSaving} // Show spinner while saving
                >
                  Save
                </Button>
              </Box>
            )}
          </>
        ) : (
          <>
            <Textarea
              value={editedJournal}
              onChange={(e) => setEditedJournal(e.target.value)}
              size="md"
              border="1px solid"
              borderColor={boxBg}
              height="700px"  // Increased the height for a larger edit box
              resize="vertical"  // Allows the user to resize the box vertically if needed
            />

            <Button
              bg={buttonBg}
              color="white"
              size={{ base: 'sm', md: 'md' }}
              fontSize={{ base: 'sm', md: 'md' }}
              onClick={handleSave}
              isLoading={isSaving} // Show spinner while saving
            >
              Save
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default SaveChatPht;
