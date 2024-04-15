import { Canvas } from "paperback-writer";
import "paperback-writer/dist/index.css";
import "./index.css";

function App() {
  return (
    <div className="bg-gray-900 h-[100vh]">
      <Canvas config={{ debugMode: true }} />
    </div>
  );
}

export default App;
