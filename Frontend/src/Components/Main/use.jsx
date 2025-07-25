import AutoCompleteInput from "../Components/AutoCompleteInput";
import { useSelector } from "react-redux";

const { masters } = useSelector((state) => state.master);

<AutoCompleteInput
  data={masters}
  labelKey="name"
  placeholder="Enter destination name"
  onSelect={(val) => setName(val)}
/>
