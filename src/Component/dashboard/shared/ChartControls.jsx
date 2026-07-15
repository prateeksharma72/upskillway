import React from 'react';

const ChartControls = ({
  isTimeSeriesApi,
  chartDataLength,
  chartType,
  onChartTypeChange,
  brushDomain,
  onResetZoom,
}) => {
  if (!isTimeSeriesApi || chartDataLength === 0) return null;

  const buttons = [
    { type: 'none', label: 'None' },
    { type: 'line', label: 'Line (Standard)' },
    { type: 'candlestick', label: 'Candlestick (Technical)' },
  ];

  const isZoomActive = brushDomain.startIndex !== null || brushDomain.endIndex !== null;
  const isNotFullRange = chartDataLength > 0 && (
      brushDomain.startIndex !== 0 ||
      brushDomain.endIndex !== (chartDataLength - 1)
  );
  const showResetButton = isZoomActive && isNotFullRange;

  return (
    <div className="chart-controls" style={{ margin: '20px 0', textAlign: 'center' }}>
      <h4>Chart Type:</h4>
      {buttons.map(btn => (
        <button
          key={btn.type}
          onClick={() => onChartTypeChange(btn.type)}
          className={`chart-type-button ${chartType === btn.type ? 'active' : ''}`}
          disabled={chartType === btn.type}
          style={{ marginRight: '10px' }}
        >
          {btn.label}
        </button>
      ))}
      {showResetButton && (
        <button
          onClick={onResetZoom}
          className="action-button"
          style={{ marginLeft: '20px' }}
        >
          Reset Zoom
        </button>
      )}
    </div>
  );
};

export default ChartControls;