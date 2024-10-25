import { Flex, useColorModeValue, Image, Text } from '@chakra-ui/react';
import Avatar5 from 'assets/img/avatars/image.png'; // Default avatar
import { HSeparator } from 'components/separator/Separator';
import { useEffect, useState } from 'react';

export function SidebarBrand() {
  // Chakra color mode
  let logoColor = useColorModeValue('#474d4', 'white');

  // State to manage user image and name
  const [userImage, setUserImage] = useState(Avatar5);
  const [userName, setUserName] = useState("User");

  // Check localStorage for user details on component mount
  useEffect(() => {
    const userDetails = localStorage.getItem("userDetails");
    const userImage = localStorage.getItem("userImage");
    if (userDetails) {
      const { displayName } = JSON.parse(userDetails);
      if (displayName) setUserName(displayName);
      if (userImage) setUserImage(userImage);
    }
  }, []);

  return (
    <Flex alignItems='center' flexDirection='column'>
      {/* Profile Section */}
      <Flex alignItems="center" mb="20px">
        {/* Profile Image */}
        <Image
          src={userImage || Avatar5} // Use saved image or fallback to default
          alt="Profile Image"
          borderRadius="full"
          boxSize="40px" // Adjust size as needed
          mr="10px" // Add some space between the image and the name
        />
        {/* Profile Name */}
        <Text fontSize="md" color={logoColor} fontWeight="bold">
          {userName || "Kyle Anderson"} {/* Use saved name or fallback to default */}
        </Text>
      </Flex>
      
      <HSeparator mb='20px' />
    </Flex>
  );
}

export default SidebarBrand;
