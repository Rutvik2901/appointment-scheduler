import { useMemo, useState } from "react";
import "react-calendar/dist/Calendar.css";
import "./App.css";
import CalendarSection from "./Components/CalendarSection";
import MeetingInfo from "./Components/MeetingInfo";
import TimeSlots from "./Components/TimeSlots";

function App() {
  const todayDate = useMemo(() => {
    const date = new Date();
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }, []);

  const [date, setDate] = useState<any>(todayDate);
  const [meetingDuration, setMeetingDuration] = useState<any>(30);
  const [selectedTimezone, setSelectedTimezone] = useState<any>("Asia/Kolkata");
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<any>();

  return (
    <div className="App">
      <div className="App-header">
        <MeetingInfo date={date} meetingDuration={meetingDuration} selectedTime={selectedTime} setMeetingDuration={setMeetingDuration} selectedTimezone={selectedTimezone} />

        <CalendarSection
          date={date}
          selectedTimezone={selectedTimezone}
          setDate={setDate}
          setLoading={setLoading}
          setSelectedTime={setSelectedTime}
          setSelectedTimezone={setSelectedTimezone}
          todayDate={todayDate}
        />

        <TimeSlots
          date={date}
          selectedTimezone={selectedTimezone}
          setLoading={setLoading}
          setMeetingDuration={setMeetingDuration}
          setSelectedTime={setSelectedTime}
          loading={loading}
          selectedTime={selectedTime}
          meetingDuration={meetingDuration}
        />
      </div>
    </div>
  );
}

export default App;
