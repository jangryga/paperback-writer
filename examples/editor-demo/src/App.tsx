import { defaultConfig, Canvas, CanvasConfigType } from "paperback-writer";

const config: CanvasConfigType = { ...defaultConfig };
config.stylesConfig.styles.Identifier = "green";
config.debugMode = true;

function App() {
  return (
    <div>
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
