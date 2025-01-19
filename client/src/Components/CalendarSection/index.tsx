import { Typography } from "antd";
import { Calendar } from "primereact/calendar";
import React from "react";
import TimezoneSelect from "react-timezone-select";

type Props = {
  todayDate: any;
  setSelectedTime: (e: any) => void;
  date: any;
  setDate: (e: any) => void;
  setLoading: (e: any) => void;
  selectedTimezone: any;
  setSelectedTimezone: (e: any) => any;
};

const CalendarSection: React.FC<Props> = ({ setSelectedTime, todayDate, date, setDate, setLoading, selectedTimezone, setSelectedTimezone }) => {
  return (
    <>
      <div className="calendarSection">
        <Typography.Title level={5} style={{ margin: 0 }}>
          Select Date & Time
        </Typography.Title>

        <Calendar
          disabledDays={[0]}
          minDate={todayDate}
          className="calendar"
          value={date}
          onChange={(e) => {
            setLoading(true);
            setDate(e.value);
            setSelectedTime(null);
          }}
          inline
        />

        <div className="timeZoneSection">
          <Typography.Title level={5} style={{ margin: 0 }}>
            Time zone
          </Typography.Title>
          <TimezoneSelect
            menuPlacement="auto"
            className="timeZoneElement"
            value={selectedTimezone}
            onChange={(value) => {
              setLoading(true);
              setSelectedTimezone(value.value);
              setSelectedTime(null);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default CalendarSection;
