'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for drag and drop state
const DragDropContext = createContext({
  isDragging: false,
  setIsDragging: () => {},
});

// Custom hook to use the drag drop context
export const useDragDrop = () => useContext(DragDropContext);

// Provider component to manage drag and drop state across components
export function DragDropProvider({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Set up global handlers for drag and drop
  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
    };
    
    const handleWindowDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };
    
    // Add event listeners
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    
    // Cleanup
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);
  
  return (
    <DragDropContext.Provider value={{ isDragging, setIsDragging }}>
      {children}
    </DragDropContext.Provider>
  );
}

// A component to create a drop zone
export function DropZone({ onFiles, children, className }) {
  const { isDragging, setIsDragging } = useDragDrop();
  const [isOver, setIsOver] = useState(false);
  const dropCountRef = React.useRef(0);
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropCountRef.current += 1;
    setIsOver(true);
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropCountRef.current -= 1;
    
    if (dropCountRef.current === 0) {
      setIsOver(false);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
    setIsDragging(true);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset counters
    dropCountRef.current = 0;
    setIsOver(false);
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (typeof onFiles === 'function') {
        onFiles(Array.from(e.dataTransfer.files));
      }
    }
  };
  
  return (
    <div
      className={`${className} ${isOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-blue-300 dark:border-blue-700'}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => e.stopPropagation()}
    >
      {typeof children === 'function' ? children(isOver) : children}
    </div>
  );
}