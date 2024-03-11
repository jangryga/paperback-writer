import { defaultConfig, Canvas, CanvasConfigType } from "paperback-writer";
import "paperback-writer/dist/index.css";
import "./index.css";

const config: CanvasConfigType = { ...defaultConfig };
config.debugMode = true;

function App() {
  return (
    <div className="bg-gray-900 h-[100vh]">
      <Canvas canvasConfig={config} />
    </div>
  );
}

export default App;
