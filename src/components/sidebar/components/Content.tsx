import { Box, Flex, Stack } from '@chakra-ui/react';
import Brand from 'components/sidebar/components/Brand';
import SidebarLinks from './Links';
import { renderTrack, renderThumb, renderView } from 'components/scrollbar/Scrollbar';
import Scrollbars from 'react-custom-scrollbars-2';

function SidebarContent(props: { routes: RoutesType[]; onClose: () => void }) {
	const { routes, onClose } = props;

	return (
		<Flex direction="column" height="100vh" pt="25px" borderRadius="30px" pe={{ lg: '16px', '2xl': '16px' }}>
			<Brand />
			<Scrollbars
              autoHide
              renderTrackVertical={renderTrack}
              renderThumbVertical={renderThumb}
              renderView={renderView}
            >
			<Stack direction="column" mt="8px" mb="auto" overflowY="auto" height="calc(100vh - 100px)">
				<Box ps="20px" pe={{ lg: '16px', '2xl': '16px' }}>
					<SidebarLinks routes={routes} onClose={onClose} />
				</Box>
			</Stack>
			</Scrollbars>
		</Flex>
	);
}

export default SidebarContent;
