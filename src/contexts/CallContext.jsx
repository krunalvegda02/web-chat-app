import { createContext, useContext } from 'react';
import { useCall as useCallHook } from '../hooks/useCall';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const callData = useCallHook();
  return <CallContext.Provider value={callData}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};
