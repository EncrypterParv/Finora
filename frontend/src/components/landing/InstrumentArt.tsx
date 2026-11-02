import { instrumentArt } from "./instrument-geometry";

export function InstrumentArt() {
  return (
    <svg
      className="iso-svg finora-machine"
      viewBox="0 0 680 500"
      role="img"
      aria-label="An isometric accounting machine with a statement feeder, sorting rollers, calendar bars, a linear forecasting scale and removable cover"
    >
      <g dangerouslySetInnerHTML={{ __html: instrumentArt.base }} />
      <g
        className="machine-input"
        data-assembly="0"
        dangerouslySetInnerHTML={{ __html: instrumentArt.input }}
      />
      <g
        className="machine-pattern"
        data-assembly="1"
        dangerouslySetInnerHTML={{ __html: instrumentArt.pattern }}
      />
      <g
        className="machine-forecast"
        data-assembly="2"
        dangerouslySetInnerHTML={{ __html: instrumentArt.forecast }}
      />
      <g
        className="machine-lid"
        dangerouslySetInnerHTML={{ __html: instrumentArt.lid }}
      />
    </svg>
  );
}
