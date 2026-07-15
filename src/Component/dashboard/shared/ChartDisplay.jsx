import React, { useRef } from 'react';
import {
  ResponsiveContainer, LineChart, Line, ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Brush, Cell, Scatter,
} from 'recharts';
import html2canvas from 'html2canvas';
import { FaCamera } from "react-icons/fa6";
// REMOVE THIS LINE: import { CustomLineChartTooltip, CustomCandlestickTooltip, CandlestickShape } from '../investmentToolsUtils';

const ChartDisplay = ({
  chartType,
  displayedChartData,
  chartData,
  brushDomain,
  onBrushUpdate,
  onWheelZoom,
  chartBaseTitle,
  symbol,
  onScreenshot,
  onBuyNow,
  // Accept components as props
  candlestickShapeComponent: CandlestickShape, // Renaming prop to CandlestickShape for internal use
  customLineTooltipComponent: CustomLineChartTooltip, // Renaming prop
  customCandlestickTooltipComponent: CustomCandlestickTooltip, // Renaming prop
}) => {
  const chartContainerRef = useRef(null);

  // Ensure the components passed as props are valid before rendering
  if (chartType === 'none' || !displayedChartData || displayedChartData.length === 0 ||
      typeof CandlestickShape !== 'function' || 
      typeof CustomLineChartTooltip !== 'function' || 
      typeof CustomCandlestickTooltip !== 'function') {
    // console.warn("ChartDisplay: Missing required props or components", {chartType, displayedChartData, CandlestickShape, CustomLineChartTooltip, CustomCandlestickTooltip});
    return null;
  }

  const formatDateTick = (tick) => tick ? new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  const commonXAxisProps = { dataKey: "date", tickFormatter: formatDateTick, angle: -45, textAnchor: "end", height: 70, interval: "preserveStartEnd" };

  const commonBrushProps = {
    dataKey: "date",
    height: 30,
    stroke: "#8884d8",
    tickFormatter: formatDateTick,
    children: <LineChart data={chartData}><Line dataKey="close" stroke="#8884d8" dot={false} type="monotone" /></LineChart>,
    onChange: onBrushUpdate,
    startIndex: brushDomain.startIndex !== null ? brushDomain.startIndex : 0,
    endIndex: brushDomain.endIndex !== null ? brushDomain.endIndex : Math.max(0, chartData.length - 1),
    key: `brush-${chartData.length}-${brushDomain.startIndex}-${brushDomain.endIndex}`
  };

  const handleInternalScreenshot = async () => {
    if (chartContainerRef.current) {
      try {
        const buyButtonOnGraph = chartContainerRef.current.querySelector('.buy-button-on-graph');
        let originalDisplay = '';
        if (buyButtonOnGraph) {
          originalDisplay = buyButtonOnGraph.style.display;
          buyButtonOnGraph.style.display = 'none';
        }
        const canvas = await html2canvas(chartContainerRef.current, { useCORS: true, allowTaint: true });
        if (buyButtonOnGraph) {
          buyButtonOnGraph.style.display = originalDisplay;
        }
        onScreenshot(canvas);
      } catch (error) {
        console.error('Error taking screenshot:', error);
        alert('Could not take screenshot.');
      }
    }
  };

  const chartContentHeight = chartType === 'candlestick' ? 600 : 500;

  return (
    <div ref={chartContainerRef} className="chart-wrapper" style={{ marginTop: '20px', width: '100%' }}>
      <div className="chart-header">
        <h3>{`${chartBaseTitle} - ${chartType === 'line' ? 'Line Chart (Close Price)' : 'Candlestick Chart'}`}</h3>
        <div className="chart-actions-header">
            <button onClick={handleInternalScreenshot} className="action-button screenshot-button" title="Download Chart"><FaCamera /></button>
        </div>
        <br />
        <button onClick={onBuyNow} className="action-button buy-button-on-graph">Buy {symbol.toUpperCase()}</button>
      </div>
      <div
        className="chart-render-area-container"
        style={{ position: 'relative', width: '100%', height: chartContentHeight }}
        onWheel={onWheelZoom}
      >
        <div className="chart-render-area" style={{ width: '100%', height: '100%' }}>
          <ResponsiveContainer>
            {chartType === 'line' ? (
              <LineChart data={displayedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...commonXAxisProps} />
                <YAxis domain={['auto', 'auto']} />
                {/* Use the passed component prop */}
                <Tooltip content={<CustomLineChartTooltip />} /> 
                <Legend />
                <Line type="monotone" dataKey="close" stroke="#9887FF" dot={false} name="Close Price" />
                <Brush {...commonBrushProps} />
              </LineChart>
            ) : (
              <ComposedChart data={displayedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...commonXAxisProps} scale="band" />
                <YAxis yAxisId="price" domain={['auto', 'auto']} label={{ value: 'Stock Price ($)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="volume" orientation="right" domain={['auto', 'auto']} label={{ value: 'Volume', angle: 90, position: 'insideRight' }} />
                {/* Use the passed component prop */}
                <Tooltip content={<CustomCandlestickTooltip />} /> 
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                {/* Use the passed component prop */}
                <Scatter yAxisId="price" dataKey="close" name="OHLC" shape={<CandlestickShape />} /> 
                <Bar yAxisId="volume" dataKey="volume" name="Volume" barSize={20}>
                  {displayedChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.close != null && entry.open != null && entry.close >= entry.open ? 'rgba(0, 204, 150, 0.5)' : 'rgba(239, 85, 59, 0.5)'} />
                  ))}
                </Bar>
                <Brush {...commonBrushProps} yAxisId="price" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartDisplay;