import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Link, Text, useColorModeValue } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import AdminNavbarLinks from 'components/navbar/NavbarLinksAdmin';

export default function AdminNavbar(props: {
  secondary: boolean;
  message: string | boolean;
  brandText: string;
  logoText: string;
  fixed: boolean;
  onOpen: (...args: any[]) => any;
  isSidebarOpen: boolean; // Add this prop to track sidebar open/close state
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', changeNavbar);
    return () => {
      window.removeEventListener('scroll', changeNavbar);
    };
  });

  const { secondary, brandText, isSidebarOpen } = props;

  // Adjust navbar styles based on the sidebar open/closed state
  const navbarAlignment = isSidebarOpen ? 'flex-start' : 'center';
  const navbarWidth = {
    base: 'calc(100vw - 6%)',          // Mobile view (up to 480px)
    sm: 'calc(100vw - 7%)',            // Tablet view (between 480px and 768px)
    md: 'calc(100vw - 8%)',            // Larger tablet view (768px and above)
    lg: 'calc(100vw - 6%)',            // Desktop view (1024px and above)
    xl: isSidebarOpen ? 'calc(100vw - 350px)' : '90vw', // Desktop, adjusts for sidebar state
    '2xl': isSidebarOpen ? 'calc(100vw - 400px)' : '90vw', // Extra-large desktops
  };
  
  
  let navbarPosition = 'fixed' as const;
  let navbarFilter = 'none';
  let navbarBackdrop = 'none'; // Remove blur effect
  let navbarShadow = 'none';
  let navbarBg = 'transparent'; // Full transparency
  let navbarBorder = 'transparent'; // Remove border for full transparency
  let secondaryMargin = '0px';
  let paddingX = '15px';
  let gap = '0px';
  
  const changeNavbar = () => {
    if (window.scrollY > 1) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  return (
    <Box
      position={navbarPosition}
      boxShadow={navbarShadow}
      bg={navbarBg}
      borderColor={navbarBorder}
      filter={navbarFilter}
      backdropFilter={navbarBackdrop} // No blur or opacity
      backgroundPosition='center'
      backgroundSize='cover'
      borderRadius='16px'
      borderWidth='1.5px'
      borderStyle='solid'
      transition='0.5s ease' // Smooth transition for navbar width and alignment
      alignItems='center'
      display={secondary ? 'block' : 'flex'}
      minH='25px'
      justifyContent={navbarAlignment} // Dynamically set alignment
      mx='auto'
      mt={secondaryMargin}
      pb='8px'
      right={{ base: '12px', md: '30px', lg: '30px', xl: '30px' }}
      px={{
        sm: paddingX,
        md: '10px',
      }}
      ps={{
        xl: '12px',
      }}
      pt='8px'
      top={{ base: '12px', md: '16px', xl: '18px' }}
      w={navbarWidth} // Dynamically set width based on sidebar state
    >
      <Flex
        w='100%'
        flexDirection={{
          sm: 'column',
          md: 'row',
        }}
        alignItems='center'
        mb={gap}
      >
        <Box ms='auto' w={{ sm: '100%', md: 'unset' }}>
          <AdminNavbarLinks
            onOpen={props.onOpen}
            secondary={props.secondary}
            fixed={props.fixed}
          />
        </Box>
      </Flex>
    </Box>
  );
}
