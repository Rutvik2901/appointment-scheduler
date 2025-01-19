import { ClockCircleOutlined, EditOutlined, CalendarOutlined } from "@ant-design/icons";
import { Typography, Input, Button } from "antd";
import moment from "moment";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Message } from "primereact/message";
import React, { useState } from "react";
import { baseUrl } from "../../utils";

type Props = {
  selectedTime: any;
  meetingDuration: any;
  setMeetingDuration: (e: any) => void;
  dateWithMeetingDurationGap: any;
  date: any;
  selectedTimezone: any;
};

const MeetingInfo: React.FC<Props> = ({ selectedTimezone, meetingDuration, setMeetingDuration, selectedTime, date, dateWithMeetingDurationGap }) => {
  const [findAllSchedules, setAllSchedules] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [dates, setDates] = useState<any>(null);
  const [loadingScheduleButton, setLoadingScheduleButton] = useState(false);

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

  return (
    <>
      <Dialog
        header="Select dates"
        visible={visible}
        style={{ display: "flex", flexDirection: "column" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput hideOnRangeSelection />

          <Button loading={loadingScheduleButton} type="primary" style={{ background: "rgb(67, 56, 202)", fontWeight: 500, fontSize: 14 }} onClick={() => fetchAllAppointments()}>
            Find
          </Button>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {findAllSchedules && findAllSchedules.length > 0 ? (
            findAllSchedules
              .filter((sch) => sch.parent)
              .map((sch) => (
                <Typography.Text style={{ color: "#10182899", fontWeight: 600, display: "flex", gap: 8, marginTop: 16 }}>
                  <CalendarOutlined className="svgIcon" />{" "}
                  {sch && (
                    <>
                      {moment(sch.datetime).format("hh:mm A")} - {moment(sch.datetime).clone().add(sch.duration, "minutes").format("hh:mm A")},
                    </>
                  )}{" "}
                  {moment(sch.datetime).format("ddd, MMM D, YYYY")}
                </Typography.Text>
              ))
          ) : (
            <Message style={{ marginTop: 16 }} severity="warn" text="No appointments found" />
          )}
        </div>
      </Dialog>

      <div className="meetingInfo">
        <Typography.Title level={4}>test</Typography.Title>

        <Input
          prefix={<ClockCircleOutlined className="svgIcon" />}
          value={meetingDuration + " mins"}
          onChange={(e) => {
            setMeetingDuration(e.target.value.split(" ")[0]);
          }}
          className="durationText"
          suffix={<EditOutlined />}
        />

        <Typography.Text style={{ color: "#10182899", fontWeight: 600, display: "flex", gap: 8, marginTop: 16 }}>
          <CalendarOutlined className="svgIcon" />{" "}
          {selectedTime && (
            <>
              {moment(selectedTime).format("hh:mm A")} - {dateWithMeetingDurationGap},
            </>
          )}{" "}
          {moment(date).format("ddd, MMM D, YYYY")}
        </Typography.Text>

        <Button type="primary" style={{ background: "rgb(67, 56, 202)", fontWeight: 500, fontSize: 14, marginTop: 32, marginLeft: "auto", marginRight: "auto" }} onClick={() => setVisible(true)}>
          Find all appointments
        </Button>
      </div>
    </>
  );
};

export default MeetingInfo;
