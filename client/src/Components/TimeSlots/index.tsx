import { LoadingOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import moment from "moment";
import { Message } from "primereact/message";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createEvent, fetchFreeSlotsByDateAndTimeZone } from "../../service/service";
import { Toast } from "primereact/toast";

type Props = {
  setSelectedTime: (e: any) => void;
  date: any;
  setLoading: (e: boolean) => void;
  selectedTimezone: any;
  loading: boolean;
  selectedTime: any;
  meetingDuration: any;
  setMeetingDuration: (e: any) => void;
};

const TimeSlots: React.FC<Props> = ({ setSelectedTime, date, setLoading, selectedTimezone, loading, selectedTime, meetingDuration, setMeetingDuration }) => {
  const toast = useRef<any>(null);
  const [creatingAppointment, setCreatingAppointment] = useState(false);

  const showSuccess = (type: string, message: string) => {
    toast.current.show({ severity: type, summary: type.substring(0, 1).toUpperCase() + type.substring(1), detail: message, life: 3000 });
  };

  const [data, setData] = useState<any[]>([]);

  const formattedDate = useMemo(() => {
    return moment(date).tz(selectedTimezone).format("YYYY-MM-DD");
  }, [date, selectedTimezone]);

  const fetchFreeSlots = () => {
    fetchFreeSlotsByDateAndTimeZone(formattedDate, selectedTimezone)
      .then((res) => res.json())
      .then((data) => setData(data))
      .finally(() => setLoading(false));
  };

  const saveAppointMent = () => {
    if (meetingDuration <= 0) {
      showSuccess("error", "Please verify the meeting duration");
      return;
    }
    setCreatingAppointment(true);
    const body = { datetime: selectedTime, duration: meetingDuration.toString() };

    createEvent(body)
      .then((res) => res.json())
      .then((res) => {
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

  useEffect(() => {
    if (date && selectedTimezone) fetchFreeSlots();
  }, [date, selectedTimezone]);

  return (
    <>
      <Toast ref={toast} />
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
    </>
  );
};

export default TimeSlots;
