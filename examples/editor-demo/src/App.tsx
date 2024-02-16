import { defaultConfig, Canvas, CanvasConfigType } from "paperback-writer";
import "paperback-writer/dist/index.css";
import "./index.css";

const config: CanvasConfigType = { ...defaultConfig };
config.stylesConfig.styles.Identifier = "green";
config.debugMode = true;

function App() {
  return (
    <div className="bg-gray-900 h-[100vh]">
      <Canvas
        canvasConfig={config}
        style={{
          width: "700px",
          height: "500px",
          border: "2px solid red",
          backgroundColor: "",
        }}
      />
    </div>
  );
}

export default App;
