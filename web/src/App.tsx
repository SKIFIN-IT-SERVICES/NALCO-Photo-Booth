import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BoothProvider, useBooth } from "./state/BoothContext";
import Welcome from "./screens/Welcome";
import Capture from "./screens/Capture";
import Confirm from "./screens/Confirm";
import ScenePicker from "./screens/ScenePicker";
import FormatPicker from "./screens/FormatPicker";
import Generating from "./screens/Generating";
import Result from "./screens/Result";
import ErrorScreen from "./screens/ErrorScreen";
import Viewer from "./screens/Viewer";

function Booth() {
  const { step } = useBooth();

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div key={step} className="screen-fade h-full w-full">
        {step === "welcome" && <Welcome />}
        {step === "capture" && <Capture />}
        {step === "confirm" && <Confirm />}
        {step === "scene" && <ScenePicker />}
        {step === "format" && <FormatPicker />}
        {step === "generating" && <Generating />}
        {step === "result" && <Result />}
        {step === "error" && <ErrorScreen />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/view/:sessionId" element={<Viewer />} />
        <Route
          path="*"
          element={
            <BoothProvider>
              <Booth />
            </BoothProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
