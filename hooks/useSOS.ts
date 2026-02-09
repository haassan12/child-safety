// app/hooks/useSOS.ts
import { sendSOS } from "../services/emergencyService";

export const useSOS = () => {
  const triggerSOS = async (data: any) => {
    await sendSOS(data);
  };

  return { triggerSOS };
};
//example\
