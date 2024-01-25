import {useEditor} from 'paperback-writer'

function App() {
  const editor = useEditor();

  return (
    <>
      {editor}
    </>
  )
}

export default App
