
export interface Appliance {
  id: string;
  name: string;
  power: number; // in Watts
  quantity: number;
  hours: number; // daily usage in hours
}

export interface CalculationInputs {
  sunHours: number;
  panelWattage: number;
  systemVoltage: number;
  batteryCapacity: number; // Ah
  batteryVoltage: number;
  dod: number; // Depth of Discharge %
  autonomyDays: number;
  systemLoss: number; // %
}

export interface CalculationResults {
  totalConsumptionWh: number;
  totalConsumptionKWh: number;
  peakLoadW: number;
  requiredDailyProductionWh: number;
  requiredPanelCount: number;
  requiredInverterSizeW: number;
  totalBatteryCapacityAh: number;
  batteriesInSeries: number;
  stringsInParallel: number;
  totalBatteries: number;
  totalPanelArea: number;
  consumptionBreakdown: { name: string; value: number }[];
}
