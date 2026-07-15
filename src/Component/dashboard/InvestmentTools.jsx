import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. IMPORT useNavigate
import {
  ResponsiveContainer, LineChart, Line, ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Brush, Cell, Scatter,
} from 'recharts';
import html2canvas from 'html2canvas';
import { FaCamera } from "react-icons/fa6";

import useFetchData from './hooks/useFetchData';
import useChartZoom from './hooks/useChartZoom';
import DataCard from './shared/DataCard';
import DataTable from './shared/DataTable';
import LoadingSpinner from './shared/LoadingSpinner';
import ErrorMessage from './shared/ErrorMessage';
import InputForm from './shared/InputForm';
import Sidebar from './Sidebar';
import ChartDisplay from './shared/ChartDisplay';
import ChartControls from './shared/ChartControls';
import BuyStockModal from './shared/BuyStockModal';
import './Style/InvestmentTools.scss';

const baseUrl = process.env.REACT_APP_API_BASE_URL;

// --- Define Constants directly in this file ---
const API_OPTIONS = [
  { value: 'globalQuote', label: 'Global Quote' }, { value: 'intraday', label: 'Intraday Data' },
  { value: 'daily', label: 'Daily Data' }, { value: 'dailyAdjusted', label: 'Daily Adjusted Data' },
  { value: 'weekly', label: 'Weekly Data' }, { value: 'weeklyAdjusted', label: 'Weekly Adjusted Data' },
  { value: 'monthly', label: 'Monthly Data' }, { value: 'monthlyAdjusted', label: 'Monthly Adjusted Data' },
];

const API_ENDPOINTS = {
    globalQuote: 'quote', intraday: 'intraday', daily: 'daily', dailyAdjusted: 'daily-adjusted',
    weekly: 'weekly', weeklyAdjusted: 'weekly-adjusted', monthly: 'monthly', monthlyAdjusted: 'monthly-adjusted',
};

// --- Embedded Utility Functions and Components ---
const formatToLocaleString = (value) => {
  if (value == null || String(value).trim() === "") return '-';
  if (typeof value === 'string' && value.includes('-') && (value.length === 10 || value.length === 19)) {
    return value;
  }
  const number = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(number) ? String(value) : number.toLocaleString();
};
const formatNumberToFixed = (value, digits = 2) => {
  if (value == null || String(value).trim() === "") return '-';
  const number = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(number) ? String(value) : number.toFixed(digits);
};
const CELL_FORMATTERS = {
    'Volume': formatToLocaleString, 'Timestamp': formatToLocaleString, 'Date': formatToLocaleString,
    'Dividend Amt': (val) => formatNumberToFixed(val, 4), 'Split Coeff.': (val) => formatNumberToFixed(val, 1),
    'default': (val) => formatNumberToFixed(val, 2),
};
const debugCellRenderer = (columnName) => (cellProps) => {
    const valueToFormat = cellProps && typeof cellProps === 'object' && 'value' in cellProps ? cellProps.value : cellProps;
    if (valueToFormat == null) {
        return "VALUE_UNDEF_OR_NULL";
    }
    try {
        const formatter = CELL_FORMATTERS[columnName] || CELL_FORMATTERS.default;
        return formatter(valueToFormat);
    } catch (e) {
        console.error(`[DebugCellRenderer - ${columnName}] Error formatting value "${valueToFormat}":`, e);
        return "FORMAT_ERR";
    }
};
const CandlestickShape = (props) => {
  const { cx, payload, yAxis, xAxis, index } = props;
  if (!yAxis || !payload || !xAxis || !xAxis.scale || !yAxis.scale) return null;
  const { open: pOpen, high: pHigh, low: pLow, close: pClose } = payload;
  if ([pOpen, pHigh, pLow, pClose].some(val => typeof val !== 'number' || isNaN(val))) return null;
  const yOpenVal = yAxis.scale(pOpen);
  const yHighVal = yAxis.scale(pHigh);
  const yLowVal = yAxis.scale(pLow);
  const yCloseVal = yAxis.scale(pClose);
  const isBullish = pClose >= pOpen;
  const color = isBullish ? '#00CC96' : '#EF553B';
  let bandWidth = 5;
  if (typeof xAxis.bandwidth === 'function') bandWidth = xAxis.bandwidth();
  else if (xAxis.domain && Array.isArray(xAxis.domain) && xAxis.width) bandWidth = xAxis.width / (xAxis.domain.length || 1);
  const candlePixelWidth = Math.max(2, bandWidth * 0.6 || 5);
  return (
    <g key={`candle-${index || cx}`}>
      <line x1={cx} y1={yHighVal} x2={cx} y2={yLowVal} stroke={color} strokeWidth={1} />
      <rect x={cx - candlePixelWidth / 2} y={Math.min(yOpenVal, yCloseVal)} width={candlePixelWidth} height={Math.max(1, Math.abs(yOpenVal - yCloseVal))} fill={color} />
    </g>
  );
};
const CustomLineChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataEntry = payload[0].payload;
    return (
      <div className="custom-recharts-tooltip">
        <p className="recharts-tooltip-label">{label ? new Date(label).toLocaleDateString() : ''}</p>
        <ul className="recharts-tooltip-item-list" style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {dataEntry.open != null && <li>{`Open: ${formatNumberToFixed(dataEntry.open)}`}</li>}
          {dataEntry.high != null && <li>{`High: ${formatNumberToFixed(dataEntry.high)}`}</li>}
          {dataEntry.low != null && <li>{`Low: ${formatNumberToFixed(dataEntry.low)}`}</li>}
          {dataEntry.close != null && <li>{`Close: ${formatNumberToFixed(dataEntry.close)}`}</li>}
          {dataEntry.volume != null && <li>{`Volume: ${formatToLocaleString(dataEntry.volume)}`}</li>}
        </ul>
      </div>
    );
  }
  return null;
};
const CustomCandlestickTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataEntry = payload.find(p => p.name === 'OHLC')?.payload || payload[0]?.payload;
    if (!dataEntry) return null;
    return (
      <div className="custom-recharts-tooltip">
        <p className="recharts-tooltip-label">{label ? new Date(label).toLocaleDateString() : ''}</p>
        <ul className="recharts-tooltip-item-list" style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {dataEntry.open != null && <li>{`Open: ${formatNumberToFixed(dataEntry.open)}`}</li>}
          {dataEntry.high != null && <li>{`High: ${formatNumberToFixed(dataEntry.high)}`}</li>}
          {dataEntry.low != null && <li>{`Low: ${formatNumberToFixed(dataEntry.low)}`}</li>}
          {dataEntry.close != null && <li>{`Close: ${formatNumberToFixed(dataEntry.close)}`}</li>}
          {dataEntry.volume != null && <li>{`Volume: ${formatToLocaleString(dataEntry.volume)}`}</li>}
        </ul>
      </div>
    );
  }
  return null;
};

