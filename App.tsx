import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

import { Appliance, CalculationInputs, CalculationResults } from './types';
import InputField from './components/InputField';
import ResultCard from './components/ResultCard';

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const InverterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const BatteryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const AreaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>;

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];


function App() {
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: uuidv4(), name: 'لامپ LED', power: 10, quantity: 5, hours: 6 },
    { id: uuidv4(), name: 'تلویزیون', power: 150, quantity: 1, hours: 4 },
    { id: uuidv4(), name: 'یخچال', power: 200, quantity: 1, hours: 8 },
    { id: uuidv4(), name: 'شارژر موبایل', power: 15, quantity: 2, hours: 3 },
  ]);

  const [inputs, setInputs] = useState<CalculationInputs>({
    sunHours: 5,
    panelWattage: 350,
    systemVoltage: 24,
    batteryCapacity: 200,
    batteryVoltage: 12,
    dod: 80,
    autonomyDays: 1,
    systemLoss: 25,
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleApplianceChange = (id: string, field: keyof Appliance, value: string | number) => {
    setAppliances(prev =>
      prev.map(app => (app.id === id ? { ...app, [field]: value } : app))
    );
  };

  const addAppliance = () => {
    setAppliances(prev => [...prev, { id: uuidv4(), name: '', power: 0, quantity: 1, hours: 0 }]);
  };

  const removeAppliance = (id: string) => {
    setAppliances(prev => prev.filter(app => app.id !== id));
  };

  const validateInputs = useCallback(() => {
    const newErrors: Record<string, string> = {};
    (Object.keys(inputs) as Array<keyof CalculationInputs>).forEach(key => {
      if (inputs[key] <= 0) {
        newErrors[key] = 'مقدار باید بزرگتر از صفر باشد';
      }
    });
    
    appliances.forEach(app => {
        if (!app.name) newErrors[`app_name_${app.id}`] = 'نام وسیله الزامی است';
        if (app.power <= 0) newErrors[`app_power_${app.id}`] = 'توان باید مثبت باشد';
        if (app.quantity <= 0) newErrors[`app_quantity_${app.id}`] = 'تعداد باید مثبت باشد';
        if (app.hours < 0 || app.hours > 24) newErrors[`app_hours_${app.id}`] = 'ساعت باید بین ۰ و ۲۴ باشد';
    });

    if (inputs.dod > 100) newErrors.dod = 'عمق تخلیه نمی‌تواند بیشتر از ۱۰۰ باشد';
    if (inputs.systemLoss > 100) newErrors.systemLoss = 'تلفات سیستم نمی‌تواند بیشتر از ۱۰۰ باشد';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs, appliances]);

  const calculateSystem = () => {
    if (!validateInputs()) {
      setResults(null);
      return;
    }

    const totalConsumptionWh = appliances.reduce((sum, app) => sum + app.power * app.quantity * app.hours, 0);
    const peakLoadW = appliances.reduce((sum, app) => sum + app.power * app.quantity, 0);

    const requiredDailyProductionWh = totalConsumptionWh / (1 - inputs.systemLoss / 100);
    const requiredPanelCount = Math.ceil(requiredDailyProductionWh / (inputs.panelWattage * inputs.sunHours));
    
    // Inverter size is 25% larger than peak load for safety
    const requiredInverterSizeW = Math.ceil(peakLoadW * 1.25);

    // Battery calculations
    const batteryBankWh = (totalConsumptionWh * inputs.autonomyDays) / (inputs.dod / 100);
    const totalBatteryCapacityAh = batteryBankWh / inputs.systemVoltage;

    const batteriesInSeries = Math.round(inputs.systemVoltage / inputs.batteryVoltage);
    const requiredStrings = Math.ceil(totalBatteryCapacityAh / inputs.batteryCapacity);
    const totalBatteries = batteriesInSeries * requiredStrings;

    const consumptionBreakdown = appliances
        .filter(a => a.power * a.quantity * a.hours > 0)
        .map(app => ({
            name: app.name,
            value: app.power * app.quantity * app.hours,
        }));
    
    // Assuming average panel size is 1.7m * 1m = 1.7 sqm
    const totalPanelArea = requiredPanelCount * 1.7;

    setResults({
      totalConsumptionWh,
      totalConsumptionKWh: totalConsumptionWh / 1000,
      peakLoadW,
      requiredDailyProductionWh,
      requiredPanelCount,
      requiredInverterSizeW,
      totalBatteryCapacityAh,
      batteriesInSeries,
      stringsInParallel: requiredStrings,
      totalBatteries,
      totalPanelArea: parseFloat(totalPanelArea.toFixed(2)),
      consumptionBreakdown,
    });

    // Scroll to results
    setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const renderApplianceInputs = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">لیست لوازم برقی</h3>
      {appliances.map((app, index) => (
        <div key={app.id} className="grid grid-cols-1 gap-4 rounded-lg border bg-gray-50 p-4 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">نام وسیله</label>
            <input type="text" value={app.name} onChange={e => handleApplianceChange(app.id, 'name', e.target.value)} className={`block w-full rounded-lg border p-2 text-gray-900 ${errors[`app_name_${app.id}`] ? 'border-red-500' : 'border-gray-300'}`} placeholder="مثال: یخچال" />
             {errors[`app_name_${app.id}`] && <p className="mt-1 text-xs text-red-600">{errors[`app_name_${app.id}`]}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">توان (وات)</label>
            <input type="number" value={app.power} onChange={e => handleApplianceChange(app.id, 'power', parseInt(e.target.value) || 0)} className={`block w-full rounded-lg border p-2 text-gray-900 ${errors[`app_power_${app.id}`] ? 'border-red-500' : 'border-gray-300'}`} />
             {errors[`app_power_${app.id}`] && <p className="mt-1 text-xs text-red-600">{errors[`app_power_${app.id}`]}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">تعداد</label>
            <input type="number" value={app.quantity} onChange={e => handleApplianceChange(app.id, 'quantity', parseInt(e.target.value) || 0)} className={`block w-full rounded-lg border p-2 text-gray-900 ${errors[`app_quantity_${app.id}`] ? 'border-red-500' : 'border-gray-300'}`} />
            {errors[`app_quantity_${app.id}`] && <p className="mt-1 text-xs text-red-600">{errors[`app_quantity_${app.id}`]}</p>}
          </div>
          <div className="flex items-end gap-2">
             <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ساعت/روز</label>
                <input type="number" value={app.hours} onChange={e => handleApplianceChange(app.id, 'hours', parseFloat(e.target.value) || 0)} className={`block w-full rounded-lg border p-2 text-gray-900 ${errors[`app_hours_${app.id}`] ? 'border-red-500' : 'border-gray-300'}`} />
                {errors[`app_hours_${app.id}`] && <p className="mt-1 text-xs text-red-600">{errors[`app_hours_${app.id}`]}</p>}
            </div>
            <button onClick={() => removeAppliance(app.id)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      ))}
      <button onClick={addAppliance} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">+ افزودن وسیله جدید</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">محاسبه‌گر سیستم برق خورشیدی</h1>
          <p className="text-sm text-gray-500">مشخصات مصرف و سیستم خود را وارد کنید تا نیازمندی‌های شما را محاسبه کنیم.</p>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            
            {/* Appliance Inputs */}
            <div className="md:col-span-2">
              {renderApplianceInputs()}
            </div>

            {/* System Parameters */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">موقعیت و پنل‌ها</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputField id="sunHours" label="ساعات اوج آفتاب" type="number" value={inputs.sunHours} onChange={handleInputChange} unit="ساعت" tooltip="میانگین ساعات تابش مستقیم و موثر خورشید در روز در منطقه شما." error={errors.sunHours} />
                    <InputField id="panelWattage" label="توان هر پنل" type="number" value={inputs.panelWattage} onChange={handleInputChange} unit="وات" tooltip="توانی که یک پنل خورشیدی در شرایط استاندارد تولید می‌کند." error={errors.panelWattage} />
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">باتری و ذخیره‌سازی</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputField id="autonomyDays" label="روزهای پشتیبانی" type="number" value={inputs.autonomyDays} onChange={handleInputChange} unit="روز" tooltip="تعداد روزهایی که سیستم باید بدون آفتاب، برق را تامین کند." error={errors.autonomyDays} />
                    <InputField id="dod" label="عمق تخلیه مجاز (DoD)" type="number" value={inputs.dod} onChange={handleInputChange} unit="%" tooltip="حداکثر درصدی از ظرفیت باتری که مجاز به استفاده از آن هستید (معمولا ۸۰٪ برای لیتیوم و ۵۰٪ برای سربی-اسیدی)." error={errors.dod}/>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <InputField id="systemVoltage" label="ولتاژ سیستم" type="number" value={inputs.systemVoltage} onChange={handleInputChange} unit="ولت" tooltip="ولتاژ کلی سیستم (معمولا ۱۲، ۲۴ یا ۴۸ ولت)." error={errors.systemVoltage} />
                    <InputField id="batteryCapacity" label="ظرفیت هر باتری" type="number" value={inputs.batteryCapacity} onChange={handleInputChange} unit="آمپر-ساعت" tooltip="ظرفیت نامی هر باتری در بانک باتری شما." error={errors.batteryCapacity}/>
                    <InputField id="batteryVoltage" label="ولتاژ هر باتری" type="number" value={inputs.batteryVoltage} onChange={handleInputChange} unit="ولت" tooltip="ولتاژ نامی هر باتری (معمولا ۱۲ ولت)." error={errors.batteryVoltage} />
                </div>
            </div>

            <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">پارامترهای فنی</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 mt-4">
                    <InputField id="systemLoss" label="تلفات کل سیستم" type="number" value={inputs.systemLoss} onChange={handleInputChange} unit="%" tooltip="مجموع تلفات انرژی در سیستم به دلیل کابل‌کشی، اینورتر، گرد و غبار و دما (معمولا بین ۲۰٪ تا ۲۵٪)." error={errors.systemLoss}/>
                </div>
            </div>

          </div>

          <div className="mt-8 border-t pt-6 text-center">
            <button onClick={calculateSystem} className="rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              محاسبه کن
            </button>
          </div>
        </div>

        {results && (
          <div id="results-section" className="mt-10 rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">نتایج محاسبات سیستم خورشیدی</h2>
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <ResultCard icon={<SunIcon />} title="تعداد پنل مورد نیاز" value={String(results.requiredPanelCount)} unit="عدد" />
              <ResultCard icon={<InverterIcon />} title="توان اینورتر" value={(results.requiredInverterSizeW / 1000).toFixed(2)} unit="کیلووات" description={`حداقل ${results.requiredInverterSizeW} وات`} />
              <ResultCard icon={<BatteryIcon />} title="تعداد باتری" value={String(results.totalBatteries)} unit="عدد" description={`${results.batteriesInSeries} سری و ${results.stringsInParallel} موازی`} />
              <ResultCard icon={<AreaIcon />} title="فضای مورد نیاز پنل‌ها" value={String(results.totalPanelArea)} unit="متر مربع" description="تخمین بر اساس پنل‌های استاندارد"/>
            </div>
            
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              <div className="rounded-lg border bg-gray-50 p-6 lg:col-span-2">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">خلاصه مشخصات</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex justify-between border-b pb-2"><span>مصرف کل روزانه:</span> <span className="font-semibold">{results.totalConsumptionKWh.toFixed(2)} کیلووات‌ساعت</span></li>
                  <li className="flex justify-between border-b pb-2"><span>بار پیک (حداکثر توان لحظه‌ای):</span> <span className="font-semibold">{results.peakLoadW.toLocaleString()} وات</span></li>
                  <li className="flex justify-between border-b pb-2"><span>تولید روزانه مورد نیاز پنل‌ها:</span> <span className="font-semibold">{(results.requiredDailyProductionWh / 1000).toFixed(2)} کیلووات‌ساعت</span></li>
                  <li className="flex justify-between border-b pb-2"><span>ظرفیت کل بانک باتری:</span> <span className="font-semibold">{results.totalBatteryCapacityAh.toFixed(0)} آمپر-ساعت</span></li>
                  <li className="flex justify-between"><span>ولتاژ سیستم:</span> <span className="font-semibold">{inputs.systemVoltage} ولت</span></li>
                </ul>
              </div>
              <div className="rounded-lg border bg-gray-50 p-6 lg:col-span-3">
                 <h3 className="mb-4 text-lg font-semibold text-center text-gray-800">نمودار تفکیک مصرف انرژی (وات-ساعت)</h3>
                 <div className="h-64 w-full">
                     <ResponsiveContainer>
                        <PieChart>
                            <Pie data={results.consumptionBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {results.consumptionBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: number) => `${value.toLocaleString()} وات-ساعت`}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>
             <div className="mt-8 text-center">
              <button onClick={() => window.print()} className="rounded-lg bg-gray-700 px-6 py-2 text-white hover:bg-gray-800">
                چاپ یا ذخیره گزارش
              </button>
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-12 bg-white py-4 text-center text-sm text-gray-500 shadow-inner">
        <p>طراحی شده برای محاسبه سریع سیستم‌های خورشیدی خانگی</p>
      </footer>
    </div>
  );
}

export default App;
