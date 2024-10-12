// Chakra imports
import { Flex, useColorModeValue, Image, Text } from '@chakra-ui/react';
import Avatar5 from 'assets/img/avatars/avatar6.png';
// Custom components
import { HSeparator } from 'components/separator/Separator';

export function SidebarBrand() {
  // Chakra color mode
  let logoColor = useColorModeValue('navy.700', 'white');

  return (
    <Flex alignItems='center' flexDirection='column'>
      {/* Profile Section */}
      <Flex alignItems="center" mb="20px">
        {/* Profile Image */}
        <Image
          src={Avatar5}
          alt="Profile Image"
          borderRadius="full"
          boxSize="40px" // Adjust size as needed
          mr="10px" // Add some space between the image and the name
        />
        {/* Profile Name */}
        <Text fontSize="md" color={logoColor} fontWeight="bold">
         Kyle Anderson
        </Text>
      </Flex>
      
      <HSeparator mb='20px' />
    </Flex>
  );
}

export default SidebarBrand;
