'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WheelPickerProps {
  items: (string | number)[];
  onChange: (value: string | number) => void;
  value?: string | number;
  height?: number;
  itemHeight?: number;
}

const WheelPicker: React.FC<WheelPickerProps> = ({
  items,
  onChange,
  value,
  height = 200,
  itemHeight = 40,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const halfVisibleItems = Math.floor((height || 200) / (itemHeight || 40) / 2);

  const scrollToItem = useCallback((index: number) => {
    if (wrapperRef.current) {
      const newScrollTop = index * (itemHeight || 40);
      wrapperRef.current.scrollTop = newScrollTop;
      if (index !== currentIndex) {
        setCurrentIndex(index);
        if (onChange && items[index] !== undefined) {
          onChange(items[index]);
        }
      }
    }
  }, [items, onChange, itemHeight, currentIndex]);

  useEffect(() => {
    if (value !== undefined) {
      const initialIndex = items.indexOf(value);
      if (initialIndex !== -1) {
        scrollToItem(initialIndex);
      }
    } else if (items.length > 0) {
      scrollToItem(0);
    }
  }, [value, items, scrollToItem]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartScrollTop(wrapperRef.current?.scrollTop || 0);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !wrapperRef.current) return;
    const deltaY = e.clientY - startY;
    wrapperRef.current.scrollTop = startScrollTop - deltaY;
  };
  
  const snapToNearestItem = useCallback(() => {
    if (wrapperRef.current) {
      const scrollTop = wrapperRef.current.scrollTop;
      const nearestIndex = Math.round(scrollTop / (itemHeight || 40));
      const clampedIndex = Math.max(0, Math.min(items.length - 1, nearestIndex));
      scrollToItem(clampedIndex);
    }
  }, [itemHeight, items.length, scrollToItem]);

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      snapToNearestItem();
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      snapToNearestItem();
    }
  };
  
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = () => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => {
      if (!isDragging) {
        snapToNearestItem();
      }
    }, 150);
  };

  return (
    <div
      className="relative overflow-hidden select-none bg-slate-700 rounded-md"
      style={{ height: `${height}px` }}
    >
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-slate-700 to-transparent pointer-events-none z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-slate-700 to-transparent pointer-events-none z-10"></div>

      <div
        className="absolute left-0 right-0 border-t border-b border-blue-500 pointer-events-none z-10"
        style={{
          top: `${halfVisibleItems * (itemHeight || 40)}px`,
          height: `${itemHeight}px`,
        }}
      ></div>

      <div
        ref={wrapperRef}
        className="w-full h-full overflow-y-scroll no-scrollbar"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onScroll={handleScroll}
      >
        <div style={{ height: `${halfVisibleItems * (itemHeight || 40)}px` }}></div>

        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-center text-lg cursor-pointer transition-opacity duration-200 ${
              index === currentIndex ? 'opacity-100' : 'opacity-40'
            }`}
            style={{ height: `${itemHeight}px` }}
            onClick={() => scrollToItem(index)}
          >
            {item}
          </div>
        ))}

        <div style={{ height: `${halfVisibleItems * (itemHeight || 40)}px` }}></div>
      </div>
    </div>
  );
};

export default WheelPicker;
