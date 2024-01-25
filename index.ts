import { useEffect, useState } from 'react'


function useEditor() {
  const [editor, setEditor] = useState<string | null>(null);

  useEffect(() => {
    console.log('[SIDE EFFECT] setting editor')
    setEditor('greatest editor ever')
  }, [])

  return editor
}

export { useEditor };