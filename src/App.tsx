// ============================================================================
// NEBULA NODE — MAIN APPLICATION
// Assembles Lock Screen + Console Layout
// ============================================================================

import { useEffect } from 'react';
import { useNebulaStore } from './store/nebulaStore';
import { LockScreen } from './components/auth/LockScreen';
import { TopPanel } from './components/panels/TopPanel';
import { LeftPanel } from './components/panels/LeftPanel';
import { CenterPanel } from './components/panels/CenterPanel';
import { RightPanel } from './components/panels/RightPanel';
import { BottomPanel } from './components/panels/BottomPanel';

function App() {
  const { authenticated, initialize } = useNebulaStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!authenticated) {
    return <LockScreen />;
  }

  return (
    <div className="console">
      <TopPanel />
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
      <BottomPanel />
    </div>
  );
}

export default App;
