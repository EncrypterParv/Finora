import { Instrument } from "./Instrument";
import { InstrumentArt } from "./InstrumentArt";

export default function InstrumentPreview() {
  return <Instrument art={<InstrumentArt />} />;
}
