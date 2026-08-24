"use client";

import { useEffect, useState } from "react";
import styles from "./workshop.module.css";

export function WorkshopLights() {
  const [lightsOn, setLightsOn] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("workshop-lights-out", !lightsOn);
    return () => document.body.classList.remove("workshop-lights-out");
  }, [lightsOn]);

  return (
    <button
      type="button"
      className={styles.lightSwitch}
      aria-pressed={!lightsOn}
      onClick={() => setLightsOn((current) => !current)}
    >
      <span className={styles.switchTrack} aria-hidden="true">
        <span className={styles.switchKnob} />
      </span>
      {lightsOn ? "Turn the lights off" : "Put the lights back on"}
    </button>
  );
}
