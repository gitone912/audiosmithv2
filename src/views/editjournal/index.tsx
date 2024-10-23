import React, { useState, useEffect } from "react";
import {
  Box, Button, Textarea, VStack, Text, Spinner,
  useColorModeValue, useToast,
  IconButton,
  Icon,
  Flex
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { TypeAnimation } from "react-type-animation";
import Groq from "groq-sdk";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { IoChevronBackOutline } from "react-icons/io5";

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

interface Journal {
  title: string;
  compiledJournal: string;
  timestamp: any;
  user: string;
  originalText: string;
  type: "dialogue" | "monologue";
  mood?: string;
  moodEmoji?: string;
  summary?: string;
  actions?: string;
}

const EditJournals: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const journalId = location.state?.id;
  const collectionName = location.state?.type === "dialogue" ? "chats" : "chat_monologue";

  const [journal, setJournal] = useState<Journal | null>(null);
  const [editedJournal, setEditedJournal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [mood, setMood] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [tasks, setTasks] = useState<string>("");
  const [moodEmoji, setMoodEmoji] = useState<string>("");
  const boxBg = useColorModeValue('secondaryGray.300', 'rgb(55, 60, 49)');
  const SideboxBg = useColorModeValue('secondaryGray.300', 'rgb(76,80,71)');
  const sideBoxBg = useColorModeValue("secondaryGray.300", "rgb(76,80,71)");
  const buttonBg = "#a1adb7";
  const textColor = useColorModeValue("black", "white");
  

  
  useEffect(() => {
    const fetchJournal = async () => {
      if (!journalId) return;

      try {
        const journalRef = doc(db, collectionName, journalId);
        const journalSnapshot = await getDoc(journalRef);

        if (journalSnapshot.exists()) {
          const data = journalSnapshot.data() as Journal;
          setJournal(data);
          setEditedJournal(data.compiledJournal);

          // Fetch saved mood, moodEmoji, summary, and tasks from Firestore
          setMood(data.mood || "");
          setMoodEmoji(data.moodEmoji || "");
          setSummary(data.summary || "");
          setTasks(data.actions || "");
        } else {
          toast({
            title: "Error",
            description: `No journal found with ID: ${journalId}`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error fetching journal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();
  }, [journalId]);

  const handleSave = async () => {
    if (!journalId) return;

    setIsSaving(true);

    try {
      const journalRef = doc(db, collectionName, journalId);
      await updateDoc(journalRef, { compiledJournal: editedJournal });

      toast({
        title: "Journal Saved",
        description: "Your journal has been successfully saved.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => navigate("/admin/journals"), 2000);
    } catch (error) {
      console.error("Error saving the journal:", error);
      toast({
        title: "Error",
        description: "Failed to save the journal.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (loading) {
    return (
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  const formattedTasks = tasks.split(/(?=\d+\.)/);

  return (
    
    <Box
      pt={{ base: '100px', md: '150px' }}
      textAlign="center"
      bg={boxBg}
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
    >
       <Flex
        display={{ sm: 'none', xl: 'flex' }}
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
        onClick={() => navigate(-1)} // Navigate to the previous page
      />
</Flex>
      
      <VStack spacing={3} width={{ base: '90%', md: '80%', lg: '60%' }} maxW="800px" mx="auto">
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
                {/* Use the TypeAnimation component */}
                <TypeAnimation
                  sequence={[
                    editedJournal, // The journal text
                    1000, // Pause for a second after typing is finished
                  ]}
                  speed={75} // Typing speed
                  wrapper="span"
                  cursor={true} // Show the cursor
                  repeat={0} // Don't repeat the animation
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </Text>
            </Box>

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


{/* stack that i need to get appeared only when analyse button get clicked , and content here will be generated by groq */}
      <VStack
      spacing={5}
      width={{ base: '90%', md: '80%', lg: '60%' }}
      maxW="500px"
      mx="auto"
      bg={boxBg}
      justifyContent="center"
      padding={5}
    >
      {/* Mood Box */}
      <Text
        fontSize="lg"
        fontWeight="bold"
        color="#b8b9b7"
        width="100%"
        textAlign="left"
      >
        Mood
      </Text>
      <Box
  bg={SideboxBg}
  padding={8}
  borderRadius="16px"
  width="100%"
>
  <Box display="flex" alignItems="center">
    <Text fontSize="7xl" color="white" mr={4}>
      {moodEmoji}
    </Text>
    <Text fontSize="lg" color="white">
    {mood}
    </Text>
  </Box>
</Box>


      {/* Summary Title */}
      <Text
        fontSize="lg"
        fontWeight="bold"
        color="#b8b9b7"
        width="100%"
        textAlign="left"
      >
        Summary
      </Text>

      {/* Summary Box */}
      <Box
        bg={SideboxBg}
        padding={6}
        borderRadius="16px"
        width="100%"
        maxH="300px" // Set max height for scrollable content
        overflowY="auto" // Enable vertical scroll if needed
      >
        <Text color="white" fontSize="md" lineHeight="1.6">
        {summary}
        </Text>
      </Box>

      {/* Action Recommendations Title */}
      <Text
        fontSize="lg"
        fontWeight="bold"
        color="#b8b9b7"
        width="100%"
        textAlign="left"
      >
        Action Recommendations
      </Text>

      {/* Action Recommendations Box */}
      <Box
        bg={SideboxBg}
        padding={6}
        borderRadius="16px"
        width="100%"
        maxH="200px" // Set max height for scrollable content
        overflowY="auto" // Enable vertical scroll if needed
      >
       <Text color="white" fontSize="md" lineHeight="1.6">
  {formattedTasks.map((task, index) => (
    <span key={index} style={{ display: 'block', marginBottom: '8px' }}>
      {task.trim()}
    </span>
  ))}
</Text>

      </Box>
    </VStack>
    </Box>
  );
};
export default EditJournals;
