import { useState, useEffect, useCallback } from 'react';

const MIN_ZOOM_POINTS = 10; // Minimum number of data points to display when zoomed in

const useChartZoom = (chartData = []) => {
  const [brushDomain, setBrushDomainState] = useState({ startIndex: null, endIndex: null });

  const resetZoom = useCallback(() => {
    setBrushDomainState({ startIndex: null, endIndex: null });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (brushDomain.startIndex !== null || brushDomain.endIndex !== null) {
          const isFullRange = brushDomain.startIndex === 0 && 
                              brushDomain.endIndex === Math.max(0, chartData.length - 1);
          const isInitialResetState = brushDomain.startIndex === null && brushDomain.endIndex === null;
          if (!isFullRange && !isInitialResetState) {
            resetZoom();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [brushDomain, chartData, resetZoom]);

  const handleBrushUpdate = useCallback((domain) => {
    if (domain) {
      if (domain.startIndex === 0 && domain.endIndex === chartData.length - 1 && chartData.length > 0) {
        resetZoom();
      } else {
        setBrushDomainState({ startIndex: domain.startIndex, endIndex: domain.endIndex });
      }
    } else {
      resetZoom();
    }
  }, [chartData.length, resetZoom]);

  const handleWheelZoom = useCallback((event) => {
    if (!chartData || chartData.length === 0 || !event.currentTarget) return;
    event.preventDefault();

    const { startIndex: currentStartIndexProp, endIndex: currentEndIndexProp } = brushDomain;
    const currentStartIndex = currentStartIndexProp === null ? 0 : currentStartIndexProp;
    const currentEndIndex = currentEndIndexProp === null ? chartData.length - 1 : currentEndIndexProp;

    const chartRect = event.currentTarget.getBoundingClientRect();
    const mouseXRelative = event.clientX - chartRect.left;
    const mouseRatioInView = Math.max(0, Math.min(1, mouseXRelative / chartRect.width));
    
    const approxDataIndexAtMouse = currentStartIndex + mouseRatioInView * (currentEndIndex - currentStartIndex);
    const zoomFactor = event.deltaY < 0 ? 0.85 : 1.15;
    
    const currentDomainWidth = currentEndIndex - currentStartIndex + 1;
    let newProposedDomainWidth = currentDomainWidth * zoomFactor;
    const effectiveMinPoints = Math.min(MIN_ZOOM_POINTS, chartData.length);

    if (zoomFactor < 1) { // Zooming In
      if (currentDomainWidth <= effectiveMinPoints) {
        setBrushDomainState({ startIndex: currentStartIndex, endIndex: currentEndIndex });
        return;
      }
      newProposedDomainWidth = Math.max(newProposedDomainWidth, effectiveMinPoints);
    } else { // Zooming Out
      newProposedDomainWidth = Math.min(newProposedDomainWidth, chartData.length);
    }

    let newStartIndex = Math.round(approxDataIndexAtMouse - mouseRatioInView * newProposedDomainWidth);
    let newEndIndex = Math.round(newStartIndex + newProposedDomainWidth - 1);

    if (newStartIndex < 0) {
      newStartIndex = 0;
      newEndIndex = Math.min(chartData.length - 1, newStartIndex + Math.round(newProposedDomainWidth) - 1);
    }
    if (newEndIndex >= chartData.length) {
      newEndIndex = chartData.length - 1;
      newStartIndex = Math.max(0, newEndIndex - Math.round(newProposedDomainWidth) + 1);
    }
    if (newStartIndex < 0) newStartIndex = 0;

    const finalWidth = newEndIndex - newStartIndex + 1;
    if (finalWidth < effectiveMinPoints && chartData.length >= effectiveMinPoints) {
        if (newStartIndex === 0) {
            newEndIndex = Math.min(chartData.length - 1, newStartIndex + effectiveMinPoints - 1);
        } else if (newEndIndex === chartData.length - 1) {
            newStartIndex = Math.max(0, newEndIndex - effectiveMinPoints + 1); 
        } else {
            const center = Math.round((newStartIndex + newEndIndex) / 2);
            newStartIndex = Math.max(0, center - Math.floor((effectiveMinPoints -1) / 2));
            newEndIndex = Math.min(chartData.length - 1, newStartIndex + effectiveMinPoints - 1);
            if (newEndIndex === chartData.length - 1) {
               newStartIndex = Math.max(0, newEndIndex - effectiveMinPoints + 1);
            }
        }
    }
    
    if (newStartIndex < 0 || newEndIndex >= chartData.length || newStartIndex > newEndIndex ) {
        console.warn("Wheel zoom resulted in invalid domain after correction:", {newStartIndex, newEndIndex, chartDataLength: chartData.length});
        resetZoom();
        return;
    }

    if (newStartIndex === 0 && newEndIndex === chartData.length - 1) {
      resetZoom();
    } else {
      setBrushDomainState({ startIndex: newStartIndex, endIndex: newEndIndex });
    }
  }, [chartData, brushDomain, resetZoom]);

  return { brushDomain, handleBrushUpdate, handleWheelZoom, resetZoom, setBrushDomain: setBrushDomainState };
};

export default useChartZoom;