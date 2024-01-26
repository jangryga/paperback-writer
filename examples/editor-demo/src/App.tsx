import { Canvas, CanvasConfig } from "paperback-writer"

const config: CanvasConfig = {
  debugMode: true,
}

function App() {
  return <div>
    <Canvas {...config} style={{ width: '700px', height: '500px', border: '2px solid red', backgroundColor: ''}} />
  </div>
} 

export default App
