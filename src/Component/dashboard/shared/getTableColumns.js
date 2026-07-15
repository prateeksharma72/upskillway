  const getTableColumns = () => {
    switch (activeApi) {
      case 'intraday':
        return [
          { Header: 'Timestamp', accessor: 'timestamp' }, // Assuming useFetchData maps the date/time key to 'timestamp'
          { Header: 'Open', accessor: '1. open', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'High', accessor: '2. high', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Low', accessor: '3. low', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Close', accessor: '4. close', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Volume', accessor: '5. volume', Cell: ({value}) => formatToLocaleString(value) },
        ];
      case 'daily':
      case 'weekly':
      case 'monthly':
        return [
          { Header: 'Date', accessor: 'date' }, // Assuming useFetchData maps the date key to 'date'
          { Header: 'Open', accessor: '1. open', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'High', accessor: '2. high', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Low', accessor: '3. low', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Close', accessor: '4. close', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Volume', accessor: '5. volume', Cell: ({value}) => formatToLocaleString(value) },
        ];
      case 'dailyAdjusted':
        return [
          { Header: 'Date', accessor: 'date' }, // Assuming useFetchData maps the date key to 'date'
          { Header: 'Open', accessor: '1. open', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'High', accessor: '2. high', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Low', accessor: '3. low', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Close', accessor: '4. close', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Adjusted Close', accessor: '5. adjusted close', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Volume', accessor: '6. volume', Cell: ({value}) => formatToLocaleString(value) },
          { Header: 'Dividend Amt', accessor: '7. dividend amount', Cell: ({value}) => formatNumberToFixed(value, 4) },
          { Header: 'Split Coeff.', accessor: '8. split coefficient', Cell: ({value}) => formatNumberToFixed(value, 1) },
        ];
      case 'weeklyAdjusted':
      case 'monthlyAdjusted':
        return [
          { Header: 'Date', accessor: 'date' }, // Assuming useFetchData maps the date key to 'date'
          { Header: 'Open', accessor: '1. open', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'High', accessor: '2. high', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Low', accessor: '3. low', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Close', accessor: '4. close', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Adjusted Close', accessor: '5. adjusted close', Cell: ({value}) => formatNumberToFixed(value) },
          { Header: 'Volume', accessor: '6. volume', Cell: ({value}) => formatToLocaleString(value) },
          { Header: 'Dividend Amt', accessor: '7. dividend amount', Cell: ({value}) => formatNumberToFixed(value, 4) },
        ];
      default:
        return [];
    }
  };