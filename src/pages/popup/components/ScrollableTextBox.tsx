import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface ScrollableTextBoxProps extends BoxProps {
  text: string;
}

const ScrollableTextBox = ({ text, ...boxProps }: ScrollableTextBoxProps) => {
  return (
    <Box
      overflowX="scroll"
      whiteSpace="nowrap"
      sx={{
        '&::-webkit-scrollbar': {
          display: 'none', // 웹킷(Chrome, Safari 등) 기반 브라우저에서 스크롤바 숨김
        },
        '-ms-overflow-style': 'none', // IE, Edge에서 스크롤바 숨김
        scrollbarWidth: 'none', // Firefox에서 스크롤바 숨김
      }}
      {...boxProps}>
      {text}
    </Box>
  );
};

export default ScrollableTextBox;
