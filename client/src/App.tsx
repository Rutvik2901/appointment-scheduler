import { LoadingOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import moment from "moment-timezone";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { useEffect, useMemo, useRef, useState } from "react";
import "react-calendar/dist/Calendar.css";
import "./App.css";
import CalendarSection from "./Components/CalendarSection";
import MeetingInfo from "./Components/MeetingInfo";
import { baseUrl } from "./utils";

function App() {
  const toast = useRef<any>(null);

  const todayDate = useMemo(() => {
    const date = new Date();
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }, []);

  const [date, setDate] = useState<any>(todayDate);
  const [meetingDuration, setMeetingDuration] = useState<any>(30);
  const [data, setData] = useState<any[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<any>("Asia/Kolkata");
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<any>();
  const [creatingAppointment, setCreatingAppointment] = useState(false);

  const showSuccess = (type: string, message: string) => {
    toast.current.show({ severity: type, summary: type.substring(0, 1).toUpperCase() + type.substring(1), detail: message, life: 3000 });
  };

  const fetchFreeSlots = () => {
    fetch(`${baseUrl}/free-slots?date=${moment(date).tz(selectedTimezone).format("YYYY-MM-DD")}&timezone=${selectedTimezone}`)
      .then((res) => res.json())
      .then((data) => setData(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (date && selectedTimezone) fetchFreeSlots();
  }, [date, selectedTimezone]);

  const saveAppointMent = () => {
    if (meetingDuration <= 0) {
      showSuccess("error", "Please verify the meeting duration");
      return;
    }
    setCreatingAppointment(true);
    const body = { datetime: selectedTime, duration: meetingDuration.toString() };

    fetch(`${baseUrl}/create-event`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } })
      .then((res) => res.json())
      .then((res) => {
        console.log("res: ", res);
        showSuccess(res.type, res.message);

        if (res.type === "success") {
          setMeetingDuration(30);
          fetchFreeSlots();
          setSelectedTime(null);
          setLoading(true);
        }
      })
      .catch(() => {
        showSuccess("error", "Fail to schedule an appointment. Please try again after sometime");
      })
      .finally(() => {
        setCreatingAppointment(false);
      });
  };

  const dateWithMeetingDurationGap = useMemo(() => {
    return moment(selectedTime).clone().add(meetingDuration, "minutes").format("hh:mm A");
  }, [selectedTime, meetingDuration]);

  return (
    <div className="App">
      <Toast ref={toast} />
      <div className="App-header">
        <MeetingInfo
          date={date}
          dateWithMeetingDurationGap={dateWithMeetingDurationGap}
          meetingDuration={meetingDuration}
          selectedTime={selectedTime}
          setMeetingDuration={setMeetingDuration}
          selectedTimezone={selectedTimezone}
        />

        <CalendarSection
          date={date}
          selectedTimezone={selectedTimezone}
          setDate={setDate}
          setLoading={setLoading}
          setSelectedTime={setSelectedTime}
          setSelectedTimezone={setSelectedTimezone}
          todayDate={todayDate}
        />

        <div
          className="scheduleInfo"
          style={{
            justifyContent: loading || (data && data.length === 0) ? "center" : "flex-start",
          }}
        >
          {loading ? (
            <LoadingOutlined style={{ color: "#4338ca" }} />
          ) : data && data.length > 0 ? (
            data.map((d, index) => (
              <div style={{ height: 50, display: "flex", cursor: "pointer", justifyContent: "space-between" }} onClick={() => setSelectedTime(d)}>
                <Typography.Text
                  key={index}
                  style={{
                    fontWeight: 500,
                    border: selectedTime === d ? "none" : "1px solid #4338ca",
                    borderRadius: 6,
                    color: selectedTime === d ? "white" : "#4338ca",
                    fontSize: 16,
                    height: 50,
                    width: selectedTime === d ? "48%" : "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: selectedTime === d ? "#10182899" : "transparent",
                  }}
                >
                  {moment(d).tz(selectedTimezone).format("hh:mm A")}
                </Typography.Text>

                <Button
                  style={{
                    background: "#4338ca",
                    height: "50px",
                    width: "48%",
                    fontWeight: 500,
                    fontSize: 16,
                    display: selectedTime === d ? "inline-flex" : "none",
                  }}
                  loading={creatingAppointment}
                  type="primary"
                  onClick={saveAppointMent}
                >
                  {creatingAppointment ? "" : "Select"}
                </Button>
              </div>
            ))
          ) : (
            <Message severity="warn" text="No appointments available" />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
