import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // Imports the default styles
import './DateRangeSelector.css';
import { Calendar, X } from 'lucide-react';

// Pass in onDateChange function from App.js
function DateRangeSelector({ onDateChange }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleStartDateChange = (date) => {
    setStartDate(date);
    onDateChange(date, endDate); // Send update
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    onDateChange(startDate, date); // Send update
  };

  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
    onDateChange(null, null); // Send update
  };

  return (
    <div className="date-range-container">
      <div className="date-picker-wrapper">
        <Calendar className="date-picker-icon" />
        <DatePicker
          selected={startDate}
          onChange={handleStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          placeholderText="Start Date"
          className="date-picker-input"
          isClearable
        />
      </div>
      <div className="date-picker-wrapper">
        <Calendar className="date-picker-icon" />
        <DatePicker
          selected={endDate}
          onChange={handleEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          placeholderText="End Date"
          className="date-picker-input"
          isClearable
        />
      </div>
      <button onClick={clearDates} className="clear-dates-btn">
        <X size={16} /> All Time
      </button>
    </div>
  );
}

export default DateRangeSelector;