// Plans Component - MODIFIED to accept navigate as prop
const PlansSection = ({ authToken, navigate }) => {
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);

  const fetchPlans = async () => {
    if (!authToken || !baseUrl) {
      setPlansError("Authentication token or base URL missing.");
      return;
    }

    setPlansLoading(true);
    setPlansError(null);

    try {
      const response = await fetch(`${baseUrl}/api/plans`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlansError(`Failed to fetch plans: ${error.message}`);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [authToken]);

  // MODIFIED handlePlanSelect to navigate to payment page
  const handlePlanSelect = (plan) => {
    if (!plan || !plan.price || plan.price <= 0) {
      alert("Cannot proceed with plan selection due to invalid plan data.");
      return;
    }

    const planDetails = {
      planId: plan.id,
      planName: plan.name,
      price: parseFloat(plan.price),
      description: plan.description || 'No description available',
      totalCost: parseFloat(plan.price),
      type: 'plan', // To distinguish from stock purchases
      createdAt: plan.createdAt
    };
    
    console.log("Navigating to payment page with plan details:", planDetails);

    // Navigate to payment page with plan details
    navigate('/dashboard/payment', { 
      state: { 
        purchaseDetails: planDetails,
        isPlanPurchase: true // Flag to indicate this is a plan purchase
      } 
    });
  };

  if (plansLoading) {
    return (
      <div className="plans-section">
        <h3>Investment Plans</h3>
        <div className="plans-loading">
          <LoadingSpinner />
          <p>Loading investment plans...</p>
        </div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="plans-section">
        <h3>Investment Plans</h3>
        <ErrorMessage message={plansError} />
      </div>
    );
  }

  return (
    <div className="plans-section">
      <h3>Investment Plans</h3>
      {plans.length === 0 ? (
        <div className="no-plans">
          <p>No investment plans available at the moment.</p>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <div className="plan-header">
                <h4>{plan.name}</h4>
                <div className="plan-price">₹{formatToLocaleString(plan.price)}</div>
              </div>
              <div className="plan-description">
                {plan.description || 'No description available'}
              </div>
              <div className="plan-features">
                {plan.features && Array.isArray(plan.features) && (
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="plan-meta">
                <small>Plan ID: {plan.id}</small>
                <small>Created: {new Date(plan.createdAt).toLocaleDateString()}</small>
              </div>
              <button 
                className="plan-select-btn"
                onClick={() => handlePlanSelect(plan)}
              >
                Select Plan - ₹{formatToLocaleString(plan.price)}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

if (!baseUrl) {
  console.error("CRITICAL ERROR: REACT_APP_API_BASE_URL is not defined.");
}

const InvestmentTools = () => {
  const navigate = useNavigate(); // <-- 2. INITIALIZE the navigate hook

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [currentPriceForModal, setCurrentPriceForModal] = useState(null);
  const [authToken] = useState(localStorage.getItem("authToken"));
  const [authChecked, setAuthChecked] = useState(false);
  const [activeApi, setActiveApi] = useState(API_OPTIONS[0].value);
  const [symbol, setSymbol] = useState('AAPL');
  const [intradayInterval, setIntradayInterval] = useState('5min');
  const [timeSeriesOutputSize, setTimeSeriesOutputSize] = useState('compact');
  const [chartType, setChartType] = useState('line');
  const [activeTab, setActiveTab] = useState('tools'); // New state for tab switching
  const { data, loading, error, makeRequest, clear } = useFetchData(authToken);
  const isTimeSeriesApi = !['globalQuote'].includes(activeApi);
  const chartData = useMemo(() => {
    if (!data?.data || !isTimeSeriesApi || !Array.isArray(data.data) || data.data.length === 0) return [];
    const dateKey = activeApi === 'intraday' ? 'timestamp' : 'date';
    return data.data
      .filter(item => item?.[dateKey] != null)
      .map(d => ({
        date: d[dateKey],
        open: d.open != null ? parseFloat(d.open) : null,
        high: d.high != null ? parseFloat(d.high) : null,
        low: d.low != null ? parseFloat(d.low) : null,
        close: d.close != null ? parseFloat(d.close) : null,
        volume: d.volume != null ? parseInt(d.volume, 10) : null,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data, isTimeSeriesApi, activeApi]);

  const { brushDomain, handleBrushUpdate, handleWheelZoom, resetZoom, setBrushDomain } = useChartZoom(chartData);

  useEffect(() => { 
    if (chartData.length > 0) { resetZoom(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData]); 

  const displayedChartData = useMemo(() => {
    if (brushDomain.startIndex !== null && brushDomain.endIndex !== null && chartData.length > 0) {
      const start = Math.max(0, brushDomain.startIndex);
      const end = Math.min(chartData.length - 1, brushDomain.endIndex);
      if (start <= end) return chartData.slice(start, end + 1);
    }
    return chartData;
  }, [chartData, brushDomain]);

  useEffect(() => {
    if (!authToken) console.warn("[InvestmentTools] No authentication token found.");
    setAuthChecked(true);
  }, [authToken]);

  const handleApiChange = (newApiType) => {
    setActiveApi(newApiType); clear(); setChartType('line');
    setSymbol((newApiType === 'monthly' || newApiType === 'monthlyAdjusted') ? 'IBM' : 'AAPL');
    setIntradayInterval('5min'); setTimeSeriesOutputSize('compact');
    setBrushDomain({ startIndex: null, endIndex: null }); 
  };
  const handleSubmit = (formData) => {
    if (!authToken || !baseUrl) { console.error("[InvestmentTools] Auth token or Base URL missing."); return; }
    setChartType('line'); 
    const currentSymbol = formData.symbol?.trim().toUpperCase() || symbol; setSymbol(currentSymbol);
    const apiPrefix = '/api/market'; let path = `/${API_ENDPOINTS[activeApi]}/${currentSymbol}`;
    if (activeApi === 'intraday') {
        const interval = formData.interval?.trim() || intradayInterval; setIntradayInterval(interval); path += `/${interval}`;
    } else if (['daily', 'dailyAdjusted'].includes(activeApi)) {
        const oSize = formData.outputsize?.trim() || timeSeriesOutputSize; setTimeSeriesOutputSize(oSize); path += `/${oSize}`;
    }
    if (!API_ENDPOINTS[activeApi]) { console.error('[InvestmentTools] Unknown API type:', activeApi); return; }
    setBrushDomain({ startIndex: null, endIndex: null }); 
    makeRequest(`${baseUrl}${apiPrefix}${path}`);
  };
  const getFormFields = () => {
    const fields = [{ name: 'symbol', label: 'Stock Symbol', defaultValue: symbol, placeholder: 'e.g., AAPL or IBM' }];
    if (activeApi === 'intraday') {
      fields.push({ name: 'interval', label: 'Interval', defaultValue: intradayInterval, placeholder: '1min, 5min, 15min, 30min, 60min' });
    } else if (['daily', 'dailyAdjusted'].includes(activeApi)) {
      fields.push({ name: 'outputsize', label: 'Output Size', defaultValue: timeSeriesOutputSize, placeholder: 'compact or full' });
    }
    return fields;
  };
  const getTableColumns = () => {
    const dateAccessor = activeApi === 'intraday' ? 'timestamp' : 'date';
    const dateHeader = activeApi === 'intraday' ? 'Timestamp' : 'Date';
    const baseCols = [
      { Header: dateHeader, accessor: dateAccessor, Cell: debugCellRenderer(dateHeader) },
      { Header: 'Open', accessor: 'open', Cell: debugCellRenderer('Open') },
      { Header: 'High', accessor: 'high', Cell: debugCellRenderer('High') },
      { Header: 'Low', accessor: 'low', Cell: debugCellRenderer('Low') },
      { Header: 'Close', accessor: 'close', Cell: debugCellRenderer('Close') },
    ];
    const volumeCol = { Header: 'Volume', accessor: 'volume', Cell: debugCellRenderer('Volume') };
    const adjCloseCol = { Header: 'Adjusted Close', accessor: 'adjustedClose', Cell: debugCellRenderer('Adjusted Close') };
    const dividendCol = { Header: 'Dividend Amt', accessor: 'dividendAmount', Cell: debugCellRenderer('Dividend Amt') };
    const splitCol = { Header: 'Split Coeff.', accessor: 'splitCoefficient', Cell: debugCellRenderer('Split Coeff.') };
    if (!isTimeSeriesApi) return []; let columns = [...baseCols];
    if (activeApi.includes('Adjusted')) columns.push(adjCloseCol);
    columns.push(volumeCol);
    if (activeApi.includes('Adjusted')) columns.push(dividendCol);
    if (activeApi === 'dailyAdjusted') columns.push(splitCol);
    return columns;
  };
  const getTableTitle = () => {
    const apiLabel = API_OPTIONS.find(opt => opt.value === activeApi)?.label || 'Data';
    let displayedSym = symbol;
    if (activeApi === 'globalQuote' && data?.symbol) displayedSym = data.symbol;
    else if (data?.metaData?.['2. Symbol']) displayedSym = data.metaData['2. Symbol'];
    let title = `${apiLabel} for ${displayedSym.toUpperCase()}`;
    if (activeApi === 'intraday' && data?.metaData?.['4. Interval']) title += ` (${data.metaData['4. Interval']})`;
    return title;
  };
  const handleOpenBuyModal = () => {
    let price = null;
    const latestDisplayedPoint = displayedChartData?.length > 0 ? displayedChartData[displayedChartData.length - 1] : null;
    if (activeApi === 'globalQuote' && data?.price) price = parseFloat(data.price);
    else if (latestDisplayedPoint && latestDisplayedPoint.close != null) price = parseFloat(latestDisplayedPoint.close);
    else if (chartData?.length > 0) {
      const latestDataPoint = chartData[chartData.length - 1];
      if (latestDataPoint && latestDataPoint.close != null) price = parseFloat(latestDataPoint.close);
    }
    if (price == null) { alert(`Could not determine the current price for ${symbol.toUpperCase()}.`); return; }
    setCurrentPriceForModal(price);
    setIsBuyModalOpen(true);
  };

  // --- 3. STOCK PURCHASE FUNCTION ---
  const handleConfirmBuy = (quantity) => {
    if (!currentPriceForModal || quantity <= 0) {
        alert("Cannot proceed with purchase due to invalid price or quantity.");
        return;
    }
    const totalCost = quantity * currentPriceForModal;
    const purchaseDetails = {
      symbol: symbol.toUpperCase(),
      quantity,
      price: currentPriceForModal,
      totalCost,
      type: 'stock' // To distinguish from plan purchases
    };
    
    console.log("Navigating to payment page with stock details:", purchaseDetails);

    // Use navigate to go to the '/payment' route and pass the data in the state
    navigate('/dashboard/payment', { 
      state: { 
        purchaseDetails,
        isPlanPurchase: false // Flag to indicate this is a stock purchase
      } 
    });
  };

  const handleScreenshotDownload = (canvas) => {
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    const safeSymbol = symbol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeSymbol}_${chartType}_chart_${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDataContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data) return <p className="no-data-message">Select API and parameters to fetch data.</p>;
    if (activeApi === 'globalQuote') {
      if (!data || Object.keys(data).length === 0) return <p className="no-data-message">No Global Quote data.</p>;
      const displayData = Object.fromEntries(
        Object.entries({
          "Symbol": data.symbol, "Open": data.open, "High": data.high, "Low": data.low,
          "Price": data.price, "Volume": data.volume, "Latest Trading Day": data.latestTradingDay,
          "Previous Close": data.previousClose, "Change": data.change, "Change Percent": data.changePercent
        }).map(([key, value]) => {
          if (key === "Volume") return [key, formatToLocaleString(value)];
          if (["Latest Trading Day", "Symbol", "Change Percent"].includes(key)) return [key, value == null ? '-' : value];
          return [key, formatNumberToFixed(value, 2)];
        })
      );
      return <DataCard title={getTableTitle()} data={displayData} />;
    }
    const tableData = Array.isArray(data.data) ? data.data.filter(item => item != null) : [];
    return (
      <>
        {data.metaData && <DataCard title="Metadata" data={data.metaData} />}
        {isTimeSeriesApi && chartData.length > 0 ? (
          <>
            <ChartControls
              isTimeSeriesApi={isTimeSeriesApi}
              chartDataLength={chartData.length}
              chartType={chartType}
              onChartTypeChange={setChartType}
              brushDomain={brushDomain}
              onResetZoom={resetZoom}
            />
            <ChartDisplay
              chartType={chartType} displayedChartData={displayedChartData} chartData={chartData}
              brushDomain={brushDomain} onBrushUpdate={handleBrushUpdate} onWheelZoom={handleWheelZoom}
              chartBaseTitle={getTableTitle().replace(' for ', ' Chart for ')} symbol={symbol}
              onScreenshot={handleScreenshotDownload} onBuyNow={handleOpenBuyModal}
              candlestickShapeComponent={CandlestickShape}
              customLineTooltipComponent={CustomLineChartTooltip}
              customCandlestickTooltipComponent={CustomCandlestickTooltip}
            />
            <DataTable columns={getTableColumns()} data={tableData} itemsPerPage={15} title={getTableTitle()} />
          </>
        ) : (isTimeSeriesApi && <p className="no-data-message">No time series data available for the selected parameters, or chart type is 'None'.</p>)}
        {!isTimeSeriesApi && !data.data && <p className="no-data-message">No data available for the selected API.</p>}
      </>
    );
  };

  if (!authChecked) return <LoadingSpinner />;
  if (!authToken && !['/login', '/register'].includes(window.location.pathname)) {
    return (
      <div className="dashboard-page investment-tools-page">
        <Sidebar />
        <div className="auth-message-container" style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Access Denied</h2><ErrorMessage message="You need to be logged in to use the Investment Tools." />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page investment-tools-page">
      <div className='main-content-investment-tool'>
        <Sidebar />
        <div className="tool-container">
          <h2>Investment Tool</h2>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('tools')}
            >
              Trading Tools
            </button>
            <button 
              className={`tab-button ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              Investment Plans
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'tools' ? (
            <>
              <div className="api-selector">
                <select id="api-select" value={activeApi} onChange={(e) => handleApiChange(e.target.value)}>
                  {API_OPTIONS.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                </select>
              </div>
              <InputForm
                key={activeApi}
                fields={getFormFields()}
                onSubmit={handleSubmit}
                isLoading={loading}
                buttonText={`Fetch ${API_OPTIONS.find(opt => opt.value === activeApi)?.label || 'Data'}`}
              />
              <div className="data-display-area">
                {renderDataContent()}
              </div>
            </>
          ) : (
            <PlansSection authToken={authToken} navigate={navigate} />
          )}
        </div>
      </div>
      <BuyStockModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        symbol={symbol}
        currentPrice={currentPriceForModal}
        onSubmit={handleConfirmBuy}
      />
    </div>
  );
};

export default InvestmentTools;
