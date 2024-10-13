import { Box, Textarea, Button, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Import Firestore config

// Define the Journal type
interface Journal {
  title: string;
  compiledJournal: string;
  timestamp: any;
  user: string;
  originalText: string;
}

export default function EditJournal() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const journalId = location.state?.id; // Get journal ID from location.state

  // State to hold the journal content and loading/error states
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Track errors
  const [editedText, setEditedText] = useState<string>("");
  const collectionName = location.state?.type === "dialogue" ? "chats" : "chat_monologue";
const journalRef = doc(db, collectionName, journalId);


  // Fetch the journal from Firestore using the passed ID
  const fetchJournal = async () => {
    setLoading(true);
  
    if (!journalId) {
      setError("Invalid journal ID.");
      setLoading(false);
      return;
    }
  
    const collectionName = location.state?.type === "dialogue" ? "chats" : "chat_monologue";
    console.log("Using collection:", collectionName, "with ID:", journalId);
  
    try {
      const journalRef = doc(db, collectionName, journalId);
      const journalSnapshot = await getDoc(journalRef);
  
      if (journalSnapshot.exists()) {
        const data = journalSnapshot.data() as Journal;
        console.log("Fetched journal data:", data); // Log the fetched data
        setJournal(data);
        setEditedText(data.compiledJournal);
      } else {
        setError(`No journal found with ID: ${journalId}`);
      }
    } catch (error) {
      console.error("Error fetching journal:", error);
      setError("Failed to load the journal. Please try again.");
    } finally {
      setTimeout(() => setLoading(false), 500); // Slight delay for better UX
    }
  };
  

  // Fetch journal on component mount
  useEffect(() => {
    fetchJournal();
  }, [journalId]);

  // Save the edited journal back to Firestore
  const handleSave = async () => {
    if (!journalId) return;
  
    try {
      const collectionName = location.state?.type === "dialogue" ? "chats" : "chat_monologue"; // Choose the correct collection
      const journalRef = doc(db, collectionName, journalId); // Use the right collection
      await updateDoc(journalRef, { compiledJournal: editedText });
  
      console.log("Journal updated successfully!");
      navigate(-1); // Navigate back after saving
    } catch (error) {
      console.error("Error updating journal:", error);
      setError("Failed to save the journal. Please try again.");
    }
  };
  

  // Show spinner while loading
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  // Show error if loading fails
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
        <Text color="red.500" mb={4}>
          {error}
        </Text>
        <Button onClick={fetchJournal} colorScheme="yellow">
          Retry
        </Button>
      </Box>
    );
  }

  // Render the journal editor once loaded
  return (
    <Box
  width={{ base: "95%", md: "800px" }}
  height="900px"
  margin="0 auto"
  padding="30px"
  bg="rgb(55, 60, 49)"
  boxShadow="lg"
  fontFamily="'Dancing Script', cursive"
  fontSize={{ base: "lg", md: "2xl" }} // Increased font size for better readability
  color="yellow.400"
>
  <Textarea
    value={editedText}
    onChange={(e) => setEditedText(e.target.value)}
    placeholder="Edit your journal..."
    size="lg"
    height="100%"
    border="none"
    resize="none"
    bg="transparent"
    fontSize={{ base: "xl", md: "2xl" }} // Increased font size in the Textarea
  />
  <Button mt={4} colorScheme="yellow" onClick={handleSave} fontSize="xl">
    Save
  </Button>
</Box>

  );
}
