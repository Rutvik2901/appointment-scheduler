import { LoadingOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import moment from "moment";
import { Message } from "primereact/message";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createEvent, fetchFreeSlotsByDateAndTimeZone } from "../../service/service";
import { Toast } from "primereact/toast";
import styles from "./index.module.css";

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

  const showToast = (type: string, message: string) => {
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
      showToast("error", "Please verify the meeting duration");
      return;
    }
    setCreatingAppointment(true);
    const body = { datetime: selectedTime, duration: meetingDuration.toString() };

    createEvent(body)
      .then((res) => res.json())
      .then((res) => {
        showToast(res.type, res.message);

        if (res.type === "success") {
          setMeetingDuration(30);
          fetchFreeSlots();
          setSelectedTime(null);
          setLoading(true);
        }
      })
      .catch(() => {
        showToast("error", "Fail to schedule an appointment. Please try again after sometime");
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
      <div className={`${loading || (data && data.length === 0) ? styles.justifyContentCenter : styles.justifyContentFlexStart} scheduleInfo`}>
        {loading ? (
          <LoadingOutlined className={styles.loadingOutlined} />
        ) : data && data.length > 0 ? (
          data.map((d, index) => (
            <div className={styles.timeSlots} onClick={() => setSelectedTime(d)}>
              <Typography.Text key={index} className={`${selectedTime === d ? styles.timeZoneText : styles.deSelectedTimeZoneText} ${styles.timeZoneText}`}>
                {moment(d).tz(selectedTimezone).format("hh:mm A")}
              </Typography.Text>

              <Button className={`${selectedTime === d ? styles.inlineFlex : styles.displayNone} ${styles.appointmentSelect}`} loading={creatingAppointment} type="primary" onClick={saveAppointMent}>
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
