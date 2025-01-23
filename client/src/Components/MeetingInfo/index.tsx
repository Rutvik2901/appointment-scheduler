import { ClockCircleOutlined, EditOutlined, CalendarOutlined } from "@ant-design/icons";
import { Typography, Input, Button } from "antd";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Message } from "primereact/message";
import React, { useMemo, useState } from "react";
import { baseUrl } from "../../utils";
import moment from "moment-timezone";
import styles from "./index.module.css";

type Props = {
  selectedTime: any;
  meetingDuration: any;
  setMeetingDuration: (e: string) => void;
  date: any;
  selectedTimezone: any;
};

enum dateFormat {
  daysMMM = "ddd, MMM D, YYYY",
  hhmm = "hh:mm A",
}

const MeetingInfo: React.FC<Props> = ({ selectedTimezone, meetingDuration, setMeetingDuration, selectedTime, date }) => {
  const [findAllSchedules, setAllSchedules] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [dates, setDates] = useState<any>(null);
  const [loadingScheduleButton, setLoadingScheduleButton] = useState(false);

  const dateWithMeetingDurationGap = useMemo(() => {
    return moment(selectedTime).clone().add(meetingDuration, "minutes").format("hh:mm A");
  }, [selectedTime, meetingDuration]);

  const fetchAllAppointments = () => {
    if (dates && dates.length > 0) {
      setLoadingScheduleButton(true);
      const firstDate = moment(dates[0]).tz(selectedTimezone).format();
      const secondDate = moment(dates[1]).tz(selectedTimezone).endOf("day").format();

      fetch(`${baseUrl}/get-events?startDate=${encodeURIComponent(firstDate)}&endDate=${encodeURIComponent(secondDate)}`)
        .then((res) => res.json())
        .then((data) => {
          setAllSchedules(data);
        })
        .finally(() => setLoadingScheduleButton(false));
    }
  };

  const returnDateRange = (date: string, duration: string) => {
    const addDurationToDate = moment(date).clone().add(duration, "minutes").format();
    <>
      {formateCurrentSchDate(date, dateFormat.hhmm)} - {formateCurrentSchDate(addDurationToDate, dateFormat.hhmm)},
    </>;
  };

  const formateCurrentSchDate = (date: string, format: dateFormat) => {
    return moment(date).format(format);
  };

  const formateDateIntodddMM = useMemo(() => {
    return moment(date).format(dateFormat.daysMMM);
  }, [date]);

  const formatdatehhmm = useMemo(() => {
    return moment(selectedTime).format(dateFormat.hhmm);
  }, [selectedTime]);

  return (
    <>
      <Dialog header="Select dates" visible={visible} className={styles.dialog} onHide={() => setVisible(false)}>
        <div className={styles.dialogContent}>
          <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput hideOnRangeSelection />

          <Button loading={loadingScheduleButton} type="primary" className={styles.findButton} onClick={fetchAllAppointments}>
            Find
          </Button>
        </div>

        <div className={styles.appointmentsContainer}>
          {findAllSchedules && findAllSchedules.length > 0 ? (
            findAllSchedules
              .filter((sch) => sch.parent)
              .map((currentSch, index) => (
                <Typography.Text key={index} className={styles.appointmentDetails}>
                  <CalendarOutlined className={styles.svgIcon} />
                  {currentSch && returnDateRange(currentSch.datetime, currentSch.duration)} {formateCurrentSchDate(currentSch.datetime, dateFormat.daysMMM)}
                </Typography.Text>
              ))
          ) : (
            <Message className={styles.noAppointments} severity="warn" text="No appointments found" />
          )}
        </div>
      </Dialog>

      <div className={styles.meetingInfo}>
        <Typography.Title level={4}>test</Typography.Title>

        <Input
          prefix={<ClockCircleOutlined className={styles.svgIcon} />}
          value={meetingDuration + " mins"}
          onChange={(e) => setMeetingDuration(e.target.value.split(" ")[0])}
          className={styles.durationInput}
          suffix={<EditOutlined />}
        />

        <Typography.Text className={styles.meetingDetails}>
          <CalendarOutlined className={styles.svgIcon} />
          {selectedTime && (
            <>
              {formatdatehhmm} - {dateWithMeetingDurationGap},
            </>
          )}{" "}
          {formateDateIntodddMM}
        </Typography.Text>

        <Button type="primary" className={styles.findAppointmentsButton} onClick={() => setVisible(true)}>
          Find all appointments
        </Button>
      </div>
    </>
  );
};

export default MeetingInfo;
