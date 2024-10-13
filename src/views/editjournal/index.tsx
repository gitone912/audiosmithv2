import { Box, Heading, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import "./EditJournal.css";

interface ContentData {
  title: string;
  paragraphs: string[];
}

const EditJournal = () => {
  const [content, setContent] = useState<ContentData | null>(null);

  useEffect(() => {
    // Simulated data
    const jsonData = {
      title: "Fancy Title",
      paragraphs: [
        "This is the first paragraph of text.",
        "This is the second paragraph of text.",
        "This is the third paragraph of text.",
        "This is the final paragraph of text."
      ]
    };
    setContent(jsonData);
  }, []);

  if (!content) return <Text>Loading...</Text>;

  return (
    <Box className="notebook-paper">
      <header>
        <Heading>{content.title}</Heading>
      </header>
      <Box className="content">
        {content.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </Box>
    </Box>
  );
};

export default EditJournal;
