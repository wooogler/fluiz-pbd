import { Box, Button, Flex, Icon, IconButton, Text } from '@chakra-ui/react';
import useStorage from '@root/src/shared/hooks/useStorage';
import modeStorage from '@root/src/shared/storages/modeStorage';
import { useState, useEffect } from 'react';
import {
  PiCheckFatFill,
  PiRecordFill,
  PiSelectionPlusBold,
} from 'react-icons/pi';
import { getElementUniqueId } from '../injected/detectEvent';
import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';

type Point = null | { x: number; y: number };

type SelectionBox = null | {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function App() {
  const mode = useStorage(modeStorage);
  const [startPoint, setStartPoint] = useState<Point>(null);
  const [currentPoint, setCurrentPoint] = useState<Point>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox>(null);
  const [highlightedElement, setHighlightedElement] =
    useState<HTMLElement | null>(null);

  const handleScreenshot = () => {
    if (mode === 'record') {
      modeStorage.change('screenshot');
    } else {
      modeStorage.change('record');
      clearHighlight();
      if (highlightedElement) {
        const uniqueElementId = getElementUniqueId(highlightedElement);
        const currentPageUrl = window.location.href;
        if (uniqueElementId) {
          chrome.runtime.sendMessage(
            { action: 'getContextId' },
            async response => {
              if (response) {
                const { tabId, windowId } = response;
                eventInfoStorage.addEvent({
                  type: 'screenshot',
                  targetId: uniqueElementId,
                  url: currentPageUrl,
                  tabId,
                  windowId,
                  replayed: false,
                });
              }
            },
          );
        }
      }
    }
  };

  const clearHighlight = () => {
    if (highlightedElement) {
      highlightedElement.removeAttribute('style');
    }
  };

  const highlightElement = (element: HTMLElement) => {
    clearHighlight();
    element.setAttribute(
      'style',
      'outline: 3px solid red; box-shadow: 0 0 10px red;',
    );
    setHighlightedElement(element);
  };

  const updateSelectionBox = (start: Point, current: Point) => {
    if (!start || !current) return;
    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const width = Math.abs(start.x - current.x);
    const height = Math.abs(start.y - current.y);
    setSelectionBox({ x, y, width, height });
  };

  const findLargestElementInSelection = (selectionBox: SelectionBox) => {
    if (!selectionBox) return;

    const allElements = document.querySelectorAll('*');
    let largestElement = null;
    let largestArea = 0;
    allElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (
        rect.top >= selectionBox.y &&
        rect.bottom <= selectionBox.y + selectionBox.height &&
        rect.left >= selectionBox.x &&
        rect.right <= selectionBox.x + selectionBox.width
      ) {
        const area = rect.width * rect.height;
        if (area > largestArea) {
          largestArea = area;
          largestElement = element;
        }
      }
    });

    if (largestElement) {
      highlightElement(largestElement as HTMLElement);
    }
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (mode === 'screenshot') {
        setStartPoint({ x: e.clientX, y: e.clientY });
        setCurrentPoint(null);
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (mode === 'screenshot' && startPoint) {
        setCurrentPoint({ x: e.clientX, y: e.clientY });
        updateSelectionBox(startPoint, { x: e.clientX, y: e.clientY });
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (mode === 'screenshot' && startPoint && currentPoint) {
        updateSelectionBox(startPoint, currentPoint);
        setStartPoint(null);
        setCurrentPoint(null);
        findLargestElementInSelection(selectionBox);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, startPoint, currentPoint, selectionBox]);

  const Overlay = ({ selectionBox }: { selectionBox: SelectionBox }) => {
    if (!selectionBox) return null;

    return (
      <>
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          height={`${selectionBox.y}px`}
          bgColor="rgba(0,0,0,0.3)"
          zIndex="9998"
        />
        <Box
          position="fixed"
          bottom="0"
          left="0"
          right="0"
          height={`calc(100vh - ${selectionBox.y + selectionBox.height}px)`}
          bgColor="rgba(0,0,0,0.3)"
          zIndex="9998"
        />
        <Box
          position="fixed"
          top={`${selectionBox.y}px`}
          left="0"
          width={`${selectionBox.x}px`}
          height={`${selectionBox.height}px`}
          bgColor="rgba(0,0,0,0.3)"
          zIndex="9998"
        />
        <Box
          position="fixed"
          top={`${selectionBox.y}px`}
          right="0"
          left={`${selectionBox.x + selectionBox.width}px`}
          height={`${selectionBox.height}px`}
          bgColor="rgba(0,0,0,0.3)"
          zIndex="9998"
        />
      </>
    );
  };

  return (
    <Box hidden={mode === 'stop'}>
      <Box
        position="fixed"
        top={0}
        left={0}
        w="100%"
        h="3px"
        bg="red.500"
        zIndex="9999"
      />
      <Flex
        position="fixed"
        top={0}
        left="50%"
        transform="translateX(-50%)"
        justify="center"
        align="center"
        height="30px"
        pointerEvents="none"
        bg="red.500"
        zIndex="9999"
        px={3}
        borderRadius="0 0 0.5rem 0.5rem">
        <Box mr={1}>
          <PiRecordFill color="white" />
        </Box>
        <Text color="white">Recording...</Text>
        <Button
          ml={3}
          aria-label="screenshot"
          variant="ghost"
          color="white"
          _hover={{ bg: 'red.600' }}
          onClick={handleScreenshot}
          pointerEvents="auto">
          {mode === 'record' ? (
            <Flex align="center">
              <PiSelectionPlusBold />
              <Text ml={1.5}>Select</Text>
            </Flex>
          ) : (
            <Flex align="center">
              <PiCheckFatFill />
              <Text ml={1.5}>Confirm</Text>
            </Flex>
          )}
        </Button>
      </Flex>
      {mode === 'screenshot' && (
        <>
          <Overlay selectionBox={selectionBox} />
          <Box
            position="fixed"
            top={0}
            left={0}
            width="100vw"
            height="100vh"
            bgColor="transparent"
            zIndex="9998"
            cursor="crosshair">
            {selectionBox && (
              <Box
                position="absolute"
                top={`${selectionBox.y}px`}
                left={`${selectionBox.x}px`}
                width={`${selectionBox.width}px`}
                height={`${selectionBox.height}px`}
                border="2px dash gray"
                zIndex="9999"
                bgColor="transparent"
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
