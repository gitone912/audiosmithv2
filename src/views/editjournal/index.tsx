import React, { useState, useEffect } from "react";
import {
  Box, Button, Textarea, VStack, Text, Spinner,
  useColorModeValue, useToast,
  Icon,
  Flex
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import Groq from "groq-sdk";
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
  const collectionName = location.state?.type === "dialogue"
  ? "chats"
  : location.state?.type === "monologue"
  ? "chat_monologue"
  : location.state?.type === "typejournal"
  ? "typejournal"
  : "typechatjournal"; // Default to typechatjournal if no match


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
  const buttonBg = "#9ba192";
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
  const handleDelete = async () => {
    if (!journalId) return;

    try {
      const journalRef = doc(db, collectionName, journalId);
      await deleteDoc(journalRef);

      toast({
        title: "Journal Deleted",
        description: "Your journal has been successfully deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/admin/journals"); // Redirect after deletion
    } catch (error) {
      console.error("Error deleting the journal:", error);
      toast({
        title: "Error",
        description: "Failed to delete the journal.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
      pt={{ base: '80px', md: '150px' }}
      textAlign="center"
      bg={boxBg}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
      px={{ base: '4', md: '8' }}
    >
      {/* Back Button */}
      <Flex
        display={{ base: 'flex', xl: 'flex' }}
        alignItems="center"
        position="fixed"
        top="20px"
        left="20px"
        zIndex="10"
      >
        <Icon
          as={IoChevronBackOutline}
          color="white"
          w="24px"
          h="24px"
          _hover={{ cursor: 'pointer' }}
          onClick={() => navigate(-1)}
        />
      </Flex>

      {/* Main Content Container */}
      <Flex
        width="100%"
        maxW="1200px"
        mx="auto"
        flexDirection={{ base: 'column', md: 'row' }} // Row on desktop, column on mobile
        justifyContent="space-between"
        gap={6} // Adds space between the columns
      >
        {/* Left Column */}
        <VStack
          spacing={4}
          width={{ base: '100%', md: '48%' }}
          maxW="800px"
          mx="auto"
        >
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
                  fontSize={{ base: 'sm', md: 'lg' }}
                  whiteSpace="pre-wrap"
                >
                  {editedJournal}
                </Text>
              </Box>

              <Box>
                <Button
                  bg={buttonBg}
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  m={2}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  bg={buttonBg}
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  m={2}
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  Save
                </Button>
                <Button
                  bg={buttonBg}
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  m={2}
                  onClick={handleDelete}
                >
                  Delete
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
                height={{ base: '300px', md: '700px' }}
                resize="vertical"
                mb={4}
              />
              <Box>
                <Button
                  bg={buttonBg}
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  onClick={handleSave}
                  isLoading={isSaving}
                  m={2}
                >
                  Save
                </Button>
                <Button
                  bg={buttonBg}
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  m={2}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </Box>
            </>
          )}
        </VStack>

        {/* Right Column */}
        <VStack
          spacing={5}
          width={{ base: '100%', md: '48%' }}
          maxW="500px"
          mx="auto"
          bg={boxBg}
          justifyContent="center"
          padding={5}
          display={{ base: 'none', sm: 'block' }}
        >
          {/* Mood Box */}
          <Box bg={SideboxBg} padding={6} borderRadius="16px" width="100%">
            <Box display="flex" alignItems="center">
              <Text fontSize={{ base: '4xl', md: '7xl' }} color="white" mr={4}>
                {moodEmoji}
              </Text>
              <Text fontSize={{ base: 'md', md: 'lg' }} color="white">
                {mood}
              </Text>
            </Box>
          </Box>

          {/* Summary Box */}
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="bold"
            color="#b8b9b7"
            width="100%"
            textAlign="left"
          >
            Summary
          </Text>
          <Box
            bg={SideboxBg}
            padding={5}
            borderRadius="16px"
            width="100%"
            maxH={{ base: '200px', md: '300px' }}
            overflowY="auto"
          >
            <Text color="white" fontSize={{ base: 'sm', md: 'md' }} lineHeight="1.6">
              {summary}
            </Text>
          </Box>

          {/* Action Recommendations Box */}
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="bold"
            color="#b8b9b7"
            width="100%"
            textAlign="left"
          >
            Action Recommendations
          </Text>
          <Box
    bg={SideboxBg}
    padding={5}
    borderRadius="16px"
    width="100%"
>
    <Text color="white" fontSize={{ base: 'sm', md: 'md' }} lineHeight="1.6">
        {formattedTasks.map((task, index) => (
            <span key={index} style={{ display: 'block', marginBottom: '8px' }}>
                {task.trim()}
            </span>
        ))}
    </Text>
</Box>

        </VStack>
      </Flex>
    </Box>
  );
};

export default EditJournals;
