import React, { useState, useEffect, useRef } from "react";

const AutoCompleteInput = ({
  data = [],
  labelKey = "name",
  placeholder = "Type here...",
  value = "",
  onChangeValue,
  onSelect,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [filteredData, setFilteredData] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);

  // Sync inputValue if parent value changes - prevent infinite loop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter logic
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredData([]);
      return;
    }
    const filtered = data.filter((item) =>
      item[labelKey]?.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredData(filtered.slice(0, 8));
  }, [inputValue, data, labelKey]);

  const closeDropdown = () => {
    setFilteredData([]);
    setHighlightIndex(-1);
  };

  const selectValue = (selectedValue) => {
    setInputValue(selectedValue);
    closeDropdown();
    if (onChangeValue) onChangeValue(selectedValue);
    if (onSelect) onSelect(selectedValue);
  };

  const handleKeyDown = (e) => {
    if (filteredData.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filteredData.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filteredData.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0) {
        selectValue(filteredData[highlightIndex][labelKey]);
      } else if (filteredData.length === 1) {
        selectValue(filteredData[0][labelKey]);
      } else {
        closeDropdown();
      }
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (onChangeValue) onChangeValue(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {filteredData.length > 0 && (
        <ul className="absolute left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl mt-1 max-h-60 overflow-auto shadow-lg z-10">
          {filteredData.map((item, index) => (
            <li
              key={index}
              className={`px-4 py-2 cursor-pointer ${
                index === highlightIndex
                  ? "bg-blue-600 text-white"
                  : "text-gray-200 hover:bg-gray-700"
              }`}
              onMouseDown={() => selectValue(item[labelKey])}
            >
              {item[labelKey]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutoCompleteInput;
