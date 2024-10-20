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
    base: 'calc(100vw - 6%)',  // Mobile views remain the same
    md: 'calc(100vw - 8%)',    // Mobile views remain the same
    lg: 'calc(100vw - 6%)',    // Desktop views remain the same
    xl: isSidebarOpen ? 'calc(100vw - 350px)' : '90vw', // Adjust based on sidebar state
    '2xl': isSidebarOpen ? 'calc(100vw - 400px)' : '90vw', // Adjust based on sidebar state
  };
  

  // Here are all the props that may change depending on navbar's type or state.(secondary, variant, scrolled)
  let mainText = useColorModeValue('navy.700', 'white');
  let secondaryText = useColorModeValue('gray.700', 'white');
  let navbarPosition = 'fixed' as const;
  let navbarFilter = 'none';
  let navbarBackdrop = 'blur(20px)';
  let navbarShadow = 'none';
  let navbarBg = useColorModeValue('rgba(244, 247, 254, 0.2)', 'rgb(55, 60, 49)');
  let navbarBorder = 'transparent';
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
      backdropFilter={navbarBackdrop}
      backgroundPosition='center'
      backgroundSize='cover'
      borderRadius='16px'
      borderWidth='1.5px'
      borderStyle='solid'
      transition='0.5s ease' // Smooth transition for navbar width and alignment
      alignItems='center'
      display={secondary ? 'block' : 'flex'}
      minH='75px'
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
